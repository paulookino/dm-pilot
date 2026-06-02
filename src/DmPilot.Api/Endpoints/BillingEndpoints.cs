using DmPilot.Domain.Enums;
using DmPilot.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using System.Security.Claims;

namespace DmPilot.Api.Endpoints;

public static class BillingEndpoints
{
    public static void MapBillingEndpoints(this IEndpointRouteBuilder app)
    {
        // ── Criar sessão de checkout ──────────────────────────
        app.MapPost("/billing/checkout", async (
            CheckoutRequest   req,
            ClaimsPrincipal   user,
            AppDbContext       db,
            IConfiguration     cfg,
            HttpContext        ctx) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var tenant   = await db.Tenants.FindAsync(tenantId);
            if (tenant is null) return Results.Unauthorized();

            var sk = cfg["Stripe:SecretKey"];
            if (string.IsNullOrEmpty(sk))
                return Results.BadRequest(new { error = "Stripe não configurado. Adicione STRIPE_SECRET_KEY." });

            StripeConfiguration.ApiKey = sk;

            // Criar ou reutilizar customer
            if (string.IsNullOrEmpty(tenant.StripeCustomerId))
            {
                var custSvc  = new CustomerService();
                var customer = await custSvc.CreateAsync(new CustomerCreateOptions
                {
                    Email    = tenant.Email,
                    Name     = tenant.Name,
                    Metadata = new Dictionary<string, string> { ["tenant_id"] = tenant.Id.ToString() }
                });
                tenant.StripeCustomerId = customer.Id;
                await db.SaveChangesAsync();
            }

            var priceId = req.Plan switch
            {
                "starter" => cfg["Stripe:PriceStarter"],
                "pro"     => cfg["Stripe:PricePro"],
                "scale"   => cfg["Stripe:PriceScale"],
                _         => null,
            };

            if (string.IsNullOrEmpty(priceId))
                return Results.BadRequest(new { error = $"Plano '{req.Plan}' inválido ou price não configurado." });

            var appUrl = cfg["AllowedOrigins"]?.Split(',').FirstOrDefault() ?? "http://localhost:3010";

            var sessionSvc = new SessionService();
            var session    = await sessionSvc.CreateAsync(new SessionCreateOptions
            {
                Customer           = tenant.StripeCustomerId,
                Mode               = "subscription",
                LineItems          = [new SessionLineItemOptions { Price = priceId, Quantity = 1 }],
                SuccessUrl         = $"{appUrl}/dashboard?checkout=success",
                CancelUrl          = $"{appUrl}/pricing?canceled=true",
                SubscriptionData   = new SessionSubscriptionDataOptions
                {
                    TrialPeriodDays = 7,
                    Metadata        = new Dictionary<string, string> { ["tenant_id"] = tenant.Id.ToString() }
                },
                Locale = "pt-BR",
            });

            return Results.Ok(new { url = session.Url });
        }).RequireAuthorization();

        // ── Portal do cliente ─────────────────────────────────
        app.MapPost("/billing/portal", async (
            ClaimsPrincipal user,
            AppDbContext     db,
            IConfiguration   cfg) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var tenant   = await db.Tenants.FindAsync(tenantId);
            if (tenant?.StripeCustomerId is null)
                return Results.BadRequest(new { error = "Sem assinatura ativa." });

            StripeConfiguration.ApiKey = cfg["Stripe:SecretKey"]!;
            var appUrl  = cfg["AllowedOrigins"]?.Split(',').FirstOrDefault() ?? "http://localhost:3010";
            var svc     = new Stripe.BillingPortal.SessionService();
            var portal  = await svc.CreateAsync(new Stripe.BillingPortal.SessionCreateOptions
            {
                Customer  = tenant.StripeCustomerId,
                ReturnUrl = $"{appUrl}/dashboard",
            });

            return Results.Ok(new { url = portal.Url });
        }).RequireAuthorization();

        // ── Webhook Stripe ────────────────────────────────────
        app.MapPost("/billing/webhook", async (
            HttpRequest    request,
            AppDbContext   db,
            IConfiguration cfg) =>
        {
            var webhookSecret = cfg["Stripe:WebhookSecret"];
            if (string.IsNullOrEmpty(webhookSecret)) return Results.Ok();

            StripeConfiguration.ApiKey = cfg["Stripe:SecretKey"]!;
            var body = await new StreamReader(request.Body).ReadToEndAsync();
            var sig  = request.Headers["Stripe-Signature"].ToString();

            Event stripeEvent;
            try { stripeEvent = EventUtility.ConstructEvent(body, sig, webhookSecret); }
            catch { return Results.BadRequest(); }

            switch (stripeEvent.Type)
            {
                case "customer.subscription.created":
                case "customer.subscription.updated":
                {
                    var sub      = (Subscription)stripeEvent.Data.Object;
                    var tenantId = sub.Metadata.GetValueOrDefault("tenant_id");
                    if (tenantId is null) break;

                    var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == Guid.Parse(tenantId));
                    if (tenant is null) break;

                    tenant.StripeSubscriptionId = sub.Id;
                    tenant.SubscriptionStatus   = sub.Status;

                    // Mapear price → plano
                    var priceId = sub.Items.Data.FirstOrDefault()?.Price?.Id;
                    tenant.Plan = priceId switch
                    {
                        var p when p == cfg["Stripe:PriceStarter"] => PlanType.Starter,
                        var p when p == cfg["Stripe:PricePro"]     => PlanType.Pro,
                        var p when p == cfg["Stripe:PriceScale"]   => PlanType.Scale,
                        _                                           => PlanType.Starter,
                    };
                    tenant.MonthlyMessageQuota = PlanLimits.MonthlyMessages(tenant.Plan);
                    await db.SaveChangesAsync();
                    break;
                }
                case "customer.subscription.deleted":
                {
                    var sub      = (Subscription)stripeEvent.Data.Object;
                    var tenantId = sub.Metadata.GetValueOrDefault("tenant_id");
                    if (tenantId is null) break;
                    var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == Guid.Parse(tenantId));
                    if (tenant is null) break;
                    tenant.SubscriptionStatus   = "canceled";
                    tenant.Plan                 = PlanType.Free;
                    tenant.MonthlyMessageQuota  = 50;
                    await db.SaveChangesAsync();
                    break;
                }
            }

            return Results.Ok();
        });

        // ── Info do plano atual ───────────────────────────────
        app.MapGet("/billing/plan", async (
            ClaimsPrincipal user,
            AppDbContext     db) =>
        {
            var tenantId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var tenant   = await db.Tenants.FindAsync(tenantId);
            if (tenant is null) return Results.Unauthorized();

            return Results.Ok(new
            {
                plan              = tenant.Plan.ToString(),
                priceLabel        = PlanLimits.PriceLabel(tenant.Plan),
                status            = tenant.SubscriptionStatus,
                monthlyQuota      = PlanLimits.MonthlyMessages(tenant.Plan),
                messagesUsed      = tenant.MessagesSentThisMonth,
                canUseWhatsApp    = PlanLimits.CanUseWhatsApp(tenant.Plan),
                canUseInstagram   = PlanLimits.CanUseInstagram(tenant.Plan),
                isTrialing        = tenant.SubscriptionStatus == "trialing",
                isCanceled        = tenant.SubscriptionStatus is "canceled" or null,
            });
        }).RequireAuthorization();
    }
}

record CheckoutRequest(string Plan);
