using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DmPilot.Application.Interfaces;
using DmPilot.Application.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DmPilot.Infrastructure.AI;

public class ClaudeApiClient(
    HttpClient        http,
    IConfiguration    config,
    ILogger<ClaudeApiClient> logger) : IClaudeClient
{
    private const string MODEL     = "claude-haiku-4-5-20251001"; // Mais barato, PT-BR excelente
    private const string API_URL   = "https://api.anthropic.com/v1/messages";
    private const int    MAX_TOKENS = 512; // Respostas curtas para DM

    public decimal LastCallCostUsd { get; private set; }

    public async Task<AiResult> CompleteAsync(string systemPrompt, string userMessage, CancellationToken ct = default)
    {
        var apiKey = config["Claude:ApiKey"]
            ?? throw new InvalidOperationException("Claude API key not configured");

        http.DefaultRequestHeaders.Clear();
        http.DefaultRequestHeaders.Add("x-api-key", apiKey);
        http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var request = new
        {
            model  = MODEL,
            max_tokens = MAX_TOKENS,
            system = systemPrompt,
            messages = new[] { new { role = "user", content = userMessage } }
        };

        HttpResponseMessage? response = null;
        try
        {
            response = await http.PostAsJsonAsync(API_URL, request, ct);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Claude API call failed");
            return AiResult.Fallback();
        }

        var body = await response.Content.ReadFromJsonAsync<ClaudeResponse>(cancellationToken: ct);
        if (body?.Content is null || body.Content.Length == 0)
            return AiResult.Fallback();

        var rawText = body.Content[0].Text ?? string.Empty;

        // Calcular custo estimado
        LastCallCostUsd = CalculateCost(body.Usage?.InputTokens ?? 0, body.Usage?.OutputTokens ?? 0);

        // Tentar extrair JSON estruturado do texto
        return ParseStructuredResponse(rawText);
    }

    private static AiResult ParseStructuredResponse(string raw)
    {
        try
        {
            // A IA retorna JSON dentro de ```json ... ```
            var jsonStart = raw.IndexOf('{');
            var jsonEnd   = raw.LastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var json = raw[jsonStart..(jsonEnd + 1)];
                var parsed = JsonSerializer.Deserialize<AiStructuredResponse>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (parsed is not null)
                {
                    return new AiResult(
                        Response:             parsed.Response ?? raw,
                        Intent:               Enum.TryParse<DmPilot.Domain.Enums.LeadIntent>(parsed.Intent, true, out var intent) ? intent : Domain.Enums.LeadIntent.Unknown,
                        QualificationDelta:   parsed.QualificationScoreDelta,
                        InjectPaymentLink:    parsed.InjectPaymentLink,
                        ShouldSend:           true);
                }
            }
        }
        catch { /* Se falhar o parse, usa o raw */ }

        return new AiResult(raw, Domain.Enums.LeadIntent.Unknown, 0, false, true);
    }

    private static decimal CalculateCost(int inputTokens, int outputTokens)
    {
        // Claude Haiku pricing (approximate)
        const decimal inputCostPer1k  = 0.00025m;
        const decimal outputCostPer1k = 0.00125m;
        return (inputTokens / 1000m * inputCostPer1k) + (outputTokens / 1000m * outputCostPer1k);
    }

    // DTOs de deserialização
    private record ClaudeResponse(
        [property: JsonPropertyName("content")] ClaudeContent[]? Content,
        [property: JsonPropertyName("usage")]   ClaudeUsage?     Usage);

    private record ClaudeContent([property: JsonPropertyName("text")] string? Text);

    private record ClaudeUsage(
        [property: JsonPropertyName("input_tokens")]  int InputTokens,
        [property: JsonPropertyName("output_tokens")] int OutputTokens);

    private record AiStructuredResponse(
        string? Response,
        string? Intent,
        int     QualificationScoreDelta,
        bool    InjectPaymentLink);
}
