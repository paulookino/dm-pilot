'use client'
import Link from 'next/link'
import { Zap, MessageCircle, Camera, Bot, TrendingUp, CheckCircle2, ArrowRight, Star, Users } from 'lucide-react'

const FEATURES = [
  { icon: Bot,          title: 'IA que conversa de verdade',    desc: 'Não é fluxo fixo. A IA entende qualquer pergunta e responde como você responderia — sem script, sem "não entendi".' },
  { icon: TrendingUp,   title: 'Score de qualificação em tempo real', desc: 'Cada lead recebe uma pontuação 0–100. Quando chega a 70+, o link de pagamento é enviado automaticamente.' },
  { icon: Camera,       title: 'Instagram + WhatsApp unificados', desc: 'Um painel. Todas as conversas. Você assume qualquer conversa com um clique — sem perder o contexto.' },
  { icon: MessageCircle,title: 'Persona personalizada',          desc: 'Crie sua assistente virtual com seu nome, seu tom, seu produto. O lead não sabe que é IA.' },
  { icon: Zap,          title: 'Resposta em menos de 3 segundos', desc: 'Groq Llama 3.1 — o modelo mais rápido do mercado. Nenhum lead fica esperando.' },
  { icon: Users,        title: 'Multi-produto',                  desc: 'Crie campanhas diferentes para cada produto. Cada DM vai para a campanha certa automaticamente.' },
]

const TESTIMONIALS = [
  { name: 'Ana Carvalho',    role: 'Mentora de identidade',  text: '"Fechei R$11.970 em 6 dias só de DMs. A IA qualificou e mandou o link sozinha."' },
  { name: 'Lucas Ferreira',  role: 'Infoprodutor',           text: '"Antes eu respondia DM das 7h da manhã. Agora a Pri responde enquanto eu durmo."' },
  { name: 'Camila Ramos',    role: 'Coach e criadora',       text: '"Minha conversão de DM foi de 4% para 17% em 3 semanas. Não tem comparação."' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a14', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">DM Pilot</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>Entrar</Link>
          <Link href="/pricing" className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff' }}>
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
          <Star className="w-3.5 h-3.5" /> Acesso imediato · Cancele quando quiser
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          Seus DMs do Instagram<br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            vendendo enquanto você dorme
          </span>
        </h1>

        <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.55)' }}>
          IA que responde como você, qualifica leads automaticamente e envia o link de pagamento na hora certa. Sem scripts. Sem fluxos quebrados.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/pricing"
            className="flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
            Começar agora <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
            Já tenho conta
          </Link>
        </div>

        <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.25)' }}>Sem cartão de crédito · Cancele quando quiser</p>
      </section>

      {/* Social proof */}
      <section className="max-w-4xl mx-auto px-8 pb-16">
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: 'R$ 2.847',   label: 'Receita média por usuário/mês' },
            { value: '< 3s',       label: 'Tempo de resposta médio' },
            { value: '4× mais',    label: 'Conversão vs. resposta manual' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-3xl font-bold mb-1" style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</p>
              <p className="text-xs" style={{ color: '#64748b' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Tudo que você precisa para vender via DM</h2>
          <p style={{ color: '#64748b' }}>Sem configuração complexa. Funcionando em menos de 10 minutos.</p>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl transition-all hover:scale-[1.01] group"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(124,58,237,0.15)' }}>
                <Icon className="w-5 h-5" style={{ color: '#a78bfa' }} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Como funciona</h2>
        </div>
        <div className="relative">
          {[
            { n: '01', title: 'Configure sua persona em 5 min', desc: 'Nome, tom de voz, produto, preço, objeções. A IA aprende quem você é.' },
            { n: '02', title: 'Conecte seu Instagram ou WhatsApp', desc: 'Um token de acesso. O DM Pilot começa a monitorar as mensagens.' },
            { n: '03', title: 'A IA responde automaticamente', desc: 'Cada DM recebe uma resposta personalizada. Score de qualificação atualizado em tempo real.' },
            { n: '04', title: 'Lead quente → link enviado', desc: 'Quando o score chega a 70+, a IA injeta seu link de pagamento. Você fecha.' },
          ].map(({ n, title, desc }, i) => (
            <div key={n} className="flex gap-5 mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>{n}</div>
              <div>
                <p className="font-semibold text-white mb-1">{title}</p>
                <p className="text-sm" style={{ color: '#64748b' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Depoimentos */}
      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, role, text }) => (
            <div key={name} className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-sm mb-5 leading-relaxed" style={{ color: '#94a3b8' }}>{text}</p>
              <div>
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="text-xs" style={{ color: '#64748b' }}>{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-2xl mx-auto px-8 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Pronto para automatizar suas vendas?</h2>
        <p className="mb-8 text-lg" style={{ color: '#64748b' }}>Acesso imediato. Cancele quando quiser.</p>
        <Link href="/pricing"
          className="inline-flex items-center gap-2.5 px-10 py-5 rounded-2xl text-white font-bold text-xl transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 60px rgba(124,58,237,0.35)' }}>
          Começar agora <ArrowRight className="w-6 h-6" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-8 py-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>DM Pilot</span>
          </div>
          <div className="flex gap-6">
            {[['Preços', '/pricing'], ['Login', '/login'], ['Cadastro', '/signup']].map(([l, h]) => (
              <Link key={l} href={h} className="text-xs transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.3)' }}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
