# DM Pilot — Automação de Vendas Instagram + WhatsApp

SaaS completo para converter DMs em vendas usando IA (Claude).

## Stack
- **Backend**: .NET 8 + Minimal APIs + Clean Architecture
- **Banco**: PostgreSQL + EF Core
- **Filas**: Hangfire (background jobs)
- **IA**: Claude Haiku (Anthropic)
- **Plataformas**: Instagram Graph API + WhatsApp Business API
- **Dashboard**: Next.js 15

## Início rápido

### 1. Banco de dados
```bash
docker-compose up postgres -d
```

### 2. Backend
```bash
cd src/DmPilot.Api

# Configurar variáveis (editar appsettings.json ou usar user-secrets)
dotnet user-secrets set "Claude:ApiKey" "sk-ant-..."
dotnet user-secrets set "Meta:AppSecret" "..."
dotnet user-secrets set "Jwt:Secret" "chave-forte-32-chars"

# Migration
dotnet ef migrations add InitialCreate --project ../DmPilot.Infrastructure
dotnet ef database update

# Rodar
dotnet run
# API disponível em: http://localhost:5000
# Hangfire dashboard: http://localhost:5000/hangfire (apenas dev)
```

### 3. Dashboard
```bash
cd frontend
cp .env.example .env.local
# Editar NEXT_PUBLIC_API_URL=http://localhost:5000
npm install
npm run dev
# Dashboard em: http://localhost:3000
```

### 4. Docker (produção)
```bash
cp .env.example .env
# Editar as variáveis
docker-compose up -d
```

## Configurar Meta (Instagram + WhatsApp)

### Instagram
1. Criar app no [developers.facebook.com](https://developers.facebook.com)
2. Adicionar produto "Messenger" e "Instagram"
3. Webhook URL: `https://seudominio.com/webhooks/instagram`
4. Verify token: mesmo valor de `Meta:InstagramVerifyToken`
5. Subscrever eventos: `messages`, `messaging_seen`

### WhatsApp Business
1. No mesmo app Meta, adicionar produto "WhatsApp"
2. Webhook URL: `https://seudominio.com/webhooks/whatsapp`
3. Verify token: mesmo valor de `Meta:WhatsAppVerifyToken`
4. Subscrever: `messages`

## Variáveis de ambiente obrigatórias

```env
CLAUDE_API_KEY=sk-ant-...
META_APP_SECRET=...
INSTAGRAM_VERIFY_TOKEN=token-secreto-qualquer
WHATSAPP_VERIFY_TOKEN=token-secreto-qualquer
JWT_SECRET=chave-forte-minimo-32-chars
```

## Fluxo de dados
```
Lead manda DM → Webhook Meta → Hangfire Job → Claude IA → Resposta automática
                                    ↓
                          Score atualizado + Lead qualificado
                                    ↓
                         Se READY_TO_BUY → Link de pagamento enviado
```

## Estrutura de preços sugerida
- Starter: R$97/mês — 100 leads, 1.000 mensagens IA
- Pro: R$197/mês — 500 leads, Instagram + WhatsApp
- Scale: R$497/mês — 2.000 leads, ilimitado
