using DmPilot.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DmPilot.Application.Interfaces;

public interface IDbContextAccessor
{
    DbSet<Tenant>       Tenants       { get; }
    DbSet<Lead>         Leads         { get; }
    DbSet<Conversation> Conversations { get; }
    DbSet<Message>      Messages      { get; }
    DbSet<Campaign>     Campaigns     { get; }
    Task<int>           SaveAsync(CancellationToken ct = default);
}
