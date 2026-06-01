namespace DmPilot.Domain.Enums;

public enum ChannelType    { Instagram, WhatsApp }
public enum LeadStatus     { New, Contacted, Qualified, Negotiating, Won, Lost }
public enum MessageDirection { Inbound, Outbound }
public enum MessageType    { Text, Image, Audio, Video, Document, Link }
public enum ConversationStatus { Active, Paused, Closed }
public enum PlanType       { Free, Starter, Pro, Scale, Agency }

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
