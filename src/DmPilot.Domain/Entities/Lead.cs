using DmPilot.Domain.Enums;
using System.Text.Json;

namespace DmPilot.Domain.Entities;

public class Lead
{
    public Guid        Id                { get; init; } = Guid.NewGuid();
    public Guid        TenantId          { get; set; }
    public Tenant      Tenant            { get; set; } = null!;

    // Identificação na plataforma
    public string      ExternalId        { get; set; } = string.Empty; // Instagram PSID / WhatsApp phone
    public ChannelType Channel           { get; set; }

    // Dados do lead
    public string?     Name              { get; set; }
    public string?     Username          { get; set; }   // @handle Instagram
    public string?     Phone             { get; set; }
    public string?     ProfilePicUrl     { get; set; }

    // Status e qualificação
    public LeadStatus  Status            { get; set; } = LeadStatus.New;
    public int         QualificationScore{ get; set; } = 0;  // 0-100

    // Dados extraídos pela IA (flexível via JSONB)
    public JsonDocument? Metadata        { get; set; }

    // Campanha atual
    public Guid?       AssignedCampaignId{ get; set; }
    public Campaign?   AssignedCampaign  { get; set; }

    public DateTime    FirstContactAt    { get; init; } = DateTime.UtcNow;
    public DateTime    LastActivityAt    { get; set; }  = DateTime.UtcNow;

    public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
}
