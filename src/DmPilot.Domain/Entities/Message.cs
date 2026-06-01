using DmPilot.Domain.Enums;

namespace DmPilot.Domain.Entities;

public class Message
{
    public Guid              Id               { get; init; } = Guid.NewGuid();
    public Guid              ConversationId   { get; set; }
    public Conversation      Conversation     { get; set; } = null!;

    public MessageDirection  Direction        { get; set; }
    public MessageType       Type             { get; set; } = MessageType.Text;
    public string            Content          { get; set; } = string.Empty;
    public string?           MediaUrl         { get; set; }

    // Metadados de IA
    public bool              SentByAi         { get; set; } = false;
    public LeadIntent?       DetectedIntent   { get; set; }
    public int?              ScoreDelta       { get; set; }  // Variação no score do lead
    public decimal?          AiCostUsd        { get; set; }

    // ID da mensagem na plataforma (Instagram/WhatsApp)
    public string?           ExternalMessageId{ get; set; }
    public bool              Delivered        { get; set; } = false;
    public bool              Read             { get; set; } = false;

    public DateTime          SentAt           { get; init; } = DateTime.UtcNow;
}
