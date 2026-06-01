'use client'
import { useEffect, useState } from 'react'
import { conversationsApi, type Conversation, type Message } from '@/lib/api'
import { Bot, User, ToggleLeft, ToggleRight, Send } from 'lucide-react'

export default function ConversationsPage() {
  const [convs,    setConvs]    = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text,     setText]     = useState('')
  const [sending,  setSending]  = useState(false)

  useEffect(() => {
    conversationsApi.list().then(r => setConvs(r.data.items))
  }, [])

  async function selectConv(c: Conversation) {
    setSelected(c)
    const msgs = await conversationsApi.messages(c.id)
    setMessages(msgs.data)
  }

  async function toggleAi() {
    if (!selected) return
    await conversationsApi.toggleAi(selected.id, !selected.aiEnabled)
    setSelected(prev => prev ? { ...prev, aiEnabled: !prev.aiEnabled } : prev)
  }

  async function sendMsg() {
    if (!selected || !text.trim()) return
    setSending(true)
    const res = await conversationsApi.sendMessage(selected.id, text)
    setMessages(prev => [...prev, res.data])
    setText('')
    setSending(false)
  }

  return (
    <div className="flex h-full">
      {/* Lista */}
      <div className="w-72 flex flex-col" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-4 py-4 font-bold text-white text-sm" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          Conversas ({convs.length})
        </div>
        <div className="flex-1 overflow-auto">
          {convs.map(c => (
            <button key={c.id} onClick={() => selectConv(c)}
              className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5"
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: selected?.id === c.id ? 'rgba(124,58,237,0.1)' : 'transparent',
              }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-white truncate">{c.lead.name ?? c.lead.username ?? 'Lead'}</p>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.aiEnabled ? 'bg-purple-400' : 'bg-gray-600'}`} />
              </div>
              <p className="text-xs" style={{ color: '#64748b' }}>
                {c.totalMessages} msgs · {new Date(c.lastMessageAt).toLocaleDateString('pt-BR')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      {selected ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="font-semibold text-white">{selected.lead.name ?? selected.lead.username ?? 'Lead'}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>Score: {selected.lead.qualificationScore}/100</p>
            </div>
            <button onClick={toggleAi} className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: selected.aiEnabled ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)', color: selected.aiEnabled ? '#a78bfa' : '#64748b' }}>
              {selected.aiEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              IA {selected.aiEnabled ? 'ligada' : 'desligada'}
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-auto p-5 space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.direction === 'Outbound' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[70%]">
                  <div className="flex items-center gap-1.5 mb-1">
                    {m.direction === 'Outbound' && m.sentByAi && <Bot className="w-3 h-3 text-purple-400" />}
                    {m.direction === 'Outbound' && !m.sentByAi && <User className="w-3 h-3 text-blue-400" />}
                    <span className="text-[10px]" style={{ color: '#64748b' }}>
                      {new Date(m.sentAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-2xl text-sm text-white"
                    style={{
                      background: m.direction === 'Outbound'
                        ? m.sentByAi ? 'rgba(124,58,237,0.25)' : 'rgba(59,130,246,0.25)'
                        : 'rgba(255,255,255,0.08)',
                    }}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex gap-3">
              <input value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMsg()}
                placeholder="Digite uma mensagem..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none text-white"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <button onClick={sendMsg} disabled={sending || !text.trim()}
                className="px-4 py-2.5 rounded-xl text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center" style={{ color: '#475569' }}>
          Selecione uma conversa
        </div>
      )}
    </div>
  )
}
