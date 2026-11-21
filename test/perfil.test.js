'use strict';
process.env.DB_FILE = ':memory:';
const test = require('node:test'); const assert = require('node:assert');
const { seed } = require('../server/seed');
seed(); require('../server/seed/aplicar_eixos').aplicar();
const Q = require('../server/lib/questionario'); const E = require('../server/lib/eixos'); const P = require('../server/lib/perfil'); const { carregar } = require('../server/lib/compat');

const escolher = (mapa, escalas) => { const r = {}; for (const q of Q.PERGUNTAS) { if (q.tipo === 'escolha') { const t = mapa[q.id]; if (t) { const i = q.opcoes.findIndex(o => o.t.includes(t)); if (i >= 0) r[q.id] = i + 1; } } else if (escalas[q.id]) r[q.id] = escalas[q.id]; } return r; };

test('todos os efeitos do questionário apontam para dimensões e opções existentes', () => {
  const C = carregar();
  for (const q of Q.PERGUNTAS) {
    const efs = q.tipo === 'escolha' ? q.opcoes.flatMap(o => o.e) : q.efeitos.flat();
    if (q.tipo === 'escala') assert.equal(q.efeitos.length, 5, q.id);
    for (const e of efs) assert.ok(C.porChave[e.dim]?.opcoes.some(o => o.chave === e.opcao), `${q.id}: ${e.dim}/${e.opcao}`);
  }
  for (const ax of E.AXES) for (const f of ax.fontes) { const D = C.porChave[f.dim]; assert.ok(D, f.dim); for (const k of Object.keys(f.mapa)) assert.ok(D.opcoes.some(o => o.chave === k), `${ax.id}: ${f.dim}/${k}`); }
});

test('código de compartilhamento: ida e volta sem perda', () => {
  const r = { q1: 3, q2: 1, q10: 5, q44: 2 }; const imp = { deus: 3, etica: 1 };
  const d = Q.decodificar(Q.codificar(r, imp));
  assert.deepEqual(d.respostas, r); assert.equal(d.importancias.deus, 3); assert.equal(d.importancias.etica, 1); assert.equal(d.importancias.origem, 2);
  assert.equal(Q.decodificar('lixo'), null);
});

test('eixos das tradições são coerentes e dado ausente não é inventado', () => {
  const cat = E.eixosDaTradicao('catolicismo'), th = E.eixosDaTradicao('theravada');
  assert.ok(cat.divindade.valor > 85 && cat.unicidade.valor < 15 && cat.autoridade.valor < 20 && cat.vida_apos_morte.valor > 85);
  assert.ok(th.divindade.valor < 25); assert.equal(th.unicidade.status, 'nao_se_aplica'); assert.ok(th.destino.valor < 15);
  const todas = E.eixosDeTodas();
  assert.ok(Object.values(todas).some(t => t.natureza_humana.status === 'nao_documentado'), 'deveria haver tradições sem dado em algum eixo');
  for (const t of Object.values(todas)) for (const ax of E.AXES) { const x = t[ax.id]; if (x.status === 'ok') assert.ok(x.valor >= 0 && x.valor <= 100); else assert.equal(x.valor, undefined); }
});

test('perfil secular: ateu/humanista, eixo 2 e 11 não se aplicam, sem forçar religião', () => {
  const r = P.resultado({ respostas: escolher({ q1: 'Não creio', q2: 'Não há', q7: 'processos naturais', q8: 'só corpo', q9: 'Nada', q13: 'Não há meta', q18: 'Não existe', q21: 'Cada pessoa', q23: 'Nenhuma', q26: 'pessoal', q31: 'razão', q38: 'Não considero' }, { q41: 5, q10: 1, q11: 1, q19: 1, q32: 1 }) });
  const ax = Object.fromEntries(r.eixos.map(e => [e.id, e]));
  assert.ok(ax.divindade.valor < 15 && ax.espiritualidade.valor < 25 && ax.vida_apos_morte.valor < 15 && ax.etica.valor > 85);
  assert.equal(ax.unicidade.status, 'nao_se_aplica'); assert.equal(ax.pluralismo.status, 'nao_se_aplica');
  assert.match(r.classificacao.nome, /Humanista Secular|Cético/);
  assert.ok(r.classificacao.aviso.includes('não é uma religião'));
});

test('perfil de fé tradicional e perfil de libertação budista caem nos lugares esperados', () => {
  const cat = P.resultado({ respostas: escolher({ q1: 'único Deus', q2: 'Acima', q7: 'a partir do nada', q8: 'alma individual', q9: 'julgamento', q13: 'graça', q16: 'falha', q18: 'revelação de Deus', q21: 'hierarquia', q23: 'Cultos', q26: 'instituição', q31: 'mandamentos', q38: 'Uma é a mais completa' }, { q3: 5, q11: 5, q19: 5, q20: 4, q15: 5 }) });
  assert.match(cat.classificacao.nome, /Fiel da Tradição|Devoto/);
  assert.ok(cat.ranking.geral.slice(0, 8).some(t => ['catolicismo', 'luteranismo', 'tradicao-reformada', 'ortodoxia-oriental', 'anglicanismo', 'cristianismo', 'protestantismo'].includes(t.slug)));
  const bud = P.resultado({ respostas: escolher({ q1: 'Não creio', q2: 'Não há', q8: 'Não há um "eu"', q9: 'Renasce', q13: 'Libertar', q18: 'experiência direta', q21: 'mestre', q23: 'Meditação', q26: 'mestre', q31: 'compaixão' }, { q10: 5, q14: 5, q17: 5, q39: 5 }) });
  assert.match(bud.classificacao.nome, /Libertação|Contemplativo/);
  assert.ok(bud.ranking.geral.slice(0, 8).some(t => /budismo|zen|theravada|mahayana|vajrayana|jainismo|terra-pura|kagyu|soto|rinzai|tradicao-floresta/.test(t.slug)));
  assert.ok(bud.pensadores.slice(0, 5).some(p => ['buda', 'nagarjuna', 'dogen', 'thich-nhat-hanh'].includes(p.slug)));
});

test('respostas insuficientes ou neutras são recusadas; pular não gera evidência', () => {
  assert.throws(() => P.resultado({ respostas: { q1: 1 } }), /pelo menos 8/);
  const neutras = {}; Q.PERGUNTAS.forEach(q => { if (q.tipo === 'escala') neutras[q.id] = 3; });
  assert.throws(() => P.resultado({ respostas: neutras }), /neutras|puladas/);
  const av = Q.avaliar({ q1: 0 }); assert.equal(av.respondidas, 0);
});

test('resultado é determinístico e explicável', () => {
  const resp = escolher({ q1: 'único Deus', q9: 'julgamento', q13: 'graça', q18: 'revelação de Deus', q23: 'Cultos', q26: 'instituição', q31: 'mandamentos', q7: 'a partir do nada' }, { q19: 5, q20: 5 });
  const a = P.resultado({ respostas: resp }), b = P.resultado({ respostas: resp });
  assert.deepEqual(a.ranking.geral.map(t => [t.slug, t.compatibilidade]), b.ranking.geral.map(t => [t.slug, t.compatibilidade]));
  for (const t of a.ranking.geral) { assert.ok(t.explicacao.length > 20); assert.ok(t.compatibilidade >= 0 && t.compatibilidade <= 100); }
  assert.ok(a.provisorio);
});
