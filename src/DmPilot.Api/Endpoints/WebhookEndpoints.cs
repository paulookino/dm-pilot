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
        app.MapGet("/webhooks/instagram", (
            string? hub_mode,
            string? hub_verify_token,
            string? hub_challenge,
            IConfiguration cfg) =>
        {
            var expected = cfg["Meta:InstagramVerifyToken"];
            if (hub_mode == "subscribe" && hub_verify_token == expected && hub_challenge is not null)
                return Results.Ok(int.Parse(hub_challenge));
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
        app.MapGet("/webhooks/whatsapp", (
            string? hub_mode,
            string? hub_verify_token,
            string? hub_challenge,
            IConfiguration cfg) =>
        {
            var expected = cfg["Meta:WhatsAppVerifyToken"];
            if (hub_mode == "subscribe" && hub_verify_token == expected && hub_challenge is not null)
                return Results.Ok(int.Parse(hub_challenge));
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
