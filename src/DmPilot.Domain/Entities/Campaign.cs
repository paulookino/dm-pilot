namespace DmPilot.Domain.Entities;

public class Campaign
{
    public Guid     Id                  { get; init; } = Guid.NewGuid();
    public Guid     TenantId            { get; set; }
    public Tenant   Tenant              { get; set; } = null!;

    public string   Name                { get; set; } = string.Empty;
    public bool     Active              { get; set; } = true;

    // Ativação
    public string?  TriggerKeyword      { get; set; }  // Palavra que ativa essa campanha
    public bool     IsDefault           { get; set; }  // Usada quando nenhuma outra corresponde

    // Persona da IA
    public string   PersonaName         { get; set; } = "Assistente";
    public string   PersonaTone         { get; set; } = "amigável e profissional";
    public string   SystemPrompt        { get; set; } = string.Empty;  // Prompt base

    // Produto
    public string   ProductName         { get; set; } = string.Empty;
    public string   ProductDescription  { get; set; } = string.Empty;
    public string   ProductBenefits     { get; set; } = string.Empty;
    public decimal? ProductPrice        { get; set; }
    public string?  PaymentUrl          { get; set; }

    // Objeções e contra-argumentos
    public string   ObjectionHandlers   { get; set; } = string.Empty;

    // Mensagem de qualificação (quando detecta READY_TO_BUY)
    public string?  ClosingMessage      { get; set; }

    // Métricas
    public int      TotalLeads          { get; set; } = 0;
    public int      TotalSales          { get; set; } = 0;
    public decimal  TotalRevenue        { get; set; } = 0;

    public DateTime CreatedAt           { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt           { get; set; }  = DateTime.UtcNow;
}
