using DmPilot.Domain.Entities;
using DmPilot.Domain.Enums;
using DmPilot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace DmPilot.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/auth/register", async (
            RegisterRequest req,
            AppDbContext    db,
            IConfiguration  cfg) =>
        {
            if (await db.Tenants.AnyAsync(t => t.Email == req.Email))
                return Results.Conflict(new { error = "Email já cadastrado" });

            var tenant = new Tenant
            {
                Name         = req.Name,
                Email        = req.Email,
                Slug         = GenerateSlug(req.Name),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Plan         = PlanType.Starter,
            };
            db.Tenants.Add(tenant);
            await db.SaveChangesAsync();

            // Criar campanha default
            db.Campaigns.Add(new Campaign
            {
                TenantId           = tenant.Id,
                Name               = "Campanha Padrão",
                IsDefault          = true,
                Active             = true,
                PersonaName        = "Assistente",
                PersonaTone        = "amigável e profissional",
                ProductName        = "Meu Produto",
                ProductDescription = "Descreva seu produto aqui",
                ProductBenefits    = "Benefício 1, Benefício 2",
                SystemPrompt       = "",
                ObjectionHandlers  = "",
            });
            await db.SaveChangesAsync();

            return Results.Created("/auth/me", new
            {
                id    = tenant.Id,
                name  = tenant.Name,
                email = tenant.Email,
                token = GenerateToken(tenant, cfg),
            });
        });

        app.MapPost("/auth/login", async (
            LoginRequest   req,
            AppDbContext   db,
            IConfiguration cfg) =>
        {
            var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Email == req.Email);
            if (tenant is null || !BCrypt.Net.BCrypt.Verify(req.Password, tenant.PasswordHash))
                return Results.Unauthorized();

            return Results.Ok(new
            {
                id    = tenant.Id,
                name  = tenant.Name,
                email = tenant.Email,
                plan  = tenant.Plan.ToString(),
                token = GenerateToken(tenant, cfg),
                instagramConnected = tenant.InstagramPageId is not null,
                whatsappConnected  = tenant.WhatsAppPhoneNumberId is not null,
            });
        });

        app.MapGet("/auth/me", async (
            ClaimsPrincipal user,
            AppDbContext    db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var tenant   = await db.Tenants.FindAsync(tenantId);
            if (tenant is null) return Results.Unauthorized();

            return Results.Ok(new
            {
                id    = tenant.Id,
                name  = tenant.Name,
                email = tenant.Email,
                plan  = tenant.Plan.ToString(),
                quota = new
                {
                    limit = tenant.MonthlyMessageQuota,
                    used  = tenant.MessagesSentThisMonth,
                    resetAt = tenant.QuotaResetAt,
                },
                instagramConnected   = tenant.InstagramPageId is not null,
                instagramPageName    = tenant.InstagramPageName,
                whatsappConnected    = tenant.WhatsAppPhoneNumberId is not null,
                whatsappPhoneNumber  = tenant.WhatsAppPhoneNumber,
            });
        }).RequireAuthorization();

        app.MapPut("/auth/connect/instagram", async (
            ConnectInstagramRequest req,
            ClaimsPrincipal         user,
            AppDbContext            db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var tenant   = await db.Tenants.FindAsync(tenantId);
            if (tenant is null) return Results.Unauthorized();

            tenant.InstagramPageId      = req.PageId;
            tenant.InstagramAccessToken = req.AccessToken;
            tenant.InstagramPageName    = req.PageName;
            await db.SaveChangesAsync();
            return Results.Ok(new { message = "Instagram conectado com sucesso" });
        }).RequireAuthorization();

        app.MapPut("/auth/connect/whatsapp", async (
            ConnectWhatsAppRequest req,
            ClaimsPrincipal        user,
            AppDbContext           db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var tenant   = await db.Tenants.FindAsync(tenantId);
            if (tenant is null) return Results.Unauthorized();

            tenant.WhatsAppPhoneNumberId = req.PhoneNumberId;
            tenant.WhatsAppAccessToken   = req.AccessToken;
            tenant.WhatsAppPhoneNumber   = req.PhoneNumber;
            await db.SaveChangesAsync();
            return Results.Ok(new { message = "WhatsApp conectado com sucesso" });
        }).RequireAuthorization();
    }

    private static string GenerateToken(Tenant tenant, IConfiguration cfg)
    {
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Secret"]!));
        var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims  = new[] {
            new Claim(ClaimTypes.NameIdentifier, tenant.Id.ToString()),
            new Claim(ClaimTypes.Email,          tenant.Email),
            new Claim(ClaimTypes.Name,           tenant.Name),
        };
        var token = new JwtSecurityToken(
            claims:   claims,
            expires:  DateTime.UtcNow.AddDays(30),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateSlug(string name)
        => name.ToLower().Replace(" ", "-").Replace("[^a-z0-9-]", "") + "-" + Guid.NewGuid().ToString("N")[..6];
}

record RegisterRequest(string Name, string Email, string Password);
record LoginRequest(string Email, string Password);
record ConnectInstagramRequest(string PageId, string AccessToken, string? PageName);
record ConnectWhatsAppRequest(string PhoneNumberId, string AccessToken, string? PhoneNumber);
