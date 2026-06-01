using DmPilot.Api.Endpoints;
using DmPilot.Api.Jobs;
using DmPilot.Application.Interfaces;
using DmPilot.Application.Services;
using DmPilot.Application.UseCases;
using DmPilot.Infrastructure.AI;
using DmPilot.Infrastructure.Data;
using DmPilot.Infrastructure.Messaging;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(
        builder.Configuration.GetConnectionString("Postgres"),
        npg => npg.MigrationsAssembly("DmPilot.Infrastructure")));
builder.Services.AddScoped<IDbContextAccessor, AppDbContextAccessor>();

// ── Hangfire ──────────────────────────────────────────────────
builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UsePostgreSqlStorage(c => c.UseNpgsqlConnection(
        builder.Configuration.GetConnectionString("Postgres"))));
builder.Services.AddHangfireServer(opt => opt.WorkerCount = 5);

// ── HTTP Clients ──────────────────────────────────────────────
builder.Services.AddHttpClient<IInstagramClient, InstagramClient>();
builder.Services.AddHttpClient<IWhatsAppClient, WhatsAppClient>();
builder.Services.AddHttpClient<IClaudeClient, ClaudeApiClient>();

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

// ── CORS (para o dashboard Next.js) ──────────────────────────
builder.Services.AddCors(opt => opt.AddPolicy("Dashboard", policy =>
    policy.WithOrigins(builder.Configuration["AllowedOrigins"] ?? "http://localhost:3000")
          .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// ── Middleware ────────────────────────────────────────────────
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

// ── Hangfire Dashboard (protegido) ────────────────────────────
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new HangfireAuthFilter()]
});

app.MapGet("/health", () => new { status = "ok", ts = DateTime.UtcNow });

app.Run();
