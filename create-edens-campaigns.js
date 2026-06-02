const BASE = 'http://localhost:5000'

async function main() {
  // 1. Login
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'paulo@dmpilot.com', password: 'Test123456' })
  })
  const { token } = await login.json()
  console.log('✓ Logado')

  const h = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

  // ── CAMPANHA 1: Vendas via DM ──────────────────────────────
  const c1 = await fetch(`${BASE}/campaigns`, {
    method: 'POST', headers: h,
    body: JSON.stringify({
      name:         "Vendas — Éden's Club",
      active:       true,
      isDefault:    true,
      triggerKeyword: null,
      personaName:  'Pri',
      personaTone:  'próxima e genuína, como a Priscilla fala nas redes — sem exagero, sem script',
      systemPrompt: '',
      productName:  "Éden's Club",
      productDescription: 'Programa de 12 semanas de reconstrução de identidade em grupo. 5 fases com início, meio e fim. 10 encontros ao vivo, comunidade privada, materiais práticos por fase.',
      productBenefits: `Você vai:
- Enxergar seus ciclos emocionais como padrão sistêmico (não como falha)
- Interromper o comportamento automático no momento que acontece
- Construir uma base de identidade que não depende de validação externa
Resultado em 12 semanas: clareza, estabilidade e autonomia.`,
      productPrice:  997.00,
      paymentUrl:    'COLE-AQUI-SEU-LINK-KIWIFY',
      objectionHandlers: `"Já tentei tudo e não funcionou": Entendo. Mas tudo que você tentou até agora atacou o comportamento, não a identidade que o gera. É como tomar antitérmico pra tratar uma infecção — alivia, mas volta. Aqui a gente trata a causa.

"Tá caro": Parcelamos em 12x de R$97. Mas me diz: quanto você já investiu tentando mudar e não conseguiu? Terapia, cursos, livros. O problema não foi o investimento — foi que a ferramenta não era a certa.

"Não tenho tempo": São 2 encontros ao vivo por semana, ~90min cada. O resto é prática nas situações que já aconteceriam de qualquer forma. Se você tem tempo pro ciclo que quer sair, tem tempo pra isso.

"Prefiro atendimento individual": Individual com especialista em identidade custa no mínimo R$5.000 — e sem a comunidade, que é parte do que sustenta a mudança. Aqui você tem os dois pelo preço de um mês de terapia.

"Não sei se é pra mim": É pra quem já tem consciência dos próprios padrões mas não consegue mudar. Se você se reconheceu nisso — é pra você.`,
      closingMessage: null,
    })
  })
  const r1 = await c1.json()
  console.log('✓ Campanha 1 criada:', r1.id, '—', r1.name)

  // ── CAMPANHA 2: Suporte entre sessões ─────────────────────
  const c2 = await fetch(`${BASE}/campaigns`, {
    method: 'POST', headers: h,
    body: JSON.stringify({
      name:          "Suporte — Alunas Éden's Club",
      active:        true,
      isDefault:     false,
      triggerKeyword:'suporte',
      personaName:   'Pri',
      personaTone:   'acolhedora e firme — não resolve pela aluna, ajuda ela a achar a própria resposta',
      systemPrompt:  '',
      productName:   "Éden's Club — Suporte",
      productDescription: `Você é a assistente de suporte do Éden's Club, programa da Priscilla Andrade.
Você conhece profundamente as 5 fases:
Fase 1 (sem 1-2): Despertar e Diagnóstico — mapear padrões emocionais
Fase 2 (sem 3-5): Desconstrução — questionar crenças e identidade construída
Fase 3 (sem 6-8): Interrupção — parar de reagir no automático
Fase 4 (sem 9-10): Sustentação — aguentar o desconforto de mudar
Fase 5 (sem 11-12): Reconstrução — começar a ser quem realmente é

Sua função é ajudar alunas que estão com dúvidas ou travadas durante o programa.`,
      productBenefits: '',
      productPrice:   null,
      paymentUrl:     null,
      objectionHandlers: `"Não estou conseguindo fazer o exercício": Isso é normal — a resistência faz parte. Me conta o que tá acontecendo quando você tenta. A gente entende o bloco juntas.

"Acho que voltei para o zero": Recaída não é voltar ao zero. É o ponto mais crítico do processo. A Priscilla fala sobre isso na aula de recaídas — já assistiu?

"Não sinto que estou evoluindo": A mudança de identidade não é linear. Às vezes o maior avanço parece invisível por dentro. Me conta o que aconteceu na última semana.

"Quero desistir": Antes de qualquer decisão, me conta o que tá pesando. Às vezes o que parece motivo pra sair é exatamente o que o processo está trabalhando.`,
      closingMessage: null,
    })
  })
  const r2 = await c2.json()
  console.log('✓ Campanha 2 criada:', r2.id, '—', r2.name)

  console.log('\n✅ Pronto! Agentes criados no DM Pilot.')
  console.log('\nPróximos passos:')
  console.log('1. Substitua "COLE-AQUI-SEU-LINK-KIWIFY" pelo link real de pagamento')
  console.log('2. Conecte o Instagram @filhasdeeva em Configurações')
  console.log('3. Configure o webhook do Instagram/WhatsApp')
}

main().catch(console.error)
