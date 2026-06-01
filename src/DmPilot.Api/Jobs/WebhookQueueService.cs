using DmPilot.Application.Models;
using DmPilot.Application.UseCases;
using DmPilot.Domain.Enums;
using Hangfire;
using System.Text.Json;

namespace DmPilot.Api.Jobs;

public class WebhookQueueService(IBackgroundJobClient jobs)
{
    public Task EnqueueInstagramAsync(string rawPayload, CancellationToken ct = default)
    {
        jobs.Enqueue<WebhookProcessorJob>(j => j.ProcessInstagramAsync(rawPayload, CancellationToken.None));
        return Task.CompletedTask;
    }

    public Task EnqueueWhatsAppAsync(string rawPayload, CancellationToken ct = default)
    {
        jobs.Enqueue<WebhookProcessorJob>(j => j.ProcessWhatsAppAsync(rawPayload, CancellationToken.None));
        return Task.CompletedTask;
    }
}

public class WebhookProcessorJob(ProcessInboundMessageUseCase useCase, ILogger<WebhookProcessorJob> logger)
{
    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 30, 60])]
    public async Task ProcessInstagramAsync(string rawPayload, CancellationToken ct)
    {
        try
        {
            var payload = JsonSerializer.Deserialize<InstagramWebhookPayload>(rawPayload,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (payload?.Entry is null) return;

            foreach (var entry in payload.Entry)
            foreach (var msg in entry.Messaging ?? [])
            {
                if (msg.Message?.Text is null) continue;

                await useCase.ExecuteAsync(new InboundMessage(
                    SenderId:    msg.Sender?.Id ?? string.Empty,
                    RecipientId: msg.Recipient?.Id ?? string.Empty,
                    Text:        msg.Message.Text,
                    Channel:     ChannelType.Instagram,
                    Timestamp:   DateTimeOffset.FromUnixTimeMilliseconds(msg.Timestamp).UtcDateTime
                ), ct);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process Instagram webhook");
            throw;
        }
    }

    [AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 30, 60])]
    public async Task ProcessWhatsAppAsync(string rawPayload, CancellationToken ct)
    {
        try
        {
            var payload = JsonSerializer.Deserialize<WhatsAppWebhookPayload>(rawPayload,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var entries = payload?.Entry ?? [];
            foreach (var entry in entries)
            foreach (var change in entry.Changes ?? [])
            {
                var messages = change.Value?.Messages ?? [];
                foreach (var msg in messages)
                {
                    if (msg.Type != "text" || msg.Text?.Body is null) continue;

                    await useCase.ExecuteAsync(new InboundMessage(
                        SenderId:    msg.From ?? string.Empty,
                        RecipientId: change.Value?.Metadata?.PhoneNumberId ?? string.Empty,
                        Text:        msg.Text.Body,
                        Channel:     ChannelType.WhatsApp,
                        Timestamp:   DateTimeOffset.FromUnixTimeSeconds(long.Parse(msg.Timestamp ?? "0")).UtcDateTime
                    ), ct);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process WhatsApp webhook");
            throw;
        }
    }
}

// ── DTOs de desserialização ────────────────────────────────────
record InstagramWebhookPayload(
    string? Object,
    List<InstagramEntry>? Entry);

record InstagramEntry(
    string? Id,
    List<InstagramMessaging>? Messaging);

record InstagramMessaging(
    InstagramSender?    Sender,
    InstagramRecipient? Recipient,
    long                Timestamp,
    InstagramMessage?   Message);

record InstagramSender(string? Id);
record InstagramRecipient(string? Id);
record InstagramMessage(string? Mid, string? Text);

record WhatsAppWebhookPayload(
    string? Object,
    List<WhatsAppEntry>? Entry);

record WhatsAppEntry(
    string? Id,
    List<WhatsAppChange>? Changes);

record WhatsAppChange(
    string?           Field,
    WhatsAppValue?    Value);

record WhatsAppValue(
    WhatsAppMetadata? Metadata,
    List<WhatsAppMessage>? Messages);

record WhatsAppMetadata(
    string? DisplayPhoneNumber,
    string? PhoneNumberId);

record WhatsAppMessage(
    string? From,
    string? Id,
    string? Timestamp,
    string? Type,
    WhatsAppText? Text);

record WhatsAppText(string? Body);
