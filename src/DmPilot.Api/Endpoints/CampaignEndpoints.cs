using DmPilot.Domain.Entities;
using DmPilot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DmPilot.Api.Endpoints;

public static class CampaignEndpoints
{
    public static void MapCampaignEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/campaigns", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var list     = await db.Campaigns
                .Where(c => c.TenantId == tenantId)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new
                {
                    c.Id, c.Name, c.Active, c.IsDefault,
                    c.PersonaName, c.PersonaTone, c.ProductName,
                    c.ProductDescription, c.ProductBenefits,
                    c.ProductPrice, c.TriggerKeyword, c.PaymentUrl,
                    c.ObjectionHandlers, c.ClosingMessage,
                    c.TotalLeads, c.TotalSales, c.TotalRevenue,
                })
                .ToListAsync();
            return Results.Ok(list);
        }).RequireAuthorization();

        app.MapGet("/campaigns/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var c        = await db.Campaigns.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            return c is null ? Results.NotFound() : Results.Ok(c);
        }).RequireAuthorization();

        app.MapPost("/campaigns", async (
            UpsertCampaignRequest req,
            ClaimsPrincipal       user,
            AppDbContext          db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

            // Se vai ser default, desativa os outros
            if (req.IsDefault)
                await db.Campaigns
                    .Where(c => c.TenantId == tenantId && c.IsDefault)
                    .ExecuteUpdateAsync(s => s.SetProperty(c => c.IsDefault, false));

            var campaign = new Campaign
            {
                TenantId          = tenantId,
                Name              = req.Name,
                Active            = req.Active,
                IsDefault         = req.IsDefault,
                TriggerKeyword    = req.TriggerKeyword,
                PersonaName       = req.PersonaName,
                PersonaTone       = req.PersonaTone,
                SystemPrompt      = req.SystemPrompt ?? "",
                ProductName       = req.ProductName,
                ProductDescription= req.ProductDescription ?? "",
                ProductBenefits   = req.ProductBenefits ?? "",
                ProductPrice      = req.ProductPrice,
                PaymentUrl        = req.PaymentUrl,
                ObjectionHandlers = req.ObjectionHandlers ?? "",
                ClosingMessage    = req.ClosingMessage,
            };
            db.Campaigns.Add(campaign);
            await db.SaveChangesAsync();
            return Results.Created($"/campaigns/{campaign.Id}", campaign);
        }).RequireAuthorization();

        app.MapPut("/campaigns/{id:guid}", async (
            Guid                  id,
            UpsertCampaignRequest req,
            ClaimsPrincipal       user,
            AppDbContext          db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var campaign = await db.Campaigns.FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);
            if (campaign is null) return Results.NotFound();

            if (req.IsDefault && !campaign.IsDefault)
                await db.Campaigns
                    .Where(c => c.TenantId == tenantId && c.IsDefault)
                    .ExecuteUpdateAsync(s => s.SetProperty(c => c.IsDefault, false));

            campaign.Name              = req.Name;
            campaign.Active            = req.Active;
            campaign.IsDefault         = req.IsDefault;
            campaign.TriggerKeyword    = req.TriggerKeyword;
            campaign.PersonaName       = req.PersonaName;
            campaign.PersonaTone       = req.PersonaTone;
            campaign.ProductName       = req.ProductName;
            campaign.ProductDescription= req.ProductDescription ?? "";
            campaign.ProductBenefits   = req.ProductBenefits ?? "";
            campaign.ProductPrice      = req.ProductPrice;
            campaign.PaymentUrl        = req.PaymentUrl;
            campaign.ObjectionHandlers = req.ObjectionHandlers ?? "";
            campaign.ClosingMessage    = req.ClosingMessage;
            campaign.UpdatedAt         = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return Results.Ok(campaign);
        }).RequireAuthorization();

        app.MapDelete("/campaigns/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await db.Campaigns
                .Where(c => c.Id == id && c.TenantId == tenantId && !c.IsDefault)
                .ExecuteDeleteAsync();
            return Results.NoContent();
        }).RequireAuthorization();
    }
}

record UpsertCampaignRequest(
    string   Name,
    bool     Active,
    bool     IsDefault,
    string?  TriggerKeyword,
    string   PersonaName,
    string   PersonaTone,
    string?  SystemPrompt,
    string   ProductName,
    string?  ProductDescription,
    string?  ProductBenefits,
    decimal? ProductPrice,
    string?  PaymentUrl,
    string?  ObjectionHandlers,
    string?  ClosingMessage);
