using DmPilot.Domain.Enums;
using DmPilot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DmPilot.Api.Endpoints;

public static class LeadEndpoints
{
    public static void MapLeadEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/leads", async (
            ClaimsPrincipal user,
            AppDbContext    db,
            int             page        = 1,
            int             pageSize    = 20,
            string?         status      = null,
            string?         channel     = null,
            int?            minScore    = null,
            string?         search      = null) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var query    = db.Leads
                .Include(l => l.AssignedCampaign)
                .Where(l => l.TenantId == tenantId);

            if (status is not null && Enum.TryParse<LeadStatus>(status, true, out var s))
                query = query.Where(l => l.Status == s);
            if (channel is not null && Enum.TryParse<ChannelType>(channel, true, out var c))
                query = query.Where(l => l.Channel == c);
            if (minScore.HasValue)
                query = query.Where(l => l.QualificationScore >= minScore.Value);
            if (search is not null)
                query = query.Where(l => l.Name!.Contains(search) || l.Username!.Contains(search));

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(l => l.QualificationScore)
                .ThenByDescending(l => l.LastActivityAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new
                {
                    l.Id, l.Name, l.Username, l.Channel,
                    l.Status, l.QualificationScore,
                    l.FirstContactAt, l.LastActivityAt,
                    campaign = l.AssignedCampaign == null ? null : new { l.AssignedCampaign.Id, l.AssignedCampaign.Name },
                    l.ProfilePicUrl,
                })
                .ToListAsync();

            return Results.Ok(new { total, page, pageSize, items });
        }).RequireAuthorization();

        app.MapGet("/leads/{id:guid}", async (
            Guid            id,
            ClaimsPrincipal user,
            AppDbContext    db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var lead     = await db.Leads
                .Include(l => l.Conversations)
                .ThenInclude(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
                .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);

            return lead is null ? Results.NotFound() : Results.Ok(lead);
        }).RequireAuthorization();

        app.MapPatch("/leads/{id:guid}/status", async (
            Guid              id,
            UpdateStatusRequest req,
            ClaimsPrincipal   user,
            AppDbContext      db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var lead     = await db.Leads.FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);
            if (lead is null) return Results.NotFound();

            if (Enum.TryParse<LeadStatus>(req.Status, true, out var newStatus))
                lead.Status = newStatus;

            await db.SaveChangesAsync();
            return Results.Ok(new { id = lead.Id, status = lead.Status.ToString() });
        }).RequireAuthorization();

        // Stats do funil
        app.MapGet("/leads/stats", async (
            ClaimsPrincipal user,
            AppDbContext    db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var stats    = await db.Leads
                .Where(l => l.TenantId == tenantId)
                .GroupBy(l => l.Status)
                .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var hotLeads = await db.Leads
                .Where(l => l.TenantId == tenantId && l.QualificationScore >= 70)
                .CountAsync();

            return Results.Ok(new { funnel = stats, hotLeads });
        }).RequireAuthorization();
    }
}

record UpdateStatusRequest(string Status);
