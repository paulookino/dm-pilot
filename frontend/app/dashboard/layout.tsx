'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, MessageSquare, Zap, BarChart2, Settings, LogOut, Bot, ArrowRight } from 'lucide-react'
import { authApi } from '@/lib/api'

const NAV = [
  { href: '/dashboard',               icon: BarChart2,      label: 'Dashboard' },
  { href: '/dashboard/leads',         icon: Users,          label: 'Leads' },
  { href: '/dashboard/conversations', icon: MessageSquare,  label: 'Conversas' },
  { href: '/dashboard/campaigns',     icon: Bot,            label: 'Campanhas' },
  { href: '/dashboard/settings',      icon: Settings,       label: 'Configurações' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [plan,   setPlan]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/login'); return }

    authApi.me()
      .then(r => { setPlan(r.data.plan); setLoading(false) })
      .catch(() => { router.push('/login') })
  }, [router])

  function logout() {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a14' }}>
        <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // Paywall — plano Free não tem acesso ao dashboard
  if (plan === 'Free') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a0a14' }}>
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
            <Zap className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Assine para continuar</h1>
          <p className="mb-8" style={{ color: '#64748b' }}>
            O dashboard requer uma assinatura ativa. Escolha seu plano e comece a vender via DM agora.
          </p>

          <Link href="/pricing"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-bold text-lg w-full justify-center hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 40px rgba(124,58,237,0.3)' }}>
            Ver planos <ArrowRight className="w-5 h-5" />
          </Link>

          <button onClick={logout} className="mt-4 text-sm hover:text-white transition-colors" style={{ color: '#64748b' }}>
            Sair da conta
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full" style={{ background: '#0a0a14' }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col" style={{ background: '#0f0f1e', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">DM Pilot</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                  border: active ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                }}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pb-4">
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-red-500/10"
            style={{ color: 'rgba(248,113,113,0.7)' }}>
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
