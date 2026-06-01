using DmPilot.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DmPilot.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Tenant>       Tenants       => Set<Tenant>();
    public DbSet<Lead>         Leads         => Set<Lead>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message>      Messages      => Set<Message>();
    public DbSet<Campaign>     Campaigns     => Set<Campaign>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        base.OnModelCreating(model);
        model.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
