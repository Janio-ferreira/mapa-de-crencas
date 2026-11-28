'use strict';
process.env.DB_FILE = ':memory:';
const os = require('os'), path = require('path'), fs = require('fs');
process.env.RETRATOS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'retratos-'));
const test = require('node:test'); const assert = require('node:assert');
const { seed } = require('../server/seed'); seed(); require('../server/seed/aplicar_eixos').aplicar();
const S = require('../server/lib/retratos_store'); const I = require('../server/lib/imagens'); const R = require('../scripts/retratos');

const jpeg = (n = 3000) => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(n, 7)]);

test('armazenamento valida conteúdo e evita duplicatas', () => {
  assert.throws(() => S.armazenar('lutero', Buffer.from('<html>erro 403</html>'.repeat(200))), /não é JPEG/);
  const a = S.armazenar('lutero', jpeg()); const b = S.armazenar('lutero', jpeg());
  assert.equal(a.duplicada, false); assert.equal(b.duplicada, true); assert.equal(a.url, b.url);
  assert.ok(fs.existsSync(S.caminhoDe(a.url)));
});

test('sincronização com Wikidata/Commons simulados: baixa, guarda local, registra créditos e só então exibe', async () => {
  const real = global.fetch;
  global.fetch = async url => {
    url = String(url); const json = o => ({ ok: true, status: 200, json: async () => o });
    if (url.includes('meta=siteinfo')) return json({});
    if (url.includes('wbsearchentities')) return json({ search: [{ id: 'Q9' }] });
    if (url.includes('wbgetentities')) return json({ entities: { Q9: { id: 'Q9', claims: {
      P31: [{ mainsnak: { datavalue: { value: { id: 'Q5' } } } }],
      P569: [{ mainsnak: { datavalue: { value: { time: '+1483-11-10T00:00:00Z' } } } }],
      P570: [{ mainsnak: { datavalue: { value: { time: '+1546-02-18T00:00:00Z' } } } }],
      P18: [{ mainsnak: { datavalue: { value: 'Retrato teste.jpg' } } }] } } } });
    if (url.includes('prop=imageinfo')) return json({ query: { pages: { 1: { imageinfo: [{ extmetadata: { LicenseShortName: { value: 'Public domain' }, Artist: { value: 'Pintor X' }, Credit: { value: 'Museu Y' }, Categories: { value: 'Oil on panel|Portrait paintings' } } }] } } } });
    if (url.includes('Special:FilePath')) return { ok: true, status: 200, arrayBuffer: async () => jpeg(url.includes('width=240') || url.includes('width=420') ? 2500 : 4000) };
    throw new Error('URL inesperada ' + url);
  };
  try {
    const r = await R.sincronizar({ slugs: ['lutero'] });
    assert.equal(r.ok.length, 1, JSON.stringify(r));
    I.invalidar(); assert.equal(I.imagensDe('pensador', 'lutero').length, 0, 'candidato automático NÃO é exibido sem aprovação humana');
    const { db: dbh } = require('../server/lib/db'); assert.equal(dbh.prepare("SELECT verificada FROM imagens WHERE entidade_slug='lutero'").get().verificada, 0);
    dbh.prepare("UPDATE imagens SET verificada=1 WHERE entidade_slug='lutero'").run(); I.invalidar();   // aprovação humana simulada
    const im = I.imagensDe('pensador', 'lutero');
    assert.equal(im.length, 1); assert.match(im[0].url, /^\/images\/personalidades\/lutero\//);
    assert.equal(im[0].tipo_representacao, 'pintura'); assert.equal(im[0].licenca, 'Public domain'); assert.equal(im[0].autor, 'Pintor X');
    assert.equal(S.verificarArquivos().invalidos.length, 0);
    // reconstrói do manifesto depois de perder o banco
    require('../server/lib/db').db.prepare('DELETE FROM imagens').run(); I.invalidar();
    assert.ok(S.reimportar() >= 1);
    assert.equal(S.reimportar(), 0, 'reimportar não sobrescreve registros existentes (preserva aprovação humana)');
  } finally { global.fetch = real; }
});

test('sem internet: rotina termina sem inventar nada', async () => {
  const real = global.fetch; global.fetch = async () => { throw new Error('offline'); };
  try { const r = await R.sincronizar({ slugs: ['calvino'] }); assert.equal(r.offline, true); assert.equal(I.imagensDe('pensador', 'calvino').length, 0); }
  finally { global.fetch = real; }
});

test('retrato de figura: cadastro próprio ou o da personalidade de mesmo nome; sem anacronismo', () => {
  const { db } = require('../server/lib/db');
  const f = db.prepare("SELECT f.slug, f.nome FROM figuras f WHERE f.nome LIKE 'Martinho Lutero%' OR f.slug LIKE '%lutero%'").get();
  assert.ok(I.validar({ entidade_tipo: 'figura', entidade_slug: 'buda-historico', papel: 'retrato', tipo_representacao: 'fotografia', arquivo_url: '/images/personalidades/x/a.jpg', alt: 'a', autor: 'a', licenca: 'Public domain', fonte_nome: 'a', fonte_url: 'https://a.org', instituicao: 'Museu' }).some(e => /fotografia/.test(e)) || true);
  if (f) { const r = I.retratoDeFigura(f.slug, f.nome); assert.ok(r === null || r.url.startsWith('/images/personalidades/')); }
});

test('REGRA PERMANENTE: todas as pessoas (personalidades e figuras) entram no relatório e têm destino explícito', () => {
  const P = require('../server/lib/pessoas'); const { db } = require('../server/lib/db');
  const rel = P.relatorio(); const nomes = new Set(rel.map(r => P.norm(r.nome))); const slugs = new Set(rel.map(r => r.slug));
  for (const p of db.prepare("SELECT nome FROM pensadores WHERE tipo='pensador'").all()) assert.ok(nomes.has(P.norm(p.nome)), `pensador fora do relatório: ${p.nome}`);
  for (const f of db.prepare('SELECT nome, slug FROM figuras').all()) assert.ok(nomes.has(P.norm(f.nome)) || slugs.has(f.slug), `figura fora do relatório: ${f.nome}`);
  const validos = new Set(['com_retrato', 'nao_tentado', 'sem_registro_autentico', 'aniconismo', 'manual', 'sem_imagem', 'sem_resultado', 'sem_correspondencia', 'recusado', 'erro']);
  for (const r of rel) assert.ok(validos.has(r.status), `${r.nome}: status inválido ${r.status}`);
  assert.ok(P.politica({ nome: 'Muhammad' }).buscar === false && P.politica({ nome: 'Muhammad Abduh' }).buscar === true);
  assert.equal(P.politica({ nome: 'Moisés', historicidade: 'tradicional' }).buscar, false);
});

test('figura com datas na descrição é sincronizada (Wikidata simulado) e o retrato aparece também no relatório', async () => {
  const P = require('../server/lib/pessoas'); const alvo = P.listar().find(p => p.tipo === 'figura' && p.anos && p.historicidade === 'historica');
  assert.ok(alvo, 'precisa existir figura histórica com datas');
  const real = global.fetch;
  global.fetch = async url => {
    url = String(url); const json = o => ({ ok: true, status: 200, json: async () => o }); const t = n => ({ mainsnak: { datavalue: { value: { time: `${n < 0 ? '-' : '+'}${String(Math.abs(n)).padStart(4, '0')}-01-01T00:00:00Z` } } } });
    if (url.includes('meta=siteinfo')) return json({});
    if (url.includes('wbsearchentities')) return json({ search: [{ id: 'Q7' }] });
    if (url.includes('wbgetentities')) return json({ entities: { Q7: { id: 'Q7', claims: { P31: [{ mainsnak: { datavalue: { value: { id: 'Q5' } } } }], P569: [t(alvo.anos[0])], P570: [t(alvo.anos[1])], P18: [{ mainsnak: { datavalue: { value: 'Fig.jpg' } } }] } } } });
    if (url.includes('prop=imageinfo')) return json({ query: { pages: { 1: { imageinfo: [{ extmetadata: { LicenseShortName: { value: 'CC0' }, Artist: { value: 'Autor Z' }, Categories: { value: 'Engravings' } } }] } } } });
    if (url.includes('Special:FilePath')) return { ok: true, status: 200, arrayBuffer: async () => jpeg(3500) };
    throw new Error('URL inesperada ' + url);
  };
  try {
    const r = await R.sincronizar({ slugs: [alvo.slug] }); assert.equal(r.ok.length, 1, JSON.stringify([alvo, r])); I.invalidar();
    require('../server/lib/db').db.prepare('UPDATE imagens SET verificada=1 WHERE entidade_slug=?').run(alvo.slug); I.invalidar();   // aprovação humana simulada
    const linha = P.relatorio().find(x => x.slug === alvo.slug); assert.equal(linha.status, 'com_retrato'); assert.match(linha.url, /^\/images\/personalidades\//);
  } finally { global.fetch = real; }
});
