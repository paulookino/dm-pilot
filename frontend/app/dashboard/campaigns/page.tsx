'use client'
import { useEffect, useState } from 'react'
import { campaignsApi, type Campaign } from '@/lib/api'
import { Plus, Pencil, Trash2, Bot } from 'lucide-react'

export default function CampaignsPage() {
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [editing,   setEditing]     = useState<Partial<Campaign> | null>(null)
  const [saving,    setSaving]      = useState(false)

  useEffect(() => { campaignsApi.list().then(r => setCampaigns(r.data)) }, [])

  async function save() {
    if (!editing) return
    setSaving(true)
    try {
      // Garantir que todos os campos obrigatórios estão presentes
      const payload = {
        name:               editing.name              ?? '',
        active:             editing.active            ?? true,
        isDefault:          editing.isDefault         ?? false,
        triggerKeyword:     editing.triggerKeyword    ?? null,
        personaName:        (editing as any).personaName    ?? 'Assistente',
        personaTone:        (editing as any).personaTone    ?? 'amigável e profissional',
        systemPrompt:       (editing as any).systemPrompt   ?? '',
        productName:        (editing as any).productName    ?? '',
        productDescription: (editing as any).productDescription ?? '',
        productBenefits:    (editing as any).productBenefits    ?? '',
        productPrice:       (editing as any).productPrice       ?? null,
        paymentUrl:         (editing as any).paymentUrl         ?? null,
        objectionHandlers:  (editing as any).objectionHandlers  ?? '',
        closingMessage:     (editing as any).closingMessage     ?? null,
      }
      if (editing.id) await campaignsApi.update(editing.id, payload)
      else            await campaignsApi.create(payload)
      const r = await campaignsApi.list()
      setCampaigns(r.data)
      setEditing(null)
    } finally { setSaving(false) }
  }

  async function del(id: string) {
    if (!confirm('Excluir campanha?')) return
    await campaignsApi.delete(id)
    setCampaigns(prev => prev.filter(c => c.id !== id))
  }

  const F = ({ label, value, onChange, type = 'text', rows }: any) => (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: '#94a3b8' }}>{label}</label>
      {rows
        ? <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={rows}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none text-white resize-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
        : <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm outline-none text-white"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }} />
      }
    </div>
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Campanhas</h1>
        <button onClick={() => setEditing({ active: true, isDefault: false })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
          <Plus className="w-4 h-4" /> Nova campanha
        </button>
      </div>

      {/* Editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 overflow-auto max-h-[90vh] space-y-4"
            style={{ background: '#0f0f1e', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 className="text-lg font-bold text-white">{editing.id ? 'Editar' : 'Nova'} Campanha</h2>

            <div className="grid grid-cols-2 gap-4">
              <F label="Nome da campanha"                  value={(editing as any).name}            onChange={(v: string) => setEditing(p => ({ ...p, name: v }))} />
              <F label="Palavra-chave gatilho (opcional)"  value={(editing as any).triggerKeyword}  onChange={(v: string) => setEditing(p => ({ ...p, triggerKeyword: v }))} />
              <F label="Nome da persona (IA)"              value={(editing as any).personaName}     onChange={(v: string) => setEditing(p => ({ ...p, personaName: v }))} />
              <F label="Tom de voz da persona"             value={(editing as any).personaTone}     onChange={(v: string) => setEditing(p => ({ ...p, personaTone: v }))} />
              <F label="Nome do produto"                   value={(editing as any).productName}     onChange={(v: string) => setEditing(p => ({ ...p, productName: v }))} />
              <F label="Preço (R$)"                        value={(editing as any).productPrice}    onChange={(v: string) => setEditing(p => ({ ...p, productPrice: parseFloat(v) }))} type="number" />
              <div className="col-span-2">
                <F label="Link de pagamento"               value={(editing as any).paymentUrl}      onChange={(v: string) => setEditing(p => ({ ...p, paymentUrl: v }))} />
              </div>
            </div>

            <F label="Descrição do produto" value={(editing as any).productDescription}
              onChange={(v: string) => setEditing(p => ({ ...p, productDescription: v }))} rows={2} />
            <F label="Benefícios do produto (um por linha)"
              value={(editing as any).productBenefits}
              onChange={(v: string) => setEditing(p => ({ ...p, productBenefits: v }))} rows={3} />
            <F label="Respostas para objeções (ex: 'tá caro → ...')"
              value={(editing as any).objectionHandlers}
              onChange={(v: string) => setEditing(p => ({ ...p, objectionHandlers: v }))} rows={3} />

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input type="checkbox" checked={editing.isDefault ?? false}
                  onChange={e => setEditing(p => ({ ...p, isDefault: e.target.checked }))} />
                Campanha padrão
              </label>
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                <input type="checkbox" checked={editing.active ?? true}
                  onChange={e => setEditing(p => ({ ...p, active: e.target.checked }))} />
                Ativa
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="grid gap-4">
        {campaigns.map(c => (
          <div key={c.id} className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)' }}>
                  <Bot className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{c.name}</p>
                    {c.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">Padrão</span>}
                    {!c.active  && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-400">Inativa</span>}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                    {c.productName}{c.productPrice ? ` · R$${c.productPrice.toLocaleString('pt-BR')}` : ''}
                    {c.triggerKeyword ? ` · keyword: "${c.triggerKeyword}"` : ''}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(c)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: '#64748b' }}>
                  <Pencil className="w-4 h-4" />
                </button>
                {!c.isDefault && (
                  <button onClick={() => del(c.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: '#94a3b8' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: 'Leads', value: c.totalLeads },
                { label: 'Vendas', value: c.totalSales },
                { label: 'Receita', value: `R$${(c.totalRevenue ?? 0).toLocaleString('pt-BR')}` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-lg font-bold text-white">{value}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
