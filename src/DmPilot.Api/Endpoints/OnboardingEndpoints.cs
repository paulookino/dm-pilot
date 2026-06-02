using DmPilot.Application.Interfaces;
using DmPilot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DmPilot.Api.Endpoints;

/// <summary>
/// Webhook chamado pela Kiwify quando uma aluna compra o Éden's Club.
/// Dispara sequência de boas-vindas via WhatsApp.
/// </summary>
public static class OnboardingEndpoints
{
    public static void MapOnboardingEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/onboarding/kiwify", async (
            KiwifyPurchasePayload payload,
            AppDbContext          db,
            IWhatsAppClient       whatsapp,
            ILogger<Program>      logger) =>
        {
            if (payload.WebhookEventType != "order_approved") return Results.Ok();

            var phone  = payload.Order?.Customer?.Phone?.Replace("+", "").Replace(" ", "").Replace("-", "");
            var name   = payload.Order?.Customer?.Name?.Split(' ')[0] ?? "linda";
            var product= payload.Order?.Product?.Name ?? "Éden's Club";

            if (string.IsNullOrEmpty(phone))
            {
                logger.LogWarning("Kiwify onboarding: phone vazio para {Name}", name);
                return Results.Ok();
            }

            // Buscar tenant com WhatsApp configurado
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.WhatsAppPhoneNumberId != null);
            if (tenant?.WhatsAppPhoneNumberId is null || tenant.WhatsAppAccessToken is null)
            {
                logger.LogWarning("Nenhum tenant com WhatsApp configurado para onboarding");
                return Results.Ok();
            }

            var messages = new[]
            {
                $"Oiii {name}! 🌿 Aqui é a Pri, assistente da Priscilla.\n\nSua vaga no *Éden's Club* foi confirmada! Bem-vinda ao processo. 💜\n\nVocê receberá um email com o acesso à plataforma nas próximas horas.",

                $"Antes de começar, quero te contar o que te espera:\n\n📍 *12 semanas* de processo estruturado\n📍 *10 encontros ao vivo* com a Priscilla\n📍 *Comunidade privada* com as outras participantes\n📍 Materiais práticos por fase\n\nO programa começa com uma sessão individual de diagnóstico na Semana 0 — a Priscilla vai entrar em contato para agendar. 🗓",

                $"Uma última coisa antes de começar:\n\nO Éden's Club começa pela *identidade*, não pelo comportamento. Isso significa que as primeiras semanas podem parecer mais internas do que práticas.\n\nConfia no processo. Cada fase foi desenhada com intenção.\n\nQualquer dúvida antes de começar, pode mandar mensagem aqui. Estamos com você! 🌱",
            };

            foreach (var msg in messages)
            {
                await whatsapp.SendMessageAsync(
                    tenant.WhatsAppPhoneNumberId,
                    phone,
                    msg,
                    tenant.WhatsAppAccessToken);

                await Task.Delay(2000); // Espaçar mensagens
            }

            logger.LogInformation("Onboarding enviado para {Name} ({Phone})", name, phone[..4] + "***");
            return Results.Ok(new { message = "Onboarding enviado", name, phone = phone[..4] + "***" });
        });
    }
}

record KiwifyPurchasePayload(
    string?              WebhookEventType,
    KiwifyOrderPayload?  Order);

record KiwifyOrderPayload(
    KiwifyCustomerPayload? Customer,
    KiwifyProductPayload?  Product);

record KiwifyCustomerPayload(
    string? Name,
    string? Email,
    string? Phone);

record KiwifyProductPayload(string? Name);
