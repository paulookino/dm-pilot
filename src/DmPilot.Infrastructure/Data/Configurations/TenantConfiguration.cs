using DmPilot.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace DmPilot.Infrastructure.Data.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> b)
    {
        b.HasKey(t => t.Id);
        b.Property(t => t.Slug).HasMaxLength(100).IsRequired();
        b.HasIndex(t => t.Slug).IsUnique();
        b.HasIndex(t => t.Email).IsUnique();
        b.Property(t => t.InstagramAccessToken).HasMaxLength(500);
        b.Property(t => t.WhatsAppAccessToken).HasMaxLength(500);
        b.HasMany(t => t.Leads).WithOne(l => l.Tenant).HasForeignKey(l => l.TenantId);
        b.HasMany(t => t.Campaigns).WithOne(c => c.Tenant).HasForeignKey(c => c.TenantId);
    }
}

public class LeadConfiguration : IEntityTypeConfiguration<Lead>
{
    public void Configure(EntityTypeBuilder<Lead> b)
    {
        b.HasKey(l => l.Id);
        b.HasIndex(l => new { l.TenantId, l.ExternalId, l.Channel }).IsUnique();
        b.Property(l => l.MetadataJson).HasMaxLength(4000);
        b.HasMany(l => l.Conversations).WithOne(c => c.Lead).HasForeignKey(c => c.LeadId);
    }
}

public class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> b)
    {
        b.HasKey(c => c.Id);
        b.Property(c => c.ContextSummary).HasMaxLength(4000);
        b.HasMany(c => c.Messages).WithOne(m => m.Conversation).HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> b)
    {
        b.HasKey(m => m.Id);
        b.Property(m => m.Content).HasMaxLength(4096);
        b.HasIndex(m => m.ConversationId);
        b.HasIndex(m => m.SentAt);
    }
}

public class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> b)
    {
        b.HasKey(c => c.Id);
        b.Property(c => c.SystemPrompt).HasMaxLength(8000);
        b.Property(c => c.ObjectionHandlers).HasMaxLength(4000);
    }
}
