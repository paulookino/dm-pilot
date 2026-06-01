using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using DmPilot.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace DmPilot.Infrastructure.Messaging;

public class WhatsAppClient(HttpClient http, ILogger<WhatsAppClient> logger) : IWhatsAppClient
{
    private const string GRAPH_URL = "https://graph.facebook.com/v20.0";

    public async Task<bool> SendMessageAsync(
        string phoneNumberId,
        string toPhone,
        string text,
        string accessToken,
        CancellationToken ct = default)
    {
        var url = $"{GRAPH_URL}/{phoneNumberId}/messages";
        http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        var payload = new
        {
            messaging_product = "whatsapp",
            to      = toPhone,
            type    = "text",
            text    = new { preview_url = false, body = text }
        };

        try
        {
            var response = await http.PostAsJsonAsync(url, payload, ct);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                logger.LogError("WhatsApp send failed: {Status} {Err}", response.StatusCode, err);
                return false;
            }
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "WhatsApp API error");
            return false;
        }
    }

    public bool ValidateSignature(string body, string signature, string appSecret)
    {
        if (string.IsNullOrEmpty(signature)) return false;
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(appSecret));
        var hash       = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        var expected   = "sha256=" + Convert.ToHexString(hash).ToLower();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(signature.ToLower()),
            Encoding.UTF8.GetBytes(expected));
    }
}
