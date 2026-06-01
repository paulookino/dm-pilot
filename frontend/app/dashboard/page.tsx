'use client'
import { useEffect, useState } from 'react'
import { leadsApi } from '@/lib/api'
import { Users, TrendingUp, Flame, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => { leadsApi.stats().then(r => setStats(r.data)) }, [])

  const funnel = stats?.funnel ?? []
  const getCount = (s: string) => funnel.find((f: any) => f.status === s)?.count ?? 0

  const cards = [
    { label: 'Total de Leads',     value: funnel.reduce((s: number, f: any) => s + f.count, 0), icon: Users,       color: '#6366f1' },
    { label: 'Leads Quentes (70+)',value: stats?.hotLeads ?? 0,                                 icon: Flame,       color: '#ef4444' },
    { label: 'Negociando',         value: getCount('Negotiating'),                               icon: TrendingUp,  color: '#f59e0b' },
    { label: 'Vendas Fechadas',    value: getCount('Won'),                                       icon: CheckCircle, color: '#10b981' },
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Funil */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <h2 className="text-sm font-bold text-white mb-5">Funil de Vendas</h2>
        <div className="space-y-3">
          {[
            { label: 'Novo',         status: 'New',         color: '#6366f1' },
            { label: 'Contatado',    status: 'Contacted',   color: '#8b5cf6' },
            { label: 'Qualificado',  status: 'Qualified',   color: '#a78bfa' },
            { label: 'Negociando',   status: 'Negotiating', color: '#f59e0b' },
            { label: 'Ganho',        status: 'Won',         color: '#10b981' },
          ].map(({ label, status, color }) => {
            const count = getCount(status)
            const total = funnel.reduce((s: number, f: any) => s + f.count, 0) || 1
            const pct   = Math.round((count / total) * 100)
            return (
              <div key={status}>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                  <span className="font-semibold text-white">{count}</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
