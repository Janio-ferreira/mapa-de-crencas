'use strict';
/**
 * PERFIL RELIGIOSO — orquestra questionário → distribuições → eixos → arquétipo → comparação com o catálogo.
 *
 * Pontuação de uma tradição (explicável, sem aleatoriedade):
 *   doutrinal  = compat.calcular (similaridade parcial por dimensão × importância × confiança do dado; ausentes ampliam o intervalo)
 *   eixos      = 1 − Σ w_a·|Δ_a|/100 / Σ w_a, só nos eixos em que ambos têm posição (w_a = importância do tema × confiança da tradição)
 *   final      = 0,6·doutrinal + 0,4·eixos − penalidade por divergências fundamentais (|Δ|≥70 em eixo importante, máx. 10 pontos)
 *   (com menos de 5 eixos comparáveis, final = doutrinal)
 * O resultado mede proximidade de ideias com os modelos do banco; não indica pertencimento, aceitação institucional nem verdade.
 */
const { db } = require('./db');
const compat = require('./compat');
const eixos = require('./eixos');
const Q = require('./questionario');

const FRASES = {
  divindade: ['não vê base para crer em deuses', 'crê em alguma realidade divina'],
  unicidade: ['concebe o divino como uno', 'concebe o divino como plural'],
  revelacao: ['confia numa verdade revelada pelo divino', 'confia mais na experiência, na razão e no despertar do que em revelações'],
  autoridade: ['reconhece a autoridade de textos e tradição', 'interpreta o sagrado por conta própria'],
  espiritualidade: ['vê a realidade como essencialmente material', 'reconhece uma dimensão espiritual real'],
  vida_apos_morte: ['entende a morte como fim', 'admite alguma continuidade após a morte'],
  destino: ['busca uma meta de salvação ou libertação', 'não vê um destino espiritual comum a todos'],
  natureza_humana: ['enxerga o ser humano como fundamentalmente imperfeito', 'confia no potencial de aperfeiçoamento humano'],
  pratica: ['vive a espiritualidade em ritos e observâncias', 'vive a espiritualidade em contemplação pessoal'],
  etica: ['funda a moral na revelação ou numa ordem sagrada', 'funda a moral na razão e na experiência humana'],
  pluralismo: ['tende ao exclusivismo', 'reconhece várias religiões como caminhos válidos'],
  organizacao: ['valoriza instituição e comunidade', 'valoriza a autonomia espiritual individual'],
};

const ARQUETIPOS = [
  { id: 'fiel-da-tradicao', nome: 'Fiel da Tradição', desc: 'Crê num Deus que se revelou e vive essa fé por meio de escrituras, tradição, ritos e comunidade.', v: [95, 10, 10, 10, 95, 95, 10, 35, 25, 15, 25, 15] },
  { id: 'devoto-comunitario-aberto', nome: 'Devoto Comunitário Aberto', desc: 'Tem fé firme e vida comunitária, mas reconhece verdade e valor em outros caminhos.', v: [95, 10, 20, 30, 95, 95, 10, 50, 25, 35, 65, 25] },
  { id: 'reverente-dos-muitos-poderes', nome: 'Reverente dos Muitos Poderes', desc: 'Percebe o sagrado em muitos deuses, espíritos e ancestrais, honrados com ritos e laços comunitários.', v: [90, 85, 30, 30, 95, 90, 40, 60, 20, 35, 70, 35] },
  { id: 'mistico-pluralista', nome: 'Místico Pluralista', desc: 'Busca a experiência direta do sagrado e vê as religiões como caminhos para a mesma meta.', v: [80, 30, 65, 75, 100, 95, 15, 85, 85, 50, 95, 70] },
  { id: 'esoterico-sincretico', nome: 'Esotérico Sincrético', desc: 'Combina elementos de várias tradições numa visão pessoal de uma sabedoria espiritual comum.', v: [70, 40, 70, 80, 100, 100, 10, 90, 70, 40, 95, 70] },
  { id: 'crente-independente', nome: 'Crente Independente', desc: 'Crê em Deus ou no divino, mas segue a própria consciência, fora de instituições.', v: [85, 5, 60, 85, 90, 85, 20, 65, 60, 65, 80, 85] },
  { id: 'humanista-religioso', nome: 'Humanista Religioso', desc: 'Mantém uma fé aberta e dá grande peso à ética, à razão e à comunidade.', v: [80, 5, 45, 55, 90, 80, 30, 70, 40, 70, 85, 50] },
  { id: 'teista-racional', nome: 'Teísta Racional', desc: 'Admite um criador conhecido pela razão e pela reflexão, sem depender de revelação nem de igrejas.', v: [70, 5, 90, 85, 70, 55, 40, 60, 60, 90, 85, 85] },
  { id: 'buscador-contemplativo', nome: 'Buscador Contemplativo', desc: 'Valoriza o silêncio, a meditação e a experiência pessoal, com abertura para o mistério.', v: [60, null, 70, 70, 95, 85, 30, 80, 90, 60, 85, 75] },
  { id: 'caminhante-da-libertacao', nome: 'Caminhante da Libertação', desc: 'Busca despertar ou libertar-se pela prática e pelo conhecimento, sem depender de um Deus criador.', v: [15, null, 75, 55, 75, 85, 10, 85, 85, 70, 65, 50] },
  { id: 'naturalista-espiritual', nome: 'Naturalista Espiritual', desc: 'Vê o sagrado na natureza e no universo, sem um Deus pessoal, com ênfase no sentido e na prática pessoal.', v: [55, null, 75, 70, 85, 45, 70, 85, 75, 70, 85, 80] },
  { id: 'cetico-aberto', nome: 'Cético Aberto', desc: 'Suspende o juízo sobre o divino e valoriza a investigação, a razão e o respeito às diferentes crenças.', v: [30, null, 90, 90, 40, 25, 80, 65, 65, 85, 85, 90] },
  { id: 'humanista-secular', nome: 'Humanista Secular', desc: 'Entende o mundo sem pressupostos sobrenaturais e funda o sentido e a moral na razão e na dignidade humana.', v: [5, null, 95, 95, 10, 10, 95, 70, 70, 95, 85, 90] },
];
const ORDEM = eixos.AXES.map(a => a.id);

function pctDist(ua, va, pesos) {
  let s = 0, w = 0;
  ORDEM.forEach((id, i) => { const u = ua[id]; if (!u || u.status !== 'ok' || va[i] == null) return; const p = pesos[id] ?? 1; s += p * Math.abs(u.valor - va[i]); w += p; });
  return w ? { pct: 100 - s / w, n: ORDEM.filter((id, i) => ua[id]?.status === 'ok' && va[i] != null).length } : null;
}

function mediana(xs) { const a = [...xs].sort((x, y) => x - y); const m = a.length >> 1; return a.length ? (a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2) : null; }

function pesosDosEixos(importancias) {
  const out = {};
  for (const ax of eixos.AXES) {
    const dims = ax.fontes.map(f => f.dim); const ws = dims.map(d => importancias[Q.TEMA_DE_DIM[d]] ?? 2);
    out[ax.id] = ws.reduce((a, b) => a + b, 0) / ws.length;
  }
  return out;
}

function resultado({ respostas, importancias = {}, incluirTodas = false } = {}) {
  const av = Q.avaliar(respostas);
  if (av.respondidas < 8) { const e = new Error('Responda pelo menos 8 perguntas para gerar um perfil.'); e.status = 400; throw e; }
  if (av.informativas < 5) { const e = new Error('Suas respostas foram neutras ou puladas demais: responda mais perguntas com uma posição para gerar o perfil.'); e.status = 400; throw e; }
  const imp = {}; Q.TEMAS.forEach(t => { imp[t.id] = Math.min(3, Math.max(1, Math.round(Number(importancias?.[t.id]) || 2))); });
  const resp = {};
  for (const [dim, r] of Object.entries(av.respostasCompat)) resp[dim] = { opcoes: r.opcoes, importancia: imp[Q.TEMA_DE_DIM[dim]] ?? 2 };

  // --- eixos do usuário
  const ua = eixos.eixosDoUsuario(resp);
  for (const na of av.naExplicito) if (ua[na]?.status !== 'ok') ua[na] = { status: 'nao_se_aplica', cobertura: 1, explicito: true };
  const pesos = pesosDosEixos(imp);
  const PUB = Q.perguntasPublicas();
  const eixosUsuario = eixos.AXES.map(ax => {
    const u = ua[ax.id]; const dims = ax.fontes.map(f => f.dim);
    const base = PUB.filter(q => respostas[q.id] > 0 && q.dimensoes.some(d => dims.includes(d))).length;
    const o = { id: ax.id, n: ax.n, nome: ax.nome, esq: ax.esq, dir: ax.dir, descEsq: ax.descEsq, descDir: ax.descDir, status: u.status, importancia: +pesos[ax.id].toFixed(1), perguntas_base: base, temas: [...new Set(dims.map(d => Q.TEMAS.find(t => t.id === Q.TEMA_DE_DIM[d])?.nome).filter(Boolean))] };
    if (u.status === 'ok') {
      const it = eixos.intensidade(u.valor);
      Object.assign(o, { valor: u.valor, intensidade: it.nivel, lado: it.lado, posicao: eixos.rotuloPosicao(ax, u.valor), faixa: u.faixa, dispersao: u.dispersao,
        explicacao: `Calculado a partir de ${base} resposta(s) sobre ${o.temas.join(' e ').toLowerCase()}. ${it.lado === 'meio' || it.nivel === 'intermediária' ? 'Suas respostas ficaram entre os dois polos.' : `Suas respostas pendem para "${it.lado === 'esq' ? ax.esq : ax.dir}".`}${u.dispersao > 25 ? ' Suas respostas nesse tema apontam em direções diferentes.' : ''}` });
    } else if (u.status === 'nao_se_aplica') o.explicacao = u.explicito ? 'Você indicou que essa pergunta não se aplica ao seu modo de ver.' : (ax.id === 'unicidade' ? 'Este eixo só se aplica a quem admite uma realidade divina; suas respostas não a admitem.' : 'Suas respostas não tornam este eixo aplicável.');
    else o.explicacao = 'Você não respondeu perguntas suficientes sobre este tema; ele não entrou no cálculo.';
    return o;
  });
  const ok = eixosUsuario.filter(e => e.status === 'ok');

  // --- arquétipo (perfil descritivo, NÃO uma religião)
  const cand = ARQUETIPOS.map(a => { const r = pctDist(ua, a.v, pesos); return r && r.n >= 5 ? { id: a.id, nome: a.nome, desc: a.desc, pct: r.pct + ((av.tracosFlags.agnosticismo && a.id === 'cetico-aberto' && ua.divindade?.valor < 50) ? 4 : 0) } : null; }).filter(Boolean).sort((a, b) => b.pct - a.pct);
  let nome = null, misto = false, descPerfil = null;
  if (cand.length) {
    const [a, b] = cand; misto = a.pct < 62 || (b && a.pct - b.pct < 3);
    nome = misto && b ? `Perfil misto: ${a.nome} e ${b.nome}` : a.nome;
    descPerfil = misto && b ? `${a.desc} Ao mesmo tempo, aproxima-se de outro perfil: ${b.nome} — ${b.desc.charAt(0).toLowerCase() + b.desc.slice(1)}` : a.desc;
  }
  const fortes = [...ok].sort((x, y) => Math.abs(y.valor - 50) - Math.abs(x.valor - 50)).filter(e => e.intensidade !== 'intermediária').slice(0, 4);
  const frase = e => FRASES[e.id][e.lado === 'esq' ? 0 : 1];
  const sintese = fortes.length ? `Você ${fortes.map(frase).join('; ')}.` : 'Suas respostas ficaram em posições intermediárias na maioria dos eixos.';
  const classificacao = cand.length ? { nome, misto, descricao: descPerfil, sintese, similaridade: Math.round(cand[0].pct), candidatos: cand.slice(0, 4).map(c => ({ id: c.id, nome: c.nome, pct: Math.round(c.pct) })), aviso: 'Este nome descreve seu conjunto de posições; não é uma religião nem um rótulo de pertencimento.' } : { nome: 'Perfil ainda indefinido', misto: true, descricao: 'Há poucos eixos com resposta para nomear um perfil.', sintese, similaridade: null, candidatos: [] };

  // --- tradições
  const C = compat.carregar();
  const cx = compat.calcular(resp, { limite: 1000 });
  const eixosTrad = eixos.eixosDeTodas();
  const meta = Object.fromEntries(db.prepare('SELECT t.slug, t.resumo, t.parent_id, p.nome pai, p.slug pai_slug FROM tradicoes t LEFT JOIN tradicoes p ON p.id=t.parent_id').all().map(r => [r.slug, r]));
  const uOk = Object.fromEntries(ok.map(e => [e.id, e]));
  const lista = cx.resultados.map(r => {
    const et = eixosTrad[r.slug] || {};
    let s = 0, w = 0, nCom = 0, pen = 0; const porEixo = [];
    for (const ax of eixos.AXES) {
      const u = uOk[ax.id], t = et[ax.id];
      if (!u) continue;
      if (!t || t.status !== 'ok') { porEixo.push({ id: ax.id, nome: ax.nome, status: t?.status || 'nao_documentado', voce: u.valor }); continue; }
      const d = Math.abs(u.valor - t.valor); const p = u.importancia * (t.confianca ?? 0.6);
      s += p * d; w += p; nCom++;
      if (d >= 70 && u.importancia >= 2) pen += 0.025 * (u.importancia / 3);
      porEixo.push({ id: ax.id, nome: ax.nome, status: 'ok', voce: u.valor, tradicao: t.valor, delta: +d.toFixed(0), interna: t.dispersao >= 25 });
    }
    const axPct = w ? (1 - s / w / 100) * 100 : null;
    const doutr = r.compatibilidade;
    let final = axPct != null && nCom >= 5 ? 0.6 * doutr + 0.4 * axPct - Math.min(10, pen * 100) : doutr;
    final = Math.max(0, Math.min(100, final));
    return {
      slug: r.slug, nome: r.nome, categoria: r.categoria, situacao: r.situacao, pai: meta[r.slug]?.pai || null, pai_slug: meta[r.slug]?.pai_slug || null, resumo: meta[r.slug]?.resumo || null,
      compatibilidade: Math.round(final), doutrinal: Math.round(doutr), eixos_pct: axPct == null ? null : Math.round(axPct), eixos_comparados: nCom,
      intervalo: r.intervalo, cobertura: r.cobertura, grau_confianca: r.grau_confianca,
      concordancias: r.concordancias.slice(0, 3).map(d => d.nome), divergencias: r.divergencias.slice(0, 3).map(d => d.nome),
      nao_documentadas: r.nao_documentadas, por_eixo: porEixo,
      divergencias_fundamentais: porEixo.filter(e => e.delta >= 70).map(e => e.nome),
      diversidade_interna: porEixo.filter(e => e.interna).map(e => e.nome),
      explicacao: `Proximidade ${Math.round(final)}%: concordância doutrinal ${Math.round(doutr)}%${axPct != null ? ` e distância média nos ${nCom} eixos comparáveis de ${Math.round(axPct)}% de proximidade` : ''}${pen ? `; reduzida por divergências fundamentais em eixos importantes para você` : ''}. Dados documentados em ${Math.round(r.cobertura * 100)}% dos temas que você respondeu (confiança ${r.grau_confianca}).`,
    };
  }).sort((a, b) => b.compatibilidade - a.compatibilidade || b.cobertura - a.cobertura);
  lista.forEach((r, i) => { r.posicao = i + 1; });

  const vivas = lista.filter(r => r.situacao === 'praticada' || r.situacao === 'reconstruida');
  const GRANDES = new Set(['religiao', 'familia_religiosa', 'tradicao_espiritual', 'sistema_filosofico_religioso', 'culto_historico']);
  const religioes = vivas.filter(r => GRANDES.has(r.categoria)).slice(0, 6);
  const ramos = vivas.filter(r => ['denominacao', 'vertente', 'escola'].includes(r.categoria)).slice(0, 8);
  const movimentos = vivas.filter(r => r.categoria === 'movimento').slice(0, 5);

  const porEixoProx = {};
  for (const e of ok) {
    const cands = vivas.map(r => { const x = r.por_eixo.find(p => p.id === e.id); return x?.status === 'ok' ? { slug: r.slug, nome: r.nome, delta: x.delta, valor: x.tradicao, g: r.compatibilidade } : null; }).filter(Boolean).sort((a, b) => a.delta - b.delta || b.g - a.g);
    porEixoProx[e.id] = cands.slice(0, 3);
  }
  const distantes = [...vivas].filter(r => r.grau_confianca !== 'baixo' || r.cobertura >= 0.5).slice(-5).reverse().map(r => ({ slug: r.slug, nome: r.nome, compatibilidade: r.compatibilidade, divergencias_fundamentais: r.divergencias_fundamentais, divergencias: r.divergencias }));

  // --- o que te distingue (frente ao catálogo de tradições praticadas)
  const praticadas = Object.entries(eixosTrad).filter(([slug]) => C.trads.find(t => t.slug === slug)?.situacao === 'praticada');
  const distintivo = ok.map(e => {
    const vals = praticadas.map(([, x]) => x[e.id]).filter(x => x?.status === 'ok').map(x => x.valor);
    if (vals.length < 20) return null;
    const perto = vals.filter(v => Math.abs(v - e.valor) <= 15).length / vals.length; const med = mediana(vals);
    return { id: e.id, nome: e.nome, valor: e.valor, mediana_catalogo: +med.toFixed(0), proporcao_perto: +perto.toFixed(2), n: vals.length,
      grau: perto < 0.12 ? 'incomum' : perto < 0.3 ? 'menos comum' : perto < 0.5 ? 'comum' : 'muito comum',
      texto: `${Math.round(perto * 100)}% das ${vals.length} tradições praticadas com dado nesse eixo ficam a até 15 pontos da sua posição.`, lado: e.lado, posicao: e.posicao };
  }).filter(Boolean);
  const distinguem = [...distintivo].sort((a, b) => a.proporcao_perto - b.proporcao_perto).slice(0, 4);
  const comuns = [...distintivo].sort((a, b) => b.proporcao_perto - a.proporcao_perto).slice(0, 3);

  // --- pensadores e escolas
  const pens = db.prepare('SELECT * FROM pensadores').all(); const pe = db.prepare('SELECT * FROM pensador_eixos').all();
  const pmap = {}; for (const r of pe) (pmap[r.pensador_id] ??= {})[r.eixo] = r;
  const comparaP = pens.map(p => {
    const m = pmap[p.id] || {}; let s = 0, w = 0, n = 0; const det = [];
    for (const e of ok) { const x = m[e.id]; if (!x) continue; const d = Math.abs(e.valor - x.valor); const pw = e.importancia * x.confianca; s += pw * d; w += pw; n++; det.push({ id: e.id, nome: e.nome, delta: d }); }
    if (n < 6) return null;
    return { slug: p.slug, nome: p.nome, tipo: p.tipo, vida: p.vida, tradicao: p.tradicao_texto, tradicao_slug: p.tradicao_id ? db.prepare('SELECT slug FROM tradicoes WHERE id=?').get(p.tradicao_id)?.slug : null,
      descricao: p.descricao, obras: p.obras, nota: p.nota, similaridade: Math.round((1 - s / w / 100) * 100), eixos_comparados: n,
      semelhancas: det.sort((a, b) => a.delta - b.delta).slice(0, 3).map(d => d.nome), diferencas: det.filter(d => d.delta >= 40).sort((a, b) => b.delta - a.delta).slice(0, 2).map(d => d.nome) };
  }).filter(Boolean).sort((a, b) => b.similaridade - a.similaridade);
  // variedade: no máx. 2 por tradição de origem
  const cont = {}; const pensadores = [];
  for (const p of comparaP.filter(x => x.tipo === 'pensador')) { const k = p.tradicao || '?'; cont[k] = (cont[k] || 0) + 1; if (cont[k] <= 2) pensadores.push(p); if (pensadores.length >= 6) break; }
  const escolas = comparaP.filter(x => x.tipo === 'escola_filosofica').slice(0, 4);

  // --- tradições históricas, relações e textos
  const top3 = vivas.slice(0, 3);
  const relacionadas = [];
  for (const t of top3) {
    for (const r of db.prepare(`SELECT r.tipo, r.descricao, o.slug os, o.nome onome, o.situacao osit, d.slug ds, d.nome dnome, d.situacao dsit FROM relacoes r JOIN tradicoes o ON o.id=r.origem_id JOIN tradicoes d ON d.id=r.destino_id WHERE o.slug=? OR d.slug=?`).all(t.slug, t.slug)) {
      const outro = r.os === t.slug ? { slug: r.ds, nome: r.dnome, situacao: r.dsit } : { slug: r.os, nome: r.onome, situacao: r.osit };
      relacionadas.push({ de: t.nome, de_slug: t.slug, tipo: r.tipo, sentido: r.os === t.slug ? 'origem' : 'destino', ...outro, descricao: r.descricao });
    }
    if (t.pai_slug) relacionadas.push({ de: t.nome, de_slug: t.slug, tipo: 'pertence_a', sentido: 'origem', slug: t.pai_slug, nome: t.pai, situacao: null, descricao: 'Ramo ou parte desta tradição maior.' });
  }
  const historicas = lista.filter(r => r.situacao === 'extinta' || r.situacao === 'historica').slice(0, 4).map(r => ({ slug: r.slug, nome: r.nome, situacao: r.situacao, compatibilidade: r.compatibilidade, nota: 'Proximidade de ideias, não parentesco histórico.' }));
  const textos = db.prepare(`SELECT DISTINCT s.slug, s.nome, s.tipo, s.descricao, t.slug tslug, t.nome tnome FROM tradicao_textos tt JOIN textos_sagrados s ON s.id=tt.texto_id JOIN tradicoes t ON t.id=tt.tradicao_id WHERE t.slug IN (${top3.map(() => '?').join(',') || "''"}) ORDER BY t.nome, s.nome LIMIT 10`).all(...top3.map(t => t.slug));

  // --- traços complementares e tensões
  const tracos = [];
  if (av.tracos.livre_arbitrio != null) tracos.push({ id: 'livre_arbitrio', nome: 'Livre-arbítrio', valor: av.tracos.livre_arbitrio, esq: 'Nada é livre', dir: 'Escolhas realmente livres' });
  if (av.tracos.destino != null) tracos.push({ id: 'destino', nome: 'Destino', valor: av.tracos.destino, esq: 'Sem plano prévio', dir: 'Vida segue um plano traçado' });
  if (av.tracos.experiencia != null) tracos.push({ id: 'experiencia', nome: 'Experiências espirituais', valor: av.tracos.experiencia, esq: 'Nenhuma marcante', dir: 'Frequentes ou marcantes' });
  const tensoes = [];
  for (const [dim, m] of Object.entries(av.massas)) {
    const tot = Object.values(m).reduce((a, b) => a + b, 0); const ps = Object.values(m).map(x => x / tot).filter(x => x >= 0.28);
    if (ps.length >= 2 && Object.keys(m).length >= 2) tensoes.push(C.porChave[dim]?.nome);
  }

  const out = {
    versao: 'v1', codigo: Q.codificar(respostas, imp), respondidas: av.respondidas, total_perguntas: av.total, provisorio: av.respondidas < 20,
    importancias: imp, temas: Q.TEMAS, classificacao, eixos: eixosUsuario, tracos, agnostico: !!av.tracosFlags.agnosticismo,
    ranking: { geral: vivas.slice(0, 10), religioes, ramos, movimentos, por_eixo: porEixoProx, mais_distantes: distantes },
    distintivo: { distinguem, comuns, todos: distintivo },
    pensadores, escolas, relacionadas, historicas, textos, tensoes: [...new Set(tensoes)].filter(Boolean),
    dados_insuficientes: cx.dados_insuficientes.length,
    metodo: {
      formula: 'final = 0,6 × concordância doutrinal + 0,4 × proximidade nos 12 eixos − penalidade por divergências fundamentais (máx. 10 pontos).',
      eixos: 'Cada eixo é uma projeção (0–100) das mesmas dimensões doutrinárias, aplicada igualmente às tradições e às suas respostas; dado ausente continua ausente.',
      aviso: 'Proximidade estatística entre suas respostas e modelos doutrinários do banco. Não indica pertencimento, aceitação por uma instituição, recomendação de conversão nem verdade espiritual. Cada tradição é internamente diversa; o banco descreve generalizações com nível de confiança variável.',
      pensadores: 'Afinidade intelectual estimada por curadoria inicial; não é identidade religiosa nem concordância integral.',
    },
  };
  if (incluirTodas) out.ranking.todas = lista;
  return out;
}
module.exports = { resultado, ARQUETIPOS, FRASES };
