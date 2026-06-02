'use client'
import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authApi } from '@/lib/api'
import { Zap } from 'lucide-react'

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const planParam    = searchParams.get('plan')

  const [tab,   setTab]     = useState<'login' | 'register'>('login')
  const [name,  setName]    = useState('')
  const [email, setEmail]   = useState('')
  const [pass,  setPass]    = useState('')
  const [err,   setErr]     = useState('')
  const [load,  setLoad]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoad(true)
    try {
      const res = tab === 'login'
        ? await authApi.login(email, pass)
        : await authApi.register(name, email, pass)
      localStorage.setItem('token', res.data.token)
      if (tab === 'register' && planParam) router.push(`/pricing?plan=${planParam}`)
      else router.push('/dashboard')
    } catch (e: any) {
      setErr(e.response?.data?.error ?? 'Erro. Verifique os dados.')
    } finally { setLoad(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1a' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">DM Pilot</span>
          </div>
          <p className="text-gray-400 text-sm">Automação de vendas via Instagram e WhatsApp</p>
          {planParam && (
            <p className="text-xs mt-2 px-3 py-1 rounded-full inline-block" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}>
              Crie sua conta e assine o plano {planParam}
            </p>
          )}
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: tab === t ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'transparent',
                  color: tab === t ? '#fff' : '#94a3b8',
                }}>
                {t === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <input value={name} onChange={e => setName(e.target.value)} required
                placeholder="Seu nome" className="w-full rounded-xl px-4 py-3 text-sm outline-none text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="Email" className="w-full rounded-xl px-4 py-3 text-sm outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
              placeholder="Senha" className="w-full rounded-xl px-4 py-3 text-sm outline-none text-white"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

            {err && <p className="text-sm text-red-400 text-center">{err}</p>}

            <button type="submit" disabled={load}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
              {load ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta grátis'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f1a' }} />}>
      <LoginForm />
    </Suspense>
  )
}
