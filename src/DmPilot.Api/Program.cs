using DmPilot.Api.Endpoints;
using DmPilot.Api.Jobs;
using DmPilot.Application.Interfaces;
using DmPilot.Application.Services;
using DmPilot.Application.UseCases;
using DmPilot.Infrastructure.AI;
using DmPilot.Infrastructure.Data;
using DmPilot.Infrastructure.Messaging;
using Hangfire;
using Hangfire.InMemory;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────
var pg         = builder.Configuration.GetConnectionString("Postgres");
var usePg      = !string.IsNullOrEmpty(pg);
var sqlitePath = Path.Combine(builder.Environment.ContentRootPath, "dmpilot.db");

builder.Services.AddDbContext<AppDbContext>(opt =>
{
    if (usePg) opt.UseNpgsql(pg, o => o.MigrationsAssembly("DmPilot.Infrastructure"));
    else       opt.UseSqlite($"Data Source={sqlitePath}", o => o.MigrationsAssembly("DmPilot.Infrastructure"));
});
builder.Services.AddScoped<IDbContextAccessor, AppDbContextAccessor>();

// ── Hangfire ──────────────────────────────────────────────────
builder.Services.AddHangfire(cfg =>
{
    cfg.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
       .UseSimpleAssemblyNameTypeSerializer()
       .UseRecommendedSerializerSettings();
    if (usePg) cfg.UsePostgreSqlStorage(c => c.UseNpgsqlConnection(pg));
    else       cfg.UseInMemoryStorage();
});
builder.Services.AddHangfireServer(opt => opt.WorkerCount = 3);

// ── HTTP Clients ──────────────────────────────────────────────
builder.Services.AddHttpClient<IInstagramClient, InstagramClient>();
builder.Services.AddHttpClient<IWhatsAppClient, WhatsAppClient>();
builder.Services.AddHttpClient<IClaudeClient, GroqApiClient>(); // Gratuito!

// ── App Services ──────────────────────────────────────────────
builder.Services.AddScoped<AiContextBuilder>();
builder.Services.AddScoped<ProcessInboundMessageUseCase>();
builder.Services.AddScoped<WebhookQueueService>();

// ── JWT Auth ──────────────────────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret not configured");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer   = false,
            ValidateAudience = false,
            ClockSkew        = TimeSpan.Zero,
        };
    });
builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────
builder.Services.AddCors(opt => opt.AddPolicy("Dashboard", policy =>
    policy.SetIsOriginAllowed(_ => true)   // aceitar qualquer origem (dev e prod via config)
          .AllowAnyHeader()
          .AllowAnyMethod()));

var app = builder.Build();

// ── CORS manual (garante funcionamento com Minimal APIs) ─────
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers["Access-Control-Allow-Origin"]  = ctx.Request.Headers["Origin"].FirstOrDefault() ?? "*";
    ctx.Response.Headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
    ctx.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Requested-With";
    ctx.Response.Headers["Access-Control-Max-Age"]       = "86400";
    if (ctx.Request.Method == "OPTIONS") { ctx.Response.StatusCode = 204; return; }
    await next();
});

app.UseCors("Dashboard");
app.UseAuthentication();
app.UseAuthorization();

// ── Auto Migration ────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

// ── Endpoints ─────────────────────────────────────────────────
app.MapWebhookEndpoints();
app.MapAuthEndpoints();
app.MapLeadEndpoints();
app.MapConversationEndpoints();
app.MapCampaignEndpoints();
app.MapOnboardingEndpoints();
app.MapBillingEndpoints();

// ── Hangfire Dashboard (protegido) ────────────────────────────
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new HangfireAuthFilter()]
});

app.MapGet("/health", () => new { status = "ok", ts = DateTime.UtcNow });

app.Run();
