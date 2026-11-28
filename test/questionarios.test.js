'use strict';
process.env.DB_FILE = ':memory:'; process.env.MAPA_IMAGENS_AUTO = '0';
const test = require('node:test'); const assert = require('node:assert');
const { seed } = require('../server/seed');
seed(); require('../server/seed/aplicar_eixos').aplicar();
const Q = require('../server/lib/questionario'); const P = require('../server/lib/perfil'); const { carregar } = require('../server/lib/compat');
const C = carregar();
const IDS = ['v1', 'v128', 'v244'], NOVAS = ['v128', 'v244'];
const efeitosDe = q => q.tipo === 'escolha' ? q.opcoes.flatMap(o => o.e) : q.efeitos.flat();

// ---------- respondente simulado: responde como alguém cuja doutrina é a de uma tradição cadastrada ----------
function persona(t) {
  const m = {};
  for (const [did, arr] of Object.entries(C.doutr[t.id] || {})) {
    const dim = C.dims.find(x => x.id === +did); if (!dim || !arr.length) continue;
    const tot = arr.reduce((a, x) => a + x.peso, 0); m[dim.chave] = {};
    for (const x of arr) { const o = C.opPorId[x.opcao_id]; m[dim.chave][o.chave] = (m[dim.chave][o.chave] || 0) + x.peso / tot; }
  }
  return m;
}
const apoio = (pe, efs) => efs.reduce((a, e) => { const d = pe[e.dim]; if (!d) return a; const w = d[e.opcao] || 0; return a + e.massa * (w > 0 ? w : -0.5); }, 0);
function responder(pe, V) {
  const r = {};
  for (const q of V.perguntas) {
    if (q.tipo === 'escolha') { let best = 0, bs = 0.05; q.opcoes.forEach((o, i) => { const s = apoio(pe, o.e); if (s > bs) { bs = s; best = i + 1; } }); if (best) r[q.id] = best; }
    else { const net = apoio(pe, q.efeitos[4]) - apoio(pe, q.efeitos[0]); if (net > 0.15) r[q.id] = 5; else if (net < -0.15) r[q.id] = 1; }
  }
  return r;
}

test('quantidade de perguntas de cada versão e distribuição por tema', () => {
  assert.equal(Q.versao('v1').n, 44); assert.equal(Q.versao('v128').n, 128); assert.equal(Q.versao('v244').n, 244);
  assert.deepEqual(Q.listaVersoes().map(v => v.n), [44, 128, 244]);
  for (const id of NOVAS) for (const t of Q.TEMAS) assert.ok(Q.versao(id).perguntas.filter(q => q.tema === t.id).length >= 8, `${id}: poucos itens em ${t.id}`);
  assert.ok(Q.versao('v244').perguntas.filter(q => q.tipo === 'escolha').length >= 20, 'v244 deve ter dilemas/cenários de escolha');
  assert.ok(Q.versao('v128').perguntas.filter(q => q.tipo === 'escolha').length >= 10);
});

test('perguntas próprias: nenhuma repetida dentro ou entre versões (texto idêntico ou quase)', () => {
  const norm = s => new Set(s.toLowerCase().replace(/[^a-zà-ú0-9 ]/g, '').split(/\s+/).filter(w => w.length > 3));
  const todas = []; const ids = new Set();
  for (const v of IDS) for (const q of Q.versao(v).perguntas) { assert.ok(!ids.has(q.id), `id repetido ${q.id}`); ids.add(q.id); todas.push([`${v}/${q.id}`, norm(q.texto), q.texto]); }
  for (let i = 0; i < todas.length; i++) for (let j = i + 1; j < todas.length; j++) {
    const a = todas[i][1], b = todas[j][1]; let it = 0; for (const w of a) if (b.has(w)) it++;
    const jac = it / (a.size + b.size - it);
    assert.ok(todas[i][2] !== todas[j][2] && jac < 0.7, `quase repetida: ${todas[i][0]} ~ ${todas[j][0]} (${jac.toFixed(2)})`);
  }
});

test('todos os efeitos apontam para dimensões e opções existentes; estrutura de cada pergunta é válida', () => {
  for (const v of IDS) for (const q of Q.versao(v).perguntas) {
    assert.ok(Q.TEMAS.some(t => t.id === q.tema), `${q.id}: tema`);
    assert.ok(q.texto && q.texto.length > 15, `${q.id}: texto`);
    if (q.traco) assert.ok(Q.TRACOS[q.traco], `${q.id}: traço desconhecido`);
    if (q.tipo === 'escala') assert.equal(q.efeitos.length, 5, q.id);
    else { assert.ok(q.opcoes.length >= (v === 'v1' ? 3 : 4), `${q.id}: opções insuficientes`); assert.equal(new Set(q.opcoes.map(o => o.t)).size, q.opcoes.length, `${q.id}: opções repetidas`); }
    for (const e of efeitosDe(q)) { assert.ok(C.porChave[e.dim]?.opcoes.some(o => o.chave === e.opcao), `${q.id}: ${e.dim}/${e.opcao}`); assert.ok(e.massa > 0 && e.massa <= 1, `${q.id}: massa ${e.massa}`); }
    if (q.tipo === 'escala' && !q.traco) assert.ok(q.efeitos.some(x => x.length), `${q.id}: escala sem efeito nem traço`);
  }
});

test('equilíbrio: toda opção de toda dimensão é alcançável e nenhuma domina a evidência', () => {
  for (const v of NOVAS) {
    const m = {};
    for (const q of Q.versao(v).perguntas) { const vistos = new Set(); for (const e of efeitosDe(q)) { const k = `${e.dim}:${e.opcao}`; (m[k] ??= { q: 0, massa: 0 }).massa += e.massa; if (!vistos.has(k)) { m[k].q++; vistos.add(k); } } }
    for (const D of C.dims) {
      if (D.chave === 'ciencia') { /* "indefinida" é opção de dado ausente, não de resposta */ }
      const alvo = D.opcoes.filter(o => !(D.chave === 'ciencia' && o.chave === 'indefinida'));
      const tot = alvo.reduce((a, o) => a + (m[`${D.chave}:${o.chave}`]?.massa || 0), 0);
      for (const o of alvo) {
        const x = m[`${D.chave}:${o.chave}`]; assert.ok(x && x.q >= 1, `${v}: ${D.chave}/${o.chave} sem pergunta`);
        if (D.opcoes.length >= 4 && !['ressurreicao', 'reencarnacao'].includes(D.chave)) assert.ok(x.massa / tot < 0.5, `${v}: ${D.chave}/${o.chave} concentra ${(x.massa / tot * 100).toFixed(0)}% da evidência`);
      }
    }
    // dimensões centrais têm mais de uma pergunta por opção principal
    for (const k of ['teismo:monoteismo', 'teismo:politeismo', 'teismo:panteismo', 'teismo:nao_teismo', 'pos_morte:julgamento', 'pos_morte:renascimento', 'salvacao:graca_fe', 'salvacao:conhecimento_pratica', 'etica:razao_humanista', 'etica:mandamento_divino']) assert.ok(m[k].q >= 3, `${v}: ${k} com poucas perguntas (${m[k].q})`);
  }
});

test('código de compartilhamento: ida e volta em todas as versões; códigos antigos (v1) continuam válidos; lixo é recusado', () => {
  for (const v of IDS) {
    const V = Q.versao(v); const r = {}; V.perguntas.forEach((q, i) => { if (i % 3) r[q.id] = q.tipo === 'escolha' ? 1 + (i % q.opcoes.length) : 1 + (i % 5); });
    const cod = Q.codificar(r, { deus: 3, etica: 1 }, v);
    assert.ok(cod.startsWith(v + '-')); const d = Q.decodificar(cod);
    assert.equal(d.versao, v); assert.deepEqual(d.respostas, r); assert.equal(d.importancias.deus, 3); assert.equal(d.importancias.etica, 1); assert.equal(d.importancias.origem, 2);
  }
  assert.ok(Q.decodificar('v1-' + '3'.repeat(44) + '-2222222222'));
  for (const ruim of ['lixo', 'v2-111-2222222222', 'v1-' + '1'.repeat(45) + '-2222222222', 'v128-' + '1'.repeat(129) + '-2222222222', '', null, 'v244--1']) assert.equal(Q.decodificar(ruim), null, String(ruim));
});

test('pontuação coerente: quem responde como uma tradição cadastrada a encontra no topo da compatibilidade', () => {
  const taxa = {};
  for (const v of IDS) {
    const V = Q.versao(v); const gaps = []; let top10 = 0;
    for (const t of C.trads) {
      const pe = persona(t); if (Object.keys(pe).length < 8) continue;
      const o = P.resultado({ respostas: responder(pe, V), versao: v, incluirTodas: true }); const L = o.ranking.todas; const eu = L.find(x => x.slug === t.slug);
      assert.ok(eu, `${v}: ${t.slug} ausente do ranking`);
      gaps.push(L[0].compatibilidade - eu.compatibilidade); if (L.indexOf(eu) < 10) top10++;
    }
    taxa[v] = { n: gaps.length, ate4: gaps.filter(g => g <= 4).length / gaps.length, ate8: gaps.filter(g => g <= 8).length / gaps.length, top10: top10 / gaps.length };
  }
  assert.ok(taxa.v1.n > 250);
  for (const v of NOVAS) {
    assert.ok(taxa[v].ate4 >= 0.97, `${v}: só ${(taxa[v].ate4 * 100).toFixed(0)}% das tradições ficam a ≤4 pontos do topo`);
    assert.ok(taxa[v].ate8 >= 0.99, `${v}: ate8 ${taxa[v].ate8}`);
    assert.ok(taxa[v].top10 >= taxa.v1.top10, `${v}: top10 ${taxa[v].top10} não supera a versão de 44 (${taxa.v1.top10})`);
    assert.ok(taxa[v].ate4 >= taxa.v1.ate4, `${v} deve ser pelo menos tão discriminante quanto a versão de 44`);
  }
});

test('perfis contrastantes caem em lugares diferentes e coerentes, em todas as versões', () => {
  const FAM = {
    cristao: ['catolicismo', 'luteranismo', 'tradicao-reformada', 'ortodoxia-oriental', 'anglicanismo', 'cristianismo', 'protestantismo', 'batismo', 'pentecostalismo', 'metodismo'],
    budista: ['budismo', 'zen', 'theravada', 'mahayana', 'vajrayana', 'terra-pura', 'kagyu', 'soto', 'rinzai', 'tradicao-floresta', 'jainismo'],
    islamico: ['islam', 'sunismo', 'xiismo', 'sufismo', 'tablighi', 'ashar', 'ibad', 'deoband', 'zaid', 'salaf', 'barelvi', 'maturid', 'ismail', 'hanbal', 'hanafi', 'shafi', 'malik'],
    politeista: ['hinduismo', 'xintoismo', 'religiao', 'candomble', 'umbanda', 'vodu', 'taoismo', 'religiao-grega', 'religiao-egipcia', 'religiao-romana', 'religiao-popular', 'religioes-', 'paganismo', 'ioruba'],
  };
  const casa = (slug, lista) => lista.some(p => slug.includes(p));
  for (const v of IDS) {
    const V = Q.versao(v); const alvo = { cristao: 'catolicismo', budista: 'theravada', islamico: 'sunismo', politeista: 'hinduismo' };
    const topos = {};
    for (const [k, slug] of Object.entries(alvo)) {
      const t = C.trads.find(x => x.slug === slug); assert.ok(t, slug);
      const o = P.resultado({ respostas: responder(persona(t), V), versao: v });
      topos[k] = o.ranking.geral.slice(0, 5).map(x => x.slug);
      assert.ok(topos[k].some(s => casa(s, FAM[k])), `${v}/${k}: ${topos[k].join(',')}`);
    }
    assert.notDeepEqual(topos.cristao, topos.budista); assert.notDeepEqual(topos.islamico, topos.politeista);
  }
});

test('resultado detalhado e recomendações nas três versões', () => {
  for (const v of IDS) {
    const V = Q.versao(v); const t = C.trads.find(x => x.slug === 'zen' || x.slug === 'mahayana');
    const r = responder(persona(t), V); const o = P.resultado({ respostas: r, versao: v });
    assert.equal(o.versao, v); assert.equal(o.total_perguntas, V.n); assert.ok(o.respondidas >= V.minimo && o.respondidas <= V.n);
    assert.equal(o.eixos.length, 12); assert.ok(o.classificacao.nome && o.classificacao.sintese);
    assert.equal(o.ranking.geral.length, 10);
    for (const x of o.ranking.geral) { assert.ok(x.compatibilidade >= 0 && x.compatibilidade <= 100); assert.ok(x.explicacao.length > 20); assert.ok(x.concordancias.length + x.divergencias.length >= 1, x.slug); }
    assert.ok(o.ranking.religioes.length >= 3 && o.ranking.ramos.length >= 3, 'recomendações por categoria');
    assert.ok(o.pensadores.length >= 3);
    assert.ok(o.codigo.startsWith(v + '-'));
    // detalhamento por dimensão
    assert.ok(o.detalhes_dimensoes.length >= 14, `${v}: dimensões detalhadas ${o.detalhes_dimensoes.length}`);
    for (const d of o.detalhes_dimensoes) { assert.ok(['firme', 'moderada', 'dividida'].includes(d.forca)); assert.ok(d.perguntas >= 1); assert.ok(Math.abs(d.opcoes.reduce((a, x) => a + x.pct, 0) - 100) <= 4 || d.opcoes.length === 4); }
    assert.equal(o.cobertura_temas.length, Q.TEMAS.length);
    assert.equal(o.cobertura_temas.reduce((a, t2) => a + t2.total, 0), V.n);
    assert.equal(o.cobertura_temas.reduce((a, t2) => a + t2.respondidas, 0), o.respondidas);
    const ctr = o.detalhes_dimensoes.reduce((a, d) => a + d.perguntas, 0); assert.ok(ctr >= o.detalhes_dimensoes.length);
  }
});

test('a versão aprofundada traz mais evidência e mais traços que as demais', () => {
  const t = C.trads.find(x => x.slug === 'theravada'); const res = {};
  for (const v of IDS) res[v] = P.resultado({ respostas: responder(persona(t), Q.versao(v)), versao: v });
  const evid = v => res[v].detalhes_dimensoes.reduce((a, d) => a + d.perguntas, 0);
  assert.ok(evid('v128') > evid('v1') * 2 && evid('v244') > evid('v128') * 1.5, `evidência ${evid('v1')}/${evid('v128')}/${evid('v244')}`);
  assert.ok(res.v1.tracos.length <= 3 && res.v128.tracos.length >= 6 && res.v244.tracos.length >= 8, `traços ${res.v1.tracos.length}/${res.v128.tracos.length}/${res.v244.tracos.length}`);
  for (const v of NOVAS) for (const tr of res[v].tracos) { assert.ok(tr.valor >= 0 && tr.valor <= 100); assert.ok(Q.TRACOS[tr.id]); }
});

test('traços: média das perguntas do mesmo traço e inversão', () => {
  const V = Q.versao('v244'); const r = {};
  const qs = V.perguntas.filter(q => q.traco === 'ascetismo'); assert.ok(qs.some(q => q.inv) && qs.some(q => !q.inv));
  for (const q of qs) r[q.id] = 5;
  const av = Q.avaliar(r, 'v244'); const esperado = qs.reduce((a, q) => a + (q.inv ? 0 : 100), 0) / qs.length;
  assert.equal(Math.round(av.tracos.ascetismo), Math.round(esperado));
  for (const q of V.perguntas.filter(q => q.traco === 'misticismo')) r[q.id] = 5; assert.equal(Q.avaliar(r, 'v244').tracos.misticismo, 100);
});

test('mínimo por versão, respostas neutras e versão desconhecida', () => {
  for (const v of IDS) {
    const V = Q.versao(v); const poucas = {}; V.perguntas.slice(0, V.minimo - 1).forEach(q => { poucas[q.id] = q.tipo === 'escolha' ? 1 : 5; });
    assert.throws(() => P.resultado({ respostas: poucas, versao: v }), new RegExp(`pelo menos ${V.minimo}`));
    const neutras = {}; V.perguntas.forEach(q => { if (q.tipo === 'escala') neutras[q.id] = 3; });
    assert.throws(() => P.resultado({ respostas: neutras, versao: v }), /neutras|puladas|pelo menos/);
    assert.equal(Q.avaliar({}, v).respondidas, 0);
  }
  assert.throws(() => P.resultado({ respostas: { m1: 1 }, versao: 'v999' }), /desconhecida/);
  // resposta fora da faixa é ignorada, não quebra
  assert.equal(Q.avaliar({ m1: 99, m2: -4, m3: 'x' }, 'v128').respondidas, 0);
});

test('provisório depende do mínimo recomendado de cada versão; resultado é determinístico', () => {
  const t = C.trads.find(x => x.slug === 'catolicismo');
  for (const v of IDS) {
    const V = Q.versao(v); const r = responder(persona(t), V);
    const a = P.resultado({ respostas: r, versao: v }), b = P.resultado({ respostas: r, versao: v });
    assert.deepEqual(a.ranking.geral.map(x => [x.slug, x.compatibilidade]), b.ranking.geral.map(x => [x.slug, x.compatibilidade]));
    assert.equal(a.provisorio, a.respondidas < V.recomendado);
    const metade = {}; Object.entries(r).slice(0, V.minimo).forEach(([k, x]) => { metade[k] = x; });
    if (Object.keys(metade).length >= V.minimo) assert.equal(P.resultado({ respostas: metade, versao: v }).provisorio, true);
  }
});

test('API: versões, questionário por versão, resultado por código e por respostas', async () => {
  const { criarApp } = require('../server/app'); const app = criarApp(); const srv = app.listen(0); const base = `http://127.0.0.1:${srv.address().port}/api`;
  try {
    const get = async u => { const r = await fetch(base + u); return { s: r.status, j: await r.json() }; };
    const post = async (u, b) => { const r = await fetch(base + u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { s: r.status, j: await r.json() }; };
    const vs = await get('/perfil/versoes'); assert.equal(vs.s, 200); assert.deepEqual(vs.j.versoes.map(v => v.n), [44, 128, 244]);
    for (const v of IDS) {
      const q = await get('/perfil/questionario?versao=' + v); assert.equal(q.s, 200); assert.equal(q.j.versao, v); assert.equal(q.j.perguntas.length, Q.versao(v).n);
      assert.ok(q.j.perguntas.every(p => !('efeitos' in p) && !('e' in p)), 'a API não expõe os efeitos das respostas');
      assert.ok(q.j.perguntas.filter(p => p.tipo === 'escolha').every(p => p.opcoes.length >= 3));
      const V = Q.versao(v); const r = responder(persona(C.trads.find(x => x.slug === 'catolicismo')), V);
      const a = await post('/perfil/resultado', { respostas: r, versao: v }); assert.equal(a.s, 200); assert.equal(a.j.versao, v);
      const b = await get('/perfil/resultado/' + a.j.codigo); assert.equal(b.s, 200); assert.deepEqual(b.j.ranking.geral.map(x => x.slug), a.j.ranking.geral.map(x => x.slug));
      const c = await post('/perfil/resultado', { codigo: a.j.codigo, importancias: { deus: 3 } }); assert.equal(c.s, 200); assert.equal(c.j.versao, v);
    }
    assert.equal((await get('/perfil/questionario')).j.versao, 'v1');   // padrão: a versão atual
    assert.equal((await get('/perfil/questionario?versao=v7')).s, 400);
    assert.equal((await post('/perfil/resultado', { respostas: { p1: 1 }, versao: 'v244' })).s, 400);
    assert.equal((await get('/perfil/resultado/v244-abc-2')).s, 400);
  } finally { srv.close(); }
});
