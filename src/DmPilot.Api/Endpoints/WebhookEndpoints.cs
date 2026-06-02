using DmPilot.Api.Jobs;
using DmPilot.Application.Interfaces;
using DmPilot.Application.Models;
using DmPilot.Domain.Enums;
using System.Text.Json;

namespace DmPilot.Api.Endpoints;

public static class WebhookEndpoints
{
    public static void MapWebhookEndpoints(this IEndpointRouteBuilder app)
    {
        // ── INSTAGRAM ─────────────────────────────────────────
        // Meta envia hub.mode, hub.verify_token, hub.challenge (com ponto)
        // .NET não faz bind automático de "hub.mode" → "hub_mode", então lemos da query diretamente
        app.MapGet("/webhooks/instagram", (HttpRequest request, IConfiguration cfg) =>
        {
            var mode      = request.Query["hub.mode"].ToString();
            var token     = request.Query["hub.verify_token"].ToString();
            var challenge = request.Query["hub.challenge"].ToString();
            var expected  = cfg["Meta:InstagramVerifyToken"];

            if (mode == "subscribe" && token == expected && !string.IsNullOrEmpty(challenge))
                return Results.Content(challenge, "text/plain");

            return Results.Forbid();
        }).WithName("InstagramVerify");

        app.MapPost("/webhooks/instagram", async (
            HttpRequest           req,
            WebhookQueueService   queue,
            IInstagramClient      instagram,
            IConfiguration        cfg,
            CancellationToken     ct) =>
        {
            var body = await new StreamReader(req.Body).ReadToEndAsync(ct);
            var sig  = req.Headers["X-Hub-Signature-256"].ToString();

            if (!instagram.ValidateSignature(body, sig, cfg["Meta:AppSecret"] ?? ""))
                return Results.Unauthorized();

            await queue.EnqueueInstagramAsync(body, ct);
            return Results.Ok();
        }).WithName("InstagramWebhook");

        // ── WHATSAPP ──────────────────────────────────────────
        app.MapGet("/webhooks/whatsapp", (HttpRequest request, IConfiguration cfg) =>
        {
            var mode      = request.Query["hub.mode"].ToString();
            var token     = request.Query["hub.verify_token"].ToString();
            var challenge = request.Query["hub.challenge"].ToString();
            var expected  = cfg["Meta:WhatsAppVerifyToken"];

            if (mode == "subscribe" && token == expected && !string.IsNullOrEmpty(challenge))
                return Results.Content(challenge, "text/plain");

            return Results.Forbid();
        }).WithName("WhatsAppVerify");

        app.MapPost("/webhooks/whatsapp", async (
            HttpRequest         req,
            WebhookQueueService queue,
            IWhatsAppClient     whatsapp,
            IConfiguration      cfg,
            CancellationToken   ct) =>
        {
            var body = await new StreamReader(req.Body).ReadToEndAsync(ct);
            var sig  = req.Headers["X-Hub-Signature-256"].ToString();

            if (!whatsapp.ValidateSignature(body, sig, cfg["Meta:AppSecret"] ?? ""))
                return Results.Unauthorized();

            await queue.EnqueueWhatsAppAsync(body, ct);
            return Results.Ok();
        }).WithName("WhatsAppWebhook");
    }
}
