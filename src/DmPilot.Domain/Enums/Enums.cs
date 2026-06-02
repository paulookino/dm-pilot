namespace DmPilot.Domain.Enums;

public enum ChannelType    { Instagram, WhatsApp }
public enum LeadStatus     { New, Contacted, Qualified, Negotiating, Won, Lost }
public enum MessageDirection { Inbound, Outbound }
public enum MessageType    { Text, Image, Audio, Video, Document, Link }
public enum ConversationStatus { Active, Paused, Closed }
public enum PlanType       { Free, Starter, Pro, Scale }

public static class PlanLimits
{
    public static int MonthlyMessages(PlanType plan) => plan switch
    {
        PlanType.Starter => 500,
        PlanType.Pro     => 2000,
        PlanType.Scale   => int.MaxValue,
        _                => 50,
    };
    public static bool CanUseWhatsApp(PlanType plan)   => plan >= PlanType.Pro;
    public static bool CanUseInstagram(PlanType plan)  => plan >= PlanType.Starter;
    public static string PriceLabel(PlanType plan) => plan switch
    {
        PlanType.Starter => "R$ 97/mês",
        PlanType.Pro     => "R$ 197/mês",
        PlanType.Scale   => "R$ 497/mês",
        _                => "Trial gratuito",
    };
}

public enum LeadIntent
{
    Greeting,
    Interested,
    PriceAsked,
    Objection,
    ReadyToBuy,
    NotInterested,
    OffTopic,
    Unknown
}
