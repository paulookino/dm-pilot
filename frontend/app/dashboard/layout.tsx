'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Users, MessageSquare, Zap, BarChart2, Settings, LogOut, Bot } from 'lucide-react'

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

  function logout() {
    localStorage.removeItem('token')
    router.push('/login')
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
