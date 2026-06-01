using DmPilot.Application.Models;

namespace DmPilot.Application.Interfaces;

public interface IClaudeClient
{
    decimal LastCallCostUsd { get; }
    Task<AiResult> CompleteAsync(string systemPrompt, string userMessage, CancellationToken ct = default);
}

public interface IInstagramClient
{
    Task<bool> SendMessageAsync(string pageId, string recipientId, string text, string accessToken, CancellationToken ct = default);
    Task<InstagramUserProfile?> GetUserProfileAsync(string userId, string accessToken, CancellationToken ct = default);
    bool ValidateSignature(string body, string signature, string appSecret);
}

public interface IWhatsAppClient
{
    Task<bool> SendMessageAsync(string phoneNumberId, string toPhone, string text, string accessToken, CancellationToken ct = default);
    bool ValidateSignature(string body, string signature, string appSecret);
}

public interface IWebhookQueue
{
    Task EnqueueInstagramAsync(string rawPayload, CancellationToken ct = default);
    Task EnqueueWhatsAppAsync(string rawPayload, CancellationToken ct = default);
}
