using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DmPilot.Application.Interfaces;
using DmPilot.Application.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DmPilot.Infrastructure.AI;

/// <summary>
/// Cliente para a API do Groq (gratuita, sem cartão).
/// Obter chave em: https://console.groq.com
/// Modelos gratuitos: llama-3.1-8b-instant, llama-3.1-70b-versatile, mixtral-8x7b-32768
/// </summary>
public class GroqApiClient(
    HttpClient         http,
    IConfiguration     config,
    ILogger<GroqApiClient> logger) : IClaudeClient
{
    private const string API_URL   = "https://api.groq.com/openai/v1/chat/completions";
    private const string MODEL     = "llama-3.1-8b-instant"; // Mais rápido, gratuito
    private const int    MAX_TOKENS = 400; // DMs são curtas

    public decimal LastCallCostUsd { get; private set; } = 0; // Grátis!

    public async Task<AiResult> CompleteAsync(
        string systemPrompt,
        string userMessage,
        CancellationToken ct = default)
    {
        var apiKey = config["Groq:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            logger.LogWarning("Groq API key not configured. Returning fallback.");
            return AiResult.Fallback();
        }

        http.DefaultRequestHeaders.Clear();
        http.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        var request = new
        {
            model       = MODEL,
            max_tokens  = MAX_TOKENS,
            temperature = 0.4, // Baixo para respostas mais consistentes
            messages    = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = userMessage  }
            }
        };

        try
        {
            var response = await http.PostAsJsonAsync(API_URL, request, ct);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                logger.LogError("Groq API error {Status}: {Error}", response.StatusCode, err);
                return AiResult.Fallback();
            }

            var body = await response.Content.ReadFromJsonAsync<GroqResponse>(ct);
            var text = body?.Choices?.FirstOrDefault()?.Message?.Content ?? string.Empty;

            LastCallCostUsd = 0; // Groq é 100% gratuito no free tier
            return ParseResponse(text);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Groq API call failed");
            return AiResult.Fallback();
        }
    }

    private static AiResult ParseResponse(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return AiResult.Fallback();

        try
        {
            // Tentar extrair JSON da resposta
            var start = raw.IndexOf('{');
            var end   = raw.LastIndexOf('}');
            if (start >= 0 && end > start)
            {
                var json   = raw[start..(end + 1)];
                var parsed = JsonSerializer.Deserialize<GroqStructuredResponse>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (parsed?.Response is not null)
                {
                    return new AiResult(
                        Response:           parsed.Response,
                        Intent:             Enum.TryParse<DmPilot.Domain.Enums.LeadIntent>(
                                                parsed.Intent ?? "Unknown", true, out var intent)
                                            ? intent
                                            : DmPilot.Domain.Enums.LeadIntent.Unknown,
                        QualificationDelta: parsed.QualificationScoreDelta,
                        InjectPaymentLink:  parsed.InjectPaymentLink,
                        ShouldSend:         true);
                }
            }
        }
        catch { /* fallback para texto puro */ }

        // Se não parsear como JSON, usar o texto diretamente
        var cleanText = raw
            .Replace("```json", "").Replace("```", "")
            .Trim();

        return new AiResult(cleanText, DmPilot.Domain.Enums.LeadIntent.Unknown, 0, false, true);
    }

    // ── DTOs ─────────────────────────────────────────────────────
    private record GroqResponse(
        [property: JsonPropertyName("choices")] GroqChoice[]? Choices);

    private record GroqChoice(
        [property: JsonPropertyName("message")] GroqMessage? Message);

    private record GroqMessage(
        [property: JsonPropertyName("content")] string? Content);

    private record GroqStructuredResponse(
        string? Response,
        string? Intent,
        int     QualificationScoreDelta,
        bool    InjectPaymentLink);
}
