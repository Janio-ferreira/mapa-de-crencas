'use strict';
/**
 * ALGORITMO DE COMPATIBILIDADE
 *
 * Para cada dimensão d respondida pelo usuário e documentada para a tradição T:
 *   s_d = Σ_i Σ_j  u_i · t_j · sim(i, j)
 *   - u: distribuição do usuário sobre as opções (pode marcar mais de uma; pesos normalizados)
 *   - t: distribuição doutrinária da tradição (várias opções = divergência interna documentada)
 *   - sim: similaridade parcial entre opções (1 na diagonal; tabela editável em `similaridade_opcoes`)
 * Peso da dimensão: w_d = peso_base · importância_do_usuário(1..3) · confiança_do_dado
 *
 * Resultado = Σ w_d s_d / Σ w_d  — considera SÓ dimensões documentadas.
 * Dimensões sem dado NÃO contam como zero nem como acordo: reduzem a cobertura e alargam o intervalo
 * [mínimo, máximo] (pior caso = todas as faltantes divergem; melhor caso = todas concordam).
 * Confiança = média das confianças × cobertura (alta ≥ .65, média ≥ .4, baixa abaixo).
 */
const { db } = require('./db');

let cache = null;
function carregar() {
  if (cache) return cache;
  const dims = db.prepare('SELECT * FROM dimensoes ORDER BY ordem').all();
  const opcoes = db.prepare('SELECT * FROM opcoes ORDER BY dimensao_id, ordem').all();
  const sim = new Map();
  for (const s of db.prepare('SELECT * FROM similaridade_opcoes').all()) sim.set(s.opcao_a + ':' + s.opcao_b, s);
  const porChave = {}; const porId = {};
  for (const d of dims) { d.opcoes = []; porChave[d.chave] = d; porId[d.id] = d; }
  const opPorId = {};
  for (const o of opcoes) { porId[o.dimensao_id].opcoes.push(o); opPorId[o.id] = o; }
  const trads = db.prepare(`SELECT id, slug, nome, categoria, situacao FROM tradicoes WHERE status_publicacao='publicado'`).all();
  const doutr = {};
  for (const r of db.prepare('SELECT * FROM doutrinas').all()) ((doutr[r.tradicao_id] ??= {})[r.dimensao_id] ??= []).push(r);
  cache = { dims, porChave, porId, opPorId, sim, trads, doutr };
  return cache;
}
function invalidar() { cache = null; }

function similaridade(C, a, b) { return a === b ? 1 : (C.sim.get(a + ':' + b)?.valor ?? 0); }
function entropiaNorm(ts) { if (ts.length < 2) return 0; const H = -ts.reduce((a, t) => a + t.peso * Math.log(t.peso), 0); return H / Math.log(ts.length); }

/**
 * answers: { [dimChave]: { opcoes: { [opcaoChave]: peso } | string[] | string, importancia?: 1..3 } }
 */
function normalizarRespostas(C, answers) {
  const out = {};
  for (const [dim, r] of Object.entries(answers || {})) {
    const D = C.porChave[dim]; if (!D || r == null) continue;
    let mapa = r.opcoes ?? r.opcao ?? r;
    if (typeof mapa === 'string') mapa = { [mapa]: 1 };
    else if (Array.isArray(mapa)) mapa = Object.fromEntries(mapa.map(k => [k, 1]));
    const itens = [];
    for (const [k, p] of Object.entries(mapa)) {
      const o = D.opcoes.find(x => x.chave === k); const peso = Number(p);
      if (o && peso > 0) itens.push({ id: o.id, chave: k, nome: o.nome, peso });
    }
    if (!itens.length) continue;
    const soma = itens.reduce((a, i) => a + i.peso, 0); itens.forEach(i => (i.peso /= soma));
    const imp = Math.min(3, Math.max(1, Number(r.importancia) || 2));
    out[dim] = { itens, importancia: imp };
  }
  return out;
}

function calcular(answers, { limite = 100 } = {}) {
  const C = carregar();
  const U = normalizarRespostas(C, answers);
  const dimsResp = Object.keys(U);
  if (!dimsResp.length) { const e = new Error('Responda pelo menos uma pergunta.'); e.status = 400; throw e; }
  const wTotalResp = dimsResp.reduce((a, d) => a + C.porChave[d].peso_base * U[d].importancia, 0);
  const resultados = [];

  for (const t of C.trads) {
    const doc = C.doutr[t.id] || {};
    let soma = 0, wDoc = 0, confSoma = 0;
    const detalhes = [];
    for (const dim of dimsResp) {
      const D = C.porChave[dim]; const ts = doc[D.id];
      const wBase = D.peso_base * U[dim].importancia;
      if (!ts) { detalhes.push({ dimensao: dim, nome: D.nome, status: 'nao_documentado', peso: wBase }); continue; }
      let s = 0;
      for (const u of U[dim].itens) for (const x of ts) s += u.peso * x.peso * similaridade(C, u.id, x.opcao_id);
      const conf = ts.reduce((a, x) => a + x.peso * x.confianca, 0);
      const w = wBase * conf;
      soma += w * s; wDoc += w; confSoma += conf * wBase;
      detalhes.push({
        dimensao: dim, nome: D.nome, status: s >= 0.7 ? 'concordancia' : s < 0.35 ? 'divergencia' : 'parcial',
        pontuacao: +s.toFixed(3), peso: +w.toFixed(3),
        voce: U[dim].itens.map(i => ({ nome: i.nome, peso: +i.peso.toFixed(2) })),
        tradicao: ts.map(x => ({ nome: C.opPorId[x.opcao_id].nome, peso: +x.peso.toFixed(2), confianca: x.confianca })).sort((a, b) => b.peso - a.peso),
        divergencia_interna: entropiaNorm(ts) > 0.6, confianca: +conf.toFixed(2), nota: ts.find(x => x.nota)?.nota || null,
      });
    }
    const wBaseDoc = detalhes.filter(d => d.status !== 'nao_documentado').reduce((a, d) => a + C.porChave[d.dimensao].peso_base * U[d.dimensao].importancia, 0);
    const cobertura = wBaseDoc / wTotalResp;
    if (wDoc === 0) { resultados.push({ slug: t.slug, nome: t.nome, categoria: t.categoria, situacao: t.situacao, insuficiente: true, cobertura: 0, detalhes }); continue; }
    const wFalta = (wTotalResp - wBaseDoc);
    const pct = soma / wDoc;
    const minimo = soma / (wDoc + wFalta), maximo = (soma + wFalta) / (wDoc + wFalta);
    const confMedia = confSoma / wBaseDoc;
    const confianca = confMedia * cobertura;
    resultados.push({
      slug: t.slug, nome: t.nome, categoria: t.categoria, situacao: t.situacao,
      compatibilidade: +(pct * 100).toFixed(1), intervalo: [+(minimo * 100).toFixed(1), +(maximo * 100).toFixed(1)],
      cobertura: +cobertura.toFixed(2), confianca: +confianca.toFixed(2),
      grau_confianca: confianca >= 0.65 ? 'alto' : confianca >= 0.4 ? 'médio' : 'baixo',
      concordancias: detalhes.filter(d => d.status === 'concordancia').sort((a, b) => b.peso * b.pontuacao - a.peso * a.pontuacao).slice(0, 5),
      divergencias: detalhes.filter(d => d.status === 'divergencia').sort((a, b) => b.peso * (1 - b.pontuacao) - a.peso * (1 - a.pontuacao)).slice(0, 5),
      parciais: detalhes.filter(d => d.status === 'parcial'),
      nao_documentadas: detalhes.filter(d => d.status === 'nao_documentado').map(d => d.nome),
      detalhes,
    });
  }
  const validos = resultados.filter(r => !r.insuficiente && r.cobertura >= 0.3).sort((a, b) => b.compatibilidade - a.compatibilidade);
  validos.forEach((r, i) => { r.posicao = i + 1; });
  return {
    perguntas_respondidas: dimsResp.length, total_dimensoes: C.dims.length,
    resultados: validos.slice(0, limite),
    dados_insuficientes: resultados.filter(r => r.insuficiente || r.cobertura < 0.3).map(r => ({ slug: r.slug, nome: r.nome })),
    metodo: {
      formula: 'Para cada dimensão: similaridade esperada entre sua resposta e a distribuição doutrinária da tradição (com similaridade parcial entre opções). Média ponderada por (peso da dimensão × importância que você deu × confiança do dado).',
      dados_ausentes: 'Dimensões sem dado documentado não contam como zero nem como acordo: ampliam o intervalo [mínimo, máximo] e reduzem a confiança.',
      divergencia_interna: 'Quando a tradição tem várias posições internas, o resultado é a média ponderada entre elas.',
      aviso: 'A compatibilidade mede proximidade de ideias com os modelos doutrinários do banco — não indica qual religião é verdadeira, melhor ou recomendada, e não é uma recomendação de conversão.',
    },
  };
}
module.exports = { calcular, carregar, invalidar, normalizarRespostas };
