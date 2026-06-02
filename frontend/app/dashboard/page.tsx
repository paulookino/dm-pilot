'use client'
import { useEffect, useState } from 'react'
import { leadsApi, campaignsApi, authApi } from '@/lib/api'
import {
  CheckCircle2, XCircle, AlertCircle, ArrowRight,
  Camera, MessageCircle, Bot, Zap, Users, TrendingUp,
  Flame, ExternalLink, Copy, ChevronDown, ChevronUp
} from 'lucide-react'
import Link from 'next/link'

interface Profile {
  instagramConnected: boolean; whatsappConnected: boolean
  instagramPageName: string | null; whatsappPhoneNumber: string | null
  quota: { limit: number; used: number }; plan: string
}

export default function DashboardPage() {
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [stats,     setStats]     = useState<any>(null)
  const [copied,    setCopied]    = useState('')
  const [ngrokUrl,  setNgrokUrl]  = useState('')
  const [expanded,  setExpanded]  = useState<string | null>(null)

  useEffect(() => {
    authApi.me().then(r => setProfile(r.data)).catch(() => {})
    campaignsApi.list().then(r => setCampaigns(r.data)).catch(() => {})
    leadsApi.stats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 2000)
  }

  const hasCampaign = campaigns.length > 0
  const hasIg = profile?.instagramConnected
  const hasWa = profile?.whatsappConnected

  const setupSteps = [
    { id: 'ai', icon: Bot, title: 'IA configurada', desc: 'Groq Llama 3.1 — gratuito e ultrarrápido', done: true, action: null as string | null, actionLabel: '' },
    { id: 'campaign', icon: Zap, title: hasCampaign ? `${campaigns.length} campanha(s) criada(s)` : 'Criar primeira campanha', desc: hasCampaign ? campaigns.map(c => c.name).join(', ') : 'Configure persona, produto e link de pagamento', done: hasCampaign, action: '/dashboard/campaigns' as string | null, actionLabel: hasCampaign ? 'Ver campanhas' : 'Criar campanha' },
    { id: 'instagram', icon: Camera, title: hasIg ? `Instagram: ${profile?.instagramPageName ?? 'conectado'}` : 'Conectar Instagram', desc: hasIg ? 'Webhook ativo — DMs sendo recebidas' : 'Receba DMs do Instagram automaticamente', done: !!hasIg, action: '/dashboard/settings' as string | null, actionLabel: hasIg ? 'Ver configuração' : 'Conectar agora' },
    { id: 'whatsapp', icon: MessageCircle, title: hasWa ? `WhatsApp: ${profile?.whatsappPhoneNumber ?? 'conectado'}` : 'Conectar WhatsApp', desc: hasWa ? 'Webhook ativo — mensagens sendo recebidas' : 'Receba mensagens do WhatsApp Business', done: !!hasWa, action: '/dashboard/settings' as string | null, actionLabel: hasWa ? 'Ver configuração' : 'Conectar agora' },
  ]

  const completedSteps = setupSteps.filter(s => s.done).length
  const allDone        = completedSteps === setupSteps.length
  const funnel         = stats?.funnel ?? []
  const getCount       = (s: string) => funnel.find((f: any) => f.status === s)?.count ?? 0
  const totalLeads     = funnel.reduce((s: number, f: any) => s + f.count, 0)
  const baseUrl        = ngrokUrl || 'http://localhost:5000'
  const igWebhookUrl   = `${baseUrl}/webhooks/instagram`
  const waWebhookUrl   = `${baseUrl}/webhooks/whatsapp`

  return (
    <div className="p-6 space-y-5 max-w-4xl">

      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            {allDone ? 'Sistema ativo — respondendo DMs automaticamente' : `Configure os ${setupSteps.length - completedSteps} passo(s) abaixo para começar`}
          </p>
        </div>
        {allDone && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: 'rgba(40,199,111,0.12)', color: '#28c76f', border: '1px solid rgba(40,199,111,0.2)' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Sistema ativo
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-sm font-bold text-white">Configuração</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{completedSteps} de {setupSteps.length} etapas concluídas</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(completedSteps / setupSteps.length) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #28c76f)' }} />
            </div>
            <span className="text-xs font-bold text-white">{Math.round((completedSteps / setupSteps.length) * 100)}%</span>
          </div>
        </div>
        {setupSteps.map((step, i) => {
          const Icon = step.icon
          return (
            <div key={step.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors" style={{ borderBottom: i < setupSteps.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: step.done ? 'rgba(40,199,111,0.12)' : 'rgba(255,255,255,0.05)' }}>
                  <Icon className="w-4 h-4" style={{ color: step.done ? '#28c76f' : '#64748b' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{step.desc}</p>
                </div>
              </div>
              <div className="flex-shrink-0">
                {step.done
                  ? <CheckCircle2 className="w-5 h-5" style={{ color: '#28c76f' }} />
                  : step.action
                    ? <Link href={step.action} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-80" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                        {step.actionLabel} <ArrowRight className="w-3 h-3" />
                      </Link>
                    : <AlertCircle className="w-5 h-5" style={{ color: '#f59e0b' }} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Métricas */}
      {totalLeads > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Leads',     value: totalLeads,              color: '#6366f1', icon: Users },
            { label: 'Leads Quentes',   value: stats?.hotLeads ?? 0,    color: '#ef4444', icon: Flame },
            { label: 'Negociando',      value: getCount('Negotiating'), color: '#f59e0b', icon: TrendingUp },
            { label: 'Vendas Fechadas', value: getCount('Won'),         color: '#28c76f', icon: CheckCircle2 },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Guia de webhook (expansível) */}
      {(!hasIg || !hasWa) && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <button onClick={() => setExpanded(expanded === 'wh' ? null : 'wh')}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors">
            <div>
              <p className="text-sm font-bold text-white">📋 Guia: configurar webhook Meta (Instagram / WhatsApp)</p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Clique para ver o passo a passo completo com URLs prontas para copiar</p>
            </div>
            {expanded === 'wh' ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: '#64748b' }} />}
          </button>

          {expanded === 'wh' && (
            <div className="px-5 pb-5 space-y-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Passo 1: ngrok */}
              <div className="pt-4">
                <p className="text-xs font-bold text-white mb-2">① Expor a API com ngrok (dev local)</p>
                <div className="flex items-center gap-2 mb-2">
                  <code className="flex-1 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(0,0,0,0.4)', color: '#a78bfa' }}>ngrok http 5000</code>
                  <button onClick={() => copy('ngrok http 5000', 'ngrok')} className="p-2 rounded hover:bg-white/10" style={{ color: '#64748b' }}><Copy className="w-3.5 h-3.5" /></button>
                </div>
                <div>
                  <label className="text-[11px] font-semibold block mb-1" style={{ color: '#64748b' }}>Cole a URL gerada pelo ngrok (ex: https://abc123.ngrok.io):</label>
                  <input value={ngrokUrl} onChange={e => setNgrokUrl(e.target.value)} placeholder="https://abc123.ngrok.io"
                    className="w-full px-3 py-2 rounded-lg text-xs outline-none text-white" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: '#475569' }}>Não tem ngrok? <a href="https://ngrok.com/download" target="_blank" rel="noopener" className="text-purple-400 underline">Baixar grátis</a></p>
              </div>

              {/* Passo 2: URLs */}
              <div>
                <p className="text-xs font-bold text-white mb-2">② URLs e tokens para o painel Meta</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '📸 Instagram', url: igWebhookUrl, token: 'dm-pilot-instagram-token-seguro', urlKey: 'ig-url', tokKey: 'ig-tok', events: 'messages, messaging_seen', color: '#e1306c' },
                    { label: '💬 WhatsApp', url: waWebhookUrl, token: 'dm-pilot-whatsapp-token-seguro', urlKey: 'wa-url', tokKey: 'wa-tok', events: 'messages', color: '#25d366' },
                  ].map(({ label, url, token, urlKey, tokKey, events, color }) => (
                    <div key={label} className="p-3 rounded-xl space-y-2.5" style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${color}25` }}>
                      <p className="text-xs font-semibold" style={{ color }}>{label}</p>
                      {[
                        { lbl: 'Webhook URL', val: url, key: urlKey },
                        { lbl: 'Verify Token', val: token, key: tokKey },
                      ].map(({ lbl, val, key }) => (
                        <div key={key}>
                          <p className="text-[10px] font-semibold mb-1" style={{ color: '#64748b' }}>{lbl}</p>
                          <div className="flex items-center gap-1.5">
                            <code className="flex-1 px-2 py-1.5 rounded text-[10px] truncate" style={{ background: 'rgba(0,0,0,0.4)', color: '#a78bfa' }}>{val}</code>
                            <button onClick={() => copy(val, key)} className="p-1 rounded hover:bg-white/10 flex-shrink-0" style={{ color: '#64748b' }}>
                              {copied === key ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px]" style={{ color: '#475569' }}>Eventos: <span className="text-white">{events}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passo 3 */}
              <div>
                <p className="text-xs font-bold text-white mb-1">③ Cole as credenciais nas Configurações</p>
                <Link href="/dashboard/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-80 transition-opacity" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                  Ir para Configurações <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Como funciona */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-sm font-bold text-white mb-3">Como funciona o fluxo automático</p>
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {['💬 DM do lead', '→', '🔗 Webhook Meta', '→', '🤖 Groq Llama 3.1', '→', '✍️ Resposta automática', '→', '📊 Score atualizado', '→', '💳 Link de pagamento'].map((item, i) => (
            item === '→'
              ? <span key={i} style={{ color: '#334155' }}>→</span>
              : <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>{item}</span>
          ))}
        </div>
        <p className="text-xs" style={{ color: '#475569' }}>
          Quando o lead demonstra interesse (score ≥ 70), a IA injeta o link de pagamento automaticamente.
          Você pode <Link href="/dashboard/conversations" className="text-purple-400 underline">assumir qualquer conversa manualmente</Link> quando quiser.
        </p>
      </div>

      {/* Links rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/dashboard/campaigns',     icon: Zap,           label: 'Criar campanha',      desc: 'Produto, persona e link de pagamento' },
          { href: '/dashboard/conversations', icon: MessageCircle, label: 'Ver conversas',        desc: 'Monitore e intervenha em tempo real' },
          { href: '/dashboard/settings',      icon: Camera,        label: 'Conectar plataformas', desc: 'Instagram e WhatsApp Business' },
        ].map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href} className="flex flex-col gap-2 p-4 rounded-2xl transition-all hover:scale-[1.01]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)' }}>
              <Icon className="w-4 h-4" style={{ color: '#a78bfa' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#64748b' }}>{desc}</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#7c3aed' }}>
              Acessar <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Funil */}
      {totalLeads > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-sm font-bold text-white mb-4">Funil de vendas</p>
          <div className="space-y-2.5">
            {[
              { label: 'Novos',        status: 'New',         color: '#6366f1' },
              { label: 'Contatados',   status: 'Contacted',   color: '#8b5cf6' },
              { label: 'Qualificados', status: 'Qualified',   color: '#a78bfa' },
              { label: 'Negociando',   status: 'Negotiating', color: '#f59e0b' },
              { label: 'Ganhos',       status: 'Won',         color: '#10b981' },
            ].map(({ label, status, color }) => {
              const count = getCount(status)
              const pct   = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs w-24 text-right flex-shrink-0" style={{ color: '#64748b' }}>{label}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-xs font-mono font-semibold w-6 text-white">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
