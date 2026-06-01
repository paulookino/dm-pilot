using DmPilot.Domain.Enums;

namespace DmPilot.Application.Models;

public record AiResult(
    string      Response,
    LeadIntent  Intent,
    int         QualificationDelta,
    bool        InjectPaymentLink,
    bool        ShouldSend)
{
    public static AiResult Fallback() => new(
        "Deixa eu verificar isso e te respondo em breve! 😊",
        LeadIntent.Unknown, 0, false, true);
}

public record InboundMessage(
    string     SenderId,       // Instagram PSID ou WhatsApp phone
    string     RecipientId,    // PageId ou PhoneNumberId
    string     Text,
    ChannelType Channel,
    DateTime   Timestamp);

public record InstagramUserProfile(string? Name, string? ProfilePic);
