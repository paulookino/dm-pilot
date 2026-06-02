FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["DmPilot.Api/DmPilot.Api.csproj",                         "DmPilot.Api/"]
COPY ["DmPilot.Application/DmPilot.Application.csproj",         "DmPilot.Application/"]
COPY ["DmPilot.Domain/DmPilot.Domain.csproj",                   "DmPilot.Domain/"]
COPY ["DmPilot.Infrastructure/DmPilot.Infrastructure.csproj",   "DmPilot.Infrastructure/"]
RUN dotnet restore "DmPilot.Api/DmPilot.Api.csproj"
COPY . .
WORKDIR "/src/DmPilot.Api"
RUN dotnet publish "DmPilot.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DmPilot.Api.dll"]
