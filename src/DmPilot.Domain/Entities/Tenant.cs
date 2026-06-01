using DmPilot.Domain.Enums;

namespace DmPilot.Domain.Entities;

public class Tenant
{
    public Guid     Id                     { get; init; } = Guid.NewGuid();
    public string   Name                   { get; set; } = string.Empty;
    public string   Slug                   { get; set; } = string.Empty;
    public string   Email                  { get; set; } = string.Empty;
    public string   PasswordHash           { get; set; } = string.Empty;
    public PlanType Plan                   { get; set; } = PlanType.Starter;

    // Instagram
    public string?  InstagramPageId        { get; set; }
    public string?  InstagramAccessToken   { get; set; }
    public string?  InstagramPageName      { get; set; }

    // WhatsApp Business
    public string?  WhatsAppPhoneNumberId  { get; set; }
    public string?  WhatsAppAccessToken    { get; set; }
    public string?  WhatsAppPhoneNumber    { get; set; }

    // Stripe
    public string?  StripeCustomerId       { get; set; }
    public string?  StripeSubscriptionId   { get; set; }
    public string   SubscriptionStatus     { get; set; } = "trialing";

    // Quotas
    public int      MonthlyMessageQuota    { get; set; } = 1000;
    public int      MessagesSentThisMonth  { get; set; } = 0;
    public DateTime QuotaResetAt           { get; set; } = DateTime.UtcNow.AddMonths(1);

    public DateTime CreatedAt              { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt              { get; set; }  = DateTime.UtcNow;

    public bool IsOverQuota() => MessagesSentThisMonth >= MonthlyMessageQuota;

    public ICollection<Lead>     Leads     { get; set; } = new List<Lead>();
    public ICollection<Campaign> Campaigns { get; set; } = new List<Campaign>();
}
