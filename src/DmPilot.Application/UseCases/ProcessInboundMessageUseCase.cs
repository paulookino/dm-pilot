using DmPilot.Application.Interfaces;
using DmPilot.Application.Models;
using DmPilot.Application.Services;
using DmPilot.Domain.Entities;
using DmPilot.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DmPilot.Application.UseCases;

public class ProcessInboundMessageUseCase(
    IDbContextAccessor    db,
    IClaudeClient         claude,
    IInstagramClient      instagram,
    IWhatsAppClient       whatsapp,
    AiContextBuilder      contextBuilder,
    ILogger<ProcessInboundMessageUseCase> logger)
{
    public async Task ExecuteAsync(InboundMessage inbound, CancellationToken ct = default)
    {
        // 1. Encontrar tenant pelo PageId / PhoneNumberId
        var tenant = inbound.Channel == ChannelType.Instagram
            ? await db.Tenants.FirstOrDefaultAsync(t => t.InstagramPageId == inbound.RecipientId, ct)
            : await db.Tenants.FirstOrDefaultAsync(t => t.WhatsAppPhoneNumberId == inbound.RecipientId, ct);

        if (tenant is null)
        {
            logger.LogWarning("Tenant not found for {Channel} {RecipientId}", inbound.Channel, inbound.RecipientId);
            return;
        }

        if (tenant.IsOverQuota())
        {
            logger.LogInformation("Tenant {TenantId} over quota, skipping message", tenant.Id);
            return;
        }

        // 2. Upsert do lead
        var lead = await db.Leads.FirstOrDefaultAsync(
            l => l.TenantId == tenant.Id && l.ExternalId == inbound.SenderId && l.Channel == inbound.Channel, ct);

        if (lead is null)
        {
            lead = new Lead
            {
                TenantId   = tenant.Id,
                ExternalId = inbound.SenderId,
                Channel    = inbound.Channel,
            };

            // Tentar buscar perfil do Instagram
            if (inbound.Channel == ChannelType.Instagram && tenant.InstagramAccessToken is not null)
            {
                var profile = await instagram.GetUserProfileAsync(inbound.SenderId, tenant.InstagramAccessToken, ct);
                if (profile is not null)
                {
                    lead.Name          = profile.Name;
                    lead.ProfilePicUrl = profile.ProfilePic;
                }
            }

            db.Leads.Add(lead);
            await db.SaveAsync(ct);
        }

        lead.LastActivityAt = DateTime.UtcNow;

        // 3. Buscar conversa ativa ou criar
        var conversation = await db.Conversations
            .Include(c => c.Campaign)
            .FirstOrDefaultAsync(c => c.LeadId == lead.Id && c.Status == ConversationStatus.Active, ct);

        if (conversation is null)
        {
            // Encontrar campanha (por keyword ou default)
            var campaign = await FindCampaignAsync(tenant.Id, inbound.Text, ct);

            conversation = new Conversation
            {
                TenantId   = tenant.Id,
                LeadId     = lead.Id,
                Channel    = inbound.Channel,
                CampaignId = campaign?.Id,
                AiEnabled  = true,
            };
            db.Conversations.Add(conversation);
        }

        // 4. Salvar mensagem recebida
        var inboundMsg = new Message
        {
            ConversationId = conversation.Id,
            Direction      = MessageDirection.Inbound,
            Content        = inbound.Text,
            SentAt         = inbound.Timestamp,
        };
        db.Messages.Add(inboundMsg);
        conversation.TotalMessages++;
        conversation.LastMessageAt = DateTime.UtcNow;
        await db.SaveAsync(ct);

        // 5. Gerar e enviar resposta da IA
        if (!conversation.AiEnabled || conversation.Campaign is null)
        {
            // Modo manual — apenas notificar (implementar notificação depois)
            logger.LogInformation("Manual mode for conversation {ConvId}", conversation.Id);
            return;
        }

        // Buscar últimas mensagens para contexto
        var recentMessages = await db.Messages
            .Where(m => m.ConversationId == conversation.Id)
            .OrderByDescending(m => m.SentAt)
            .Take(10)
            .OrderBy(m => m.SentAt)
            .ToListAsync(ct);

        var systemPrompt = contextBuilder.Build(conversation, recentMessages, conversation.Campaign);
        var aiResult     = await claude.CompleteAsync(systemPrompt, inbound.Text, ct);

        if (!aiResult.ShouldSend) return;

        // Injetar link de pagamento se necessário
        var responseText = aiResult.InjectPaymentLink && conversation.Campaign.PaymentUrl is not null
            ? $"{aiResult.Response}\n\n🔗 {conversation.Campaign.PaymentUrl}"
            : aiResult.Response;

        // Enviar via plataforma
        var sent = inbound.Channel == ChannelType.Instagram
            ? await instagram.SendMessageAsync(inbound.RecipientId, inbound.SenderId, responseText, tenant.InstagramAccessToken!, ct)
            : await whatsapp.SendMessageAsync(inbound.RecipientId, inbound.SenderId, responseText, tenant.WhatsAppAccessToken!, ct);

        if (!sent) { logger.LogError("Failed to send message for conv {ConvId}", conversation.Id); return; }

        // 6. Salvar mensagem de saída
        var outboundMsg = new Message
        {
            ConversationId = conversation.Id,
            Direction      = MessageDirection.Outbound,
            Content        = responseText,
            SentByAi       = true,
            DetectedIntent = aiResult.Intent,
            ScoreDelta     = aiResult.QualificationDelta,
            AiCostUsd      = claude.LastCallCostUsd,
            Delivered      = true,
        };
        db.Messages.Add(outboundMsg);

        // 7. Atualizar scores e contadores
        lead.QualificationScore = Math.Clamp(lead.QualificationScore + aiResult.QualificationDelta, 0, 100);
        if (aiResult.Intent == LeadIntent.ReadyToBuy && lead.Status == LeadStatus.Contacted)
            lead.Status = LeadStatus.Negotiating;
        if (aiResult.Intent == LeadIntent.NotInterested)
            lead.Status = LeadStatus.Lost;

        conversation.LastIntent     = aiResult.Intent;
        conversation.AiMessageCount++;
        conversation.TotalAiCostUsd += claude.LastCallCostUsd;
        tenant.MessagesSentThisMonth++;

        // 8. Comprimir contexto a cada 20 mensagens
        if (conversation.TotalMessages > 0 && conversation.TotalMessages % 20 == 0)
            await CompressContextAsync(conversation, recentMessages, ct);

        await db.SaveAsync(ct);
    }

    private async Task<Campaign?> FindCampaignAsync(Guid tenantId, string message, CancellationToken ct)
    {
        var campaigns = await db.Campaigns
            .Where(c => c.TenantId == tenantId && c.Active)
            .ToListAsync(ct);

        // Buscar por keyword
        var matched = campaigns.FirstOrDefault(c =>
            c.TriggerKeyword is not null &&
            message.Contains(c.TriggerKeyword, StringComparison.OrdinalIgnoreCase));

        return matched ?? campaigns.FirstOrDefault(c => c.IsDefault);
    }

    private async Task CompressContextAsync(Conversation conv, List<Message> messages, CancellationToken ct)
    {
        var formatted = string.Join("\n", messages.Select(m =>
            $"{(m.Direction == MessageDirection.Inbound ? "Lead" : "Bot")}: {m.Content}"));

        var summary = await claude.CompleteAsync(
            "Você resume conversas de vendas. Seja objetivo.",
            $"Resuma em 5 linhas, preservando: interesse do lead, objeções mencionadas, status atual.\n\n{formatted}",
            ct);

        conv.ContextSummary = summary.Response;
    }
}
