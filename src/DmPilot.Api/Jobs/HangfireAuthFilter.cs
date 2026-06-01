using Hangfire.Dashboard;

namespace DmPilot.Api.Jobs;

public class HangfireAuthFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext ctx)
    {
        // Em produção, verificar se é admin
        // Por ora, bloquear em produção e liberar em dev
        var env = ctx.GetHttpContext().RequestServices
            .GetRequiredService<IWebHostEnvironment>();
        return env.IsDevelopment();
    }
}
