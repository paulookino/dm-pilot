'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Check, ArrowRight, Shield } from 'lucide-react'
import { api } from '@/lib/api'

const PLANS = [
  {
    id:        'starter',
    name:      'Starter',
    price:     97,
    desc:      'Para quem está começando a vender via DMs',
    features:  ['500 mensagens IA/mês', 'Instagram OU WhatsApp', '5 campanhas', 'Lead scoring', 'Suporte por email'],
    popular:   false,
    color:     '#6366f1',
  },
  {
    id:        'pro',
    name:      'Pro',
    price:     197,
    desc:      'Para quem vende todo dia pelas redes sociais',
    features:  ['2.000 mensagens IA/mês', 'Instagram + WhatsApp', 'Campanhas ilimitadas', 'Onboarding automático', 'Relatórios de conversão', 'Suporte prioritário'],
    popular:   true,
    color:     '#7c3aed',
  },
  {
    id:        'scale',
    name:      'Scale',
    price:     497,
    desc:      'Para times e infoprodutores de alto volume',
    features:  ['Mensagens ilimitadas', 'Instagram + WhatsApp', 'Tudo do Pro', 'API access', 'Webhook customizado', 'Onboarding dedicado'],
    popular:   false,
    color:     '#a78bfa',
  },
]

export default function PricingPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error,   setError]   = useState('')

  async function handleCheckout(planId: string) {
    setLoading(planId); setError('')
    try {
      const token = localStorage.getItem('token')
      if (!token) { router.push(`/signup?plan=${planId}`); return }

      const res = await api.post('/billing/checkout', { plan: planId })
      if (res.data.url) window.location.href = res.data.url
      else setError(res.data.error ?? 'Erro ao iniciar checkout.')
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Stripe não configurado ainda.')
    } finally { setLoading(null) }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0a14' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <Link href="/landing" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">DM Pilot</span>
        </Link>
        <Link href="/login" className="text-sm font-medium transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>Já tenho conta</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-8 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-white mb-3">Planos simples, sem surpresas</h1>
          <p style={{ color: '#64748b' }}>7 dias grátis em qualquer plano. Cancele quando quiser.</p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-8 px-4 py-3 rounded-xl text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.id} className="rounded-2xl p-6 relative"
              style={{
                background: plan.popular ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.1))' : 'rgba(255,255,255,0.03)',
                border: plan.popular ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: plan.popular ? '0 0 40px rgba(124,58,237,0.15)' : 'none',
              }}>

              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                  Mais popular
                </div>
              )}

              <div className="mb-5">
                <p className="text-sm font-semibold mb-1" style={{ color: plan.color }}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">R${plan.price}</span>
                  <span className="text-sm mb-1.5" style={{ color: '#64748b' }}>/mês</span>
                </div>
                <p className="text-xs" style={{ color: '#64748b' }}>{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${plan.color}20` }}>
                      <Check className="w-2.5 h-2.5" style={{ color: plan.color }} />
                    </div>
                    <span style={{ color: '#94a3b8' }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button onClick={() => handleCheckout(plan.id)} disabled={loading === plan.id}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: plan.popular ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.08)' }}>
                {loading === plan.id ? 'Redirecionando...' : <><ArrowRight className="w-4 h-4" /> Começar 7 dias grátis</>}
              </button>
            </div>
          ))}
        </div>

        {/* Garantia */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-sm" style={{ color: '#64748b' }}>
            <Shield className="w-4 h-4" />
            Garantia de 7 dias. Se não gostar, devolvemos. Sem pergunta.
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-6 text-center">Perguntas frequentes</h3>
          <div className="space-y-4">
            {[
              { q: 'Preciso de cartão para o trial?', a: 'Sim, mas não cobramos nada nos primeiros 7 dias. Cancele antes e não paga nada.' },
              { q: 'O que acontece quando acabo as mensagens?', a: 'Você recebe um aviso e pode fazer upgrade. Não cortamos no meio de uma venda.' },
              { q: 'Funciona com qualquer conta do Instagram?', a: 'Precisa ser uma conta comercial ou criador de conteúdo com acesso à API da Meta.' },
              { q: 'Posso mudar de plano depois?', a: 'Sim, a qualquer momento. O upgrade é imediato, o downgrade vale no próximo ciclo.' },
            ].map(({ q, a }) => (
              <div key={q} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm font-semibold text-white mb-1">{q}</p>
                <p className="text-sm" style={{ color: '#64748b' }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
