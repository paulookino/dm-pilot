using DmPilot.Application.Interfaces;
using DmPilot.Application.Models;
using DmPilot.Domain.Enums;
using DmPilot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DmPilot.Api.Endpoints;

public static class ConversationEndpoints
{
    public static void MapConversationEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/conversations", async (
            ClaimsPrincipal user,
            AppDbContext    db,
            int page     = 1,
            int pageSize = 20) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var total    = await db.Conversations.CountAsync(c => c.TenantId == tenantId);
            var items    = await db.Conversations
                .Include(c => c.Lead)
                .Include(c => c.Campaign)
                .Where(c => c.TenantId == tenantId)
                .OrderByDescending(c => c.LastMessageAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.Id, c.Status, c.AiEnabled, c.Channel,
                    c.LastMessageAt, c.TotalMessages, c.LastIntent,
                    lead = new { c.Lead.Id, c.Lead.Name, c.Lead.Username, c.Lead.QualificationScore },
                    campaign = c.Campaign == null ? null : new { c.Campaign.Id, c.Campaign.Name },
                })
                .ToListAsync();

            return Results.Ok(new { total, page, pageSize, items });
        }).RequireAuthorization();

        app.MapGet("/conversations/{id:guid}/messages", async (
            Guid            id,
            ClaimsPrincipal user,
            AppDbContext    db,
            int             page     = 1,
            int             pageSize = 50) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var conv     = await db.Conversations.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            if (conv is null) return Results.NotFound();

            var messages = await db.Messages
                .Where(m => m.ConversationId == id)
                .OrderBy(m => m.SentAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(m => new
                {
                    m.Id, m.Direction, m.Type, m.Content,
                    m.SentByAi, m.DetectedIntent, m.SentAt,
                    m.Delivered, m.Read,
                })
                .ToListAsync();

            return Results.Ok(messages);
        }).RequireAuthorization();

        // Toggle IA on/off para uma conversa
        app.MapPatch("/conversations/{id:guid}/ai", async (
            Guid              id,
            ToggleAiRequest   req,
            ClaimsPrincipal   user,
            AppDbContext      db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var conv     = await db.Conversations.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            if (conv is null) return Results.NotFound();

            conv.AiEnabled = req.Enabled;
            await db.SaveChangesAsync();
            return Results.Ok(new { id = conv.Id, aiEnabled = conv.AiEnabled });
        }).RequireAuthorization();

        // Enviar mensagem manual pelo operador
        app.MapPost("/conversations/{id:guid}/messages", async (
            Guid              id,
            SendMessageRequest req,
            ClaimsPrincipal   user,
            AppDbContext      db,
            IInstagramClient  instagram,
            IWhatsAppClient   whatsapp) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var conv     = await db.Conversations
                .Include(c => c.Lead)
                .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            if (conv is null) return Results.NotFound();

            var tenant = await db.Tenants.FindAsync(tenantId);
            if (tenant is null) return Results.Unauthorized();

            // Enviar pela plataforma
            var sent = conv.Channel == ChannelType.Instagram
                ? await instagram.SendMessageAsync(
                    tenant.InstagramPageId!,
                    conv.Lead.ExternalId,
                    req.Text,
                    tenant.InstagramAccessToken!)
                : await whatsapp.SendMessageAsync(
                    tenant.WhatsAppPhoneNumberId!,
                    conv.Lead.ExternalId,
                    req.Text,
                    tenant.WhatsAppAccessToken!);

            if (!sent) return Results.Problem("Falha ao enviar mensagem");

            var msg = new DmPilot.Domain.Entities.Message
            {
                ConversationId = conv.Id,
                Direction      = MessageDirection.Outbound,
                Content        = req.Text,
                SentByAi       = false,
                Delivered      = true,
            };
            db.Messages.Add(msg);
            conv.LastMessageAt = DateTime.UtcNow;
            conv.TotalMessages++;
            await db.SaveChangesAsync();

            return Results.Created($"/conversations/{id}/messages/{msg.Id}", new { msg.Id, msg.Content, msg.SentAt });
        }).RequireAuthorization();
    }
}

record ToggleAiRequest(bool Enabled);
record SendMessageRequest(string Text);
