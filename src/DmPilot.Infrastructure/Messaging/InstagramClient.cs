using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using DmPilot.Application.Interfaces;
using DmPilot.Application.Models;
using Microsoft.Extensions.Logging;

namespace DmPilot.Infrastructure.Messaging;

public class InstagramClient(HttpClient http, ILogger<InstagramClient> logger) : IInstagramClient
{
    private const string GRAPH_URL = "https://graph.facebook.com/v20.0";

    public async Task<bool> SendMessageAsync(
        string pageId,
        string recipientId,
        string text,
        string accessToken,
        CancellationToken ct = default)
    {
        var url = $"{GRAPH_URL}/{pageId}/messages?access_token={accessToken}";

        var payload = new
        {
            recipient = new { id = recipientId },
            message   = new { text }
        };

        try
        {
            var response = await http.PostAsJsonAsync(url, payload, ct);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(ct);
                logger.LogError("Instagram send failed: {Status} {Error}", response.StatusCode, error);
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Instagram API error");
            return false;
        }
    }

    public async Task<InstagramUserProfile?> GetUserProfileAsync(
        string userId,
        string accessToken,
        CancellationToken ct = default)
    {
        var url = $"{GRAPH_URL}/{userId}?fields=name,profile_pic&access_token={accessToken}";
        try
        {
            return await http.GetFromJsonAsync<InstagramUserProfile>(url, ct);
        }
        catch
        {
            return null;
        }
    }

    public bool ValidateSignature(string body, string signature, string appSecret)
    {
        if (string.IsNullOrEmpty(signature)) return false;
        using var hmac   = new HMACSHA256(Encoding.UTF8.GetBytes(appSecret));
        var hash         = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        var expected     = "sha256=" + Convert.ToHexString(hash).ToLower();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(signature.ToLower()),
            Encoding.UTF8.GetBytes(expected));
    }
}
