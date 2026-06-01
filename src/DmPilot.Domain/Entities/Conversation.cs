using DmPilot.Domain.Enums;

namespace DmPilot.Domain.Entities;

public class Conversation
{
    public Guid               Id             { get; init; } = Guid.NewGuid();
    public Guid               TenantId       { get; set; }
    public Guid               LeadId         { get; set; }
    public Lead               Lead           { get; set; } = null!;

    public ChannelType        Channel        { get; set; }
    public ConversationStatus Status         { get; set; } = ConversationStatus.Active;

    // IA
    public bool               AiEnabled      { get; set; } = true;
    public Guid?              CampaignId     { get; set; }
    public Campaign?          Campaign       { get; set; }

    // Contexto comprimido para economizar tokens
    public string             ContextSummary { get; set; } = string.Empty;
    public int                TotalMessages  { get; set; } = 0;
    public int                AiMessageCount { get; set; } = 0;
    public decimal            TotalAiCostUsd { get; set; } = 0;

    // Último intent detectado pela IA
    public LeadIntent         LastIntent     { get; set; } = LeadIntent.Unknown;

    public DateTime           CreatedAt      { get; init; } = DateTime.UtcNow;
    public DateTime           LastMessageAt  { get; set; }  = DateTime.UtcNow;

    public ICollection<Message> Messages     { get; set; } = new List<Message>();
}
