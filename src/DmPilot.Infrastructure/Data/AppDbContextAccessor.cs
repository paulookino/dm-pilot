using DmPilot.Application.Interfaces;
using DmPilot.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DmPilot.Infrastructure.Data;

public class AppDbContextAccessor(AppDbContext ctx) : IDbContextAccessor
{
    public DbSet<Tenant>       Tenants       => ctx.Tenants;
    public DbSet<Lead>         Leads         => ctx.Leads;
    public DbSet<Conversation> Conversations => ctx.Conversations;
    public DbSet<Message>      Messages      => ctx.Messages;
    public DbSet<Campaign>     Campaigns     => ctx.Campaigns;
    public Task<int>           SaveAsync(CancellationToken ct = default) => ctx.SaveChangesAsync(ct);
}
