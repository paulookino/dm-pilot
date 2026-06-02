'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, api } from '@/lib/api'
import { Camera, MessageCircle, Key, Save, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'

interface Profile {
  id: string; name: string; email: string; plan: string
  instagramConnected: boolean; instagramPageName: string | null
  whatsappConnected: boolean; whatsappPhoneNumber: string | null
  quota: { limit: number; used: number }
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [saving,  setSaving]    = useState<string | null>(null)
  const [saved,   setSaved]     = useState<string | null>(null)

  // Instagram
  const [igPageId,  setIgPageId]  = useState('')
  const [igToken,   setIgToken]   = useState('')
  const [igName,    setIgName]    = useState('')

  // WhatsApp
  const [waPhoneId, setWaPhoneId] = useState('')
  const [waToken,   setWaToken]   = useState('')
  const [waPhone,   setWaPhone]   = useState('')

  useEffect(() => {
    authApi.me().then(r => setProfile(r.data)).catch(() => router.push('/login'))
  }, [router])

  async function saveInstagram() {
    setSaving('ig'); setSaved(null)
    await api.put('/auth/connect/instagram', { pageId: igPageId, accessToken: igToken, pageName: igName })
    setSaving(null); setSaved('ig')
    setTimeout(() => setSaved(null), 3000)
    authApi.me().then(r => setProfile(r.data))
  }

  async function saveWhatsApp() {
    setSaving('wa'); setSaved(null)
    await api.put('/auth/connect/whatsapp', { phoneNumberId: waPhoneId, accessToken: waToken, phoneNumber: waPhone })
    setSaving(null); setSaved('wa')
    setTimeout(() => setSaved(null), 3000)
    authApi.me().then(r => setProfile(r.data))
  }

  const Card = ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div className="rounded-2xl p-6 space-y-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h2 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  )

  const Field = ({ label, value, onChange, type = 'text', placeholder }: {
    label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
  }) => (
    <div>
      <label className="text-xs font-semibold block mb-1.5" style={{ color: '#64748b' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none text-white"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
    </div>
  )

  const SaveBtn = ({ onClick, id, disabled }: { onClick: () => void; id: string; disabled?: boolean }) => (
    <button onClick={onClick} disabled={saving === id || disabled}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
      style={{ background: saved === id ? '#10b981' : 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
      {saving === id ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === id ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saved === id ? 'Salvo!' : 'Salvar'}
    </button>
  )

  if (!profile) return <div className="p-6 text-gray-400 text-sm">Carregando...</div>

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <h1 className="text-xl font-bold text-white">Configurações</h1>

      {/* Conta */}
      <Card title="Minha conta">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Nome</p>
            <p className="text-sm text-white">{profile.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Email</p>
            <p className="text-sm text-white">{profile.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Plano</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>{profile.plan}</span>
          </div>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: '#64748b' }}>Uso do mês</p>
            <p className="text-sm text-white">{profile.quota?.used ?? 0} / {profile.quota?.limit ?? 0} msgs</p>
          </div>
        </div>
      </Card>

      {/* Instagram */}
      <Card title="Instagram">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(225,48,108,0.15)' }}>
            <Camera className="w-4 h-4" style={{ color: '#e1306c' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {profile.instagramConnected ? `✓ Conectado${profile.instagramPageName ? ` — ${profile.instagramPageName}` : ''}` : 'Não conectado'}
            </p>
            <p className="text-xs" style={{ color: '#64748b' }}>Instagram Graph API</p>
          </div>
        </div>

        <div className="p-3 rounded-xl text-xs space-y-1 mb-4" style={{ background: 'rgba(255,255,255,0.03)', color: '#64748b' }}>
          <p className="font-semibold text-white mb-1">Como obter as credenciais:</p>
          <p>1. Acesse <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-purple-400 underline">developers.facebook.com</a> e crie um app</p>
          <p>2. Adicione o produto <strong className="text-white">Messenger</strong> e conecte sua página</p>
          <p>3. Gere um <strong className="text-white">Page Access Token</strong> permanente</p>
          <p>4. Configure o webhook: <code className="bg-black/30 px-1 rounded">http://localhost:5000/webhooks/instagram</code></p>
        </div>

        <Field label="Page ID" value={igPageId} onChange={setIgPageId} placeholder="123456789" />
        <Field label="Page Access Token" value={igToken} onChange={setIgToken} type="password" placeholder="EAABsbCS..." />
        <Field label="Nome da página (opcional)" value={igName} onChange={setIgName} placeholder="Minha Empresa" />
        <SaveBtn onClick={saveInstagram} id="ig" disabled={!igPageId || !igToken} />
      </Card>

      {/* WhatsApp */}
      <Card title="WhatsApp Business">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(37,211,102,0.12)' }}>
            <MessageCircle className="w-4 h-4" style={{ color: '#25d366' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {profile.whatsappConnected ? `✓ Conectado${profile.whatsappPhoneNumber ? ` — ${profile.whatsappPhoneNumber}` : ''}` : 'Não conectado'}
            </p>
            <p className="text-xs" style={{ color: '#64748b' }}>WhatsApp Business Cloud API</p>
          </div>
        </div>

        <div className="p-3 rounded-xl text-xs space-y-1 mb-4" style={{ background: 'rgba(255,255,255,0.03)', color: '#64748b' }}>
          <p className="font-semibold text-white mb-1">Como obter as credenciais:</p>
          <p>1. No mesmo app Meta, adicione o produto <strong className="text-white">WhatsApp</strong></p>
          <p>2. Copie o <strong className="text-white">Phone Number ID</strong> e o <strong className="text-white">Access Token</strong></p>
          <p>3. Configure o webhook: <code className="bg-black/30 px-1 rounded">http://localhost:5000/webhooks/whatsapp</code></p>
        </div>

        <Field label="Phone Number ID" value={waPhoneId} onChange={setWaPhoneId} placeholder="123456789" />
        <Field label="Access Token" value={waToken} onChange={setWaToken} type="password" placeholder="EAABsbCS..." />
        <Field label="Número de telefone (opcional)" value={waPhone} onChange={setWaPhone} placeholder="+5511999999999" />
        <SaveBtn onClick={saveWhatsApp} id="wa" disabled={!waPhoneId || !waToken} />
      </Card>

      {/* Groq — IA Gratuita */}
      <Card title="Inteligência Artificial">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(40,199,111,0.12)' }}>
            <Key className="w-4 h-4" style={{ color: '#28c76f' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Groq — Llama 3.1 8B</p>
            <p className="text-xs font-semibold" style={{ color: '#28c76f' }}>✓ 100% gratuito · Sem cartão · Resposta em &lt;1s</p>
          </div>
        </div>
        <div className="p-3 rounded-xl text-xs space-y-2 mb-3" style={{ background: 'rgba(255,255,255,0.03)', color: '#64748b' }}>
          <p className="font-semibold text-white">Como ativar (2 minutos):</p>
          <p>1. Acesse <a href="https://console.groq.com" target="_blank" rel="noopener" className="text-purple-400 underline">console.groq.com</a> e crie conta grátis</p>
          <p>2. Clique em <strong className="text-white">API Keys → Create API Key</strong></p>
          <p>3. Cole no <code className="bg-black/30 px-1 rounded">appsettings.json</code> da API:</p>
          <code className="block p-2 rounded mt-1" style={{ background: 'rgba(0,0,0,0.3)', color: '#a78bfa' }}>
            {'"Groq": { "ApiKey": "gsk_..." }'}
          </code>
          <p>Limite gratuito: <strong className="text-white">6.000 tokens/min</strong> (~200 conversas simultâneas).</p>
        </div>
        <a href="https://console.groq.com/keys" target="_blank" rel="noopener"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white w-fit hover:opacity-80 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
          <ExternalLink className="w-4 h-4" /> Criar chave grátis no Groq
        </a>
      </Card>

      {/* Webhooks */}
      <Card title="URLs de Webhook">
        <div className="space-y-2 text-xs" style={{ color: '#64748b' }}>
          {[
            { label: 'Instagram', url: 'http://localhost:5000/webhooks/instagram' },
            { label: 'WhatsApp',  url: 'http://localhost:5000/webhooks/whatsapp' },
          ].map(({ label, url }) => (
            <div key={label} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="font-medium text-white">{label}</span>
              <code className="text-purple-400">{url}</code>
            </div>
          ))}
          <p className="pt-1">Em produção, substitua <code className="bg-black/30 px-1 rounded">localhost:5000</code> pelo seu domínio.</p>
        </div>
      </Card>
    </div>
  )
}
