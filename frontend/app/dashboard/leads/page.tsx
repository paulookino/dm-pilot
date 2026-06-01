'use client'
import { useEffect, useState } from 'react'
import { leadsApi, type Lead } from '@/lib/api'
import { Flame, Instagram, MessageCircle, Search } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  New: '#6366f1', Contacted: '#8b5cf6', Qualified: '#a78bfa',
  Negotiating: '#f59e0b', Won: '#10b981', Lost: '#ef4444',
}

export default function LeadsPage() {
  const [leads,  setLeads]  = useState<Lead[]>([])
  const [total,  setTotal]  = useState(0)
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    leadsApi.list({ page, search: search || undefined, status: status || undefined })
      .then(r => { setLeads(r.data.items); setTotal(r.data.total) })
  }, [page, search, status])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Leads <span className="text-sm font-normal" style={{ color: '#64748b' }}>({total})</span></h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 max-w-xs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="bg-transparent text-sm outline-none text-white flex-1" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none text-white"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <option value="">Todos os status</option>
          {['New','Contacted','Qualified','Negotiating','Won','Lost'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Lead', 'Canal', 'Score', 'Status', 'Último contato'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs"
                      style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                      {(lead.name || lead.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">{lead.name ?? 'Sem nome'}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>@{lead.username ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {lead.channel === 'Instagram'
                    ? <Instagram className="w-4 h-4" style={{ color: '#e1306c' }} />
                    : <MessageCircle className="w-4 h-4" style={{ color: '#25d366' }} />}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    {lead.qualificationScore >= 70 && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                    <span className="font-mono font-semibold text-white">{lead.qualificationScore}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: `${STATUS_COLORS[lead.status] ?? '#64748b'}18`, color: STATUS_COLORS[lead.status] ?? '#64748b' }}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: '#64748b' }}>
                  {new Date(lead.lastActivityAt).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginação */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs" style={{ color: '#64748b' }}>{total} leads</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 rounded-lg text-xs disabled:opacity-30 hover:bg-white/5" style={{ color: '#94a3b8' }}>← Anterior</button>
            <button onClick={() => setPage(p => p + 1)} disabled={leads.length < 20}
              className="px-3 py-1 rounded-lg text-xs disabled:opacity-30 hover:bg-white/5" style={{ color: '#94a3b8' }}>Próximo →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
