'use strict';
process.env.DB_FILE = ':memory:';
const os = require('os'), path = require('path'), fs = require('fs'), zlib = require('zlib'), crypto = require('crypto');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'colecao-')); process.env.RETRATOS_DIR = path.join(tmp, 'personalidades'); process.env.IMAGENS_TRAD_DIR = path.join(tmp, 'tradicoes');
const test = require('node:test'); const assert = require('node:assert');
const { seed } = require('../server/seed'); seed(); require('../server/seed/aplicar_eixos').aplicar();
const C = require('../scripts/colecionar-imagens'); const I = require('../server/lib/imagens'); const { db } = require('../server/lib/db');

function png(w, h) { // arquivo de TESTE com ruído, gerado em memória (nunca entra no projeto)
  const chunk = (t, d) => { const b = Buffer.concat([Buffer.from(t), d]); const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const c = Buffer.alloc(4); c.writeUInt32BE(zlib.crc32(b) >>> 0); return Buffer.concat([l, b, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 0;
  const raw = Buffer.alloc((w + 1) * h); for (let y = 0; y < h; y++) crypto.randomFillSync(raw, y * (w + 1) + 1, w);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const pag = (titulo, o = {}) => ({ title: 'File:' + titulo, imageinfo: [{ mime: o.mime || 'image/png', width: o.w ?? 2000, height: 1200, thumburl: 'https://upload.wikimedia.org/thumb/' + encodeURIComponent(titulo), descriptionurl: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(titulo),
  extmetadata: { LicenseShortName: { value: o.lic || 'CC BY-SA 4.0' }, Artist: { value: o.autor ?? '<a href="x">Fulano de Tal</a>' }, ImageDescription: { value: o.desc || '' }, Categories: { value: o.cats || '' } } }] });
const T = { slug: 'bahai', nome: 'Fé Bahá’í', alt: [] };

test('consultas: núcleo do nome, parênteses e nomes alternativos, sem termos genéricos', () => {
  const q = C.consultas({ slug: 'x', nome: 'Budismo Won (Wonbulgyo)', alt: ['Won Buddhism', '원불교'] }).map(n => n.texto);
  assert.ok(q.includes('Budismo Won') && q.includes('Wonbulgyo') && q.includes('Won Buddhism') && q.includes('원불교'), q.join('|'));
  assert.deepEqual(C.consultas({ slug: 'h', nome: 'Religião tradicional Hopi', alt: [] }).map(n => n.texto), ['Hopi']);
  assert.deepEqual(C.consultas({ slug: 'r', nome: 'Igreja Ratana', alt: ['Te Haahi Rātana'] }).map(n => n.frase), ['ratana', 'te haahi ratana']);
});

test('avaliar: filtros de licença, resolução, autor, formato, marca-d’água e retrato continuam valendo', () => {
  const ok = (p, via) => C.avaliar(p, T, 'todas', via); const nao = (p, re, via) => { const r = ok(p, via); assert.equal(r.ok, false, JSON.stringify(r)); assert.match(r.motivo, re); };
  assert.equal(ok(pag('Bahá’í temple in New Delhi.png')).ok, true);
  nao(pag('Bahá’í temple.png', { lic: 'All rights reserved' }), /licença/); nao(pag('Bahá’í temple.png', { lic: 'CC BY-NC 4.0' }), /licença/);
  nao(pag('Bahá’í temple.png', { w: 500 }), /resolução/); nao(pag('Bahá’í temple.png', { autor: '' }), /autor/);
  nao(pag('Bahá’í temple.svg', { mime: 'image/svg+xml' }), /formato/); nao(pag('Bahá’í temple logo.png'), /marca|logotipo/);
  nao(pag('Portrait of a Bahá’í leader.png'), /retrato|marca/);
});

test('avaliar: relevância comprovada — sem relação, nome só na descrição e tema indefinido são recusados', () => {
  const nao = (p, re, via, t = T) => { const r = C.avaliar(p, t, 'todas', via); assert.equal(r.ok, false, JSON.stringify(r)); assert.match(r.motivo, re); };
  nao(pag('Templo genérico.png'), /sem relação/);
  nao(pag('Casa de adoração.png', { desc: 'Foto feita por um viajante da fé Bahá’í' }), /sem relação/);          // nome só na descrição, nome de uma palavra: não basta
  nao(pag('Bahá’í.png', { cats: 'Bahá’í Faith' }), /tema religioso/);                                           // nome presente, mas nada identifica o tema
  assert.equal(C.avaliar(pag('Casa de adoração.png', { cats: 'Bahá’í Faith' }), T, 'todas').ok, true);
  const r = C.avaliar(pag('Fachada.png'), T, 'todas', 'Bahá’í Faith'); assert.equal(r.ok, true); assert.match(r.evidencia, /categoria do Commons/);
  // dois nomes distintivos: basta todas as palavras no texto
  const R = { slug: 'ratana', nome: 'Igreja Ratana', alt: [] }; assert.equal(C.avaliar(pag('Ratana church interior.png'), R, 'todas').ok, true);
  // nomes curtíssimos só valem via categoria
  const W = { slug: 'won', nome: 'Budismo Won', alt: [] }; nao(pag('Won temple.png'), /sem relação/, null, W);
  assert.equal(C.avaliar(pag('Interior.png'), W, 'todas', 'Won Buddhism').ok, true);
});

/** "Commons" simulado: categorias, membros de categoria, busca de arquivos e downloads — com 429 e Retry-After opcionais. */
function commons({ erros429 = [], retryAfter = '2', log = [] } = {}) {
  let n = 0; const arquivos = {};
  const resp = (j, st = 200, h = {}) => ({ status: st, ok: st < 400, headers: { get: k => h[k.toLowerCase()] ?? null }, json: async () => j, arrayBuffer: async () => j });
  const f = async url => {
    n++; log.push(url);
    if (erros429.includes(n)) return resp({}, 429, retryAfter == null ? {} : { 'retry-after': retryAfter });
    if (url.startsWith('https://upload.wikimedia.org')) { const t = decodeURIComponent(url.split('/').pop()); return resp(arquivos[t] ||= png(900, 600)); }
    const u = new URL(url); const q = u.searchParams;
    if (q.get('list') === 'search') { const s = q.get('srsearch').replace(/"/g, ''); return resp({ query: { search: s === 'Bahá’í' ? [{ title: 'Category:Bahá’í Faith' }, { title: 'Category:Bahá’í people' }, { title: 'Category:Other' }] : [] } }); }
    if (q.get('generator') === 'categorymembers') return resp({ query: { pages: [pag('Bahá’í House of Worship Delhi.png', { cats: 'Bahá’í Faith' }), pag('Fachada anônima.png'), pag('Baixa resolução.png', { w: 400 }), pag('Sem autor.png', { autor: '' }), pag('Com direitos.png', { lic: 'Copyrighted' }), pag('Bahá’í logo.png')] } });
    if (q.get('generator') === 'search') return resp({ query: { pages: [pag('Bahá’í temple Chile.png', { cats: 'Temples' }), pag('Outra religião.png')] } });
    return resp({});
  };
  return { f, total: () => n };
}
const relogio = () => { let t = 1e6; const esperas = []; return { agora: () => t, esperar: async ms => { esperas.push(ms); t += ms; }, esperas }; };

test('coleta em lote: respeita o intervalo, só baixa o que passa nos filtros, registra NÃO verificada e guarda arquivos', async () => {
  const c = commons(); const r = relogio(); const estado = path.join(tmp, 'estado1.json');
  const rel = await C.coletar({ tradicoes: [T], f: c.f, esperar: r.esperar, agora: r.agora, intervalo: 1500, estado, por: 3 });
  assert.equal(rel.no_lote, 1); assert.ok(rel.buscas >= 3 && rel.requisicoes === c.total());
  assert.equal(rel.baixadas, 3, JSON.stringify(rel)); assert.equal(rel.integradas, 3); assert.equal(rel.encontradas, 3);
  assert.ok(rel.recusadas['resolução baixa (<800 px)'] >= 1 && rel.recusadas['autor não identificado'] >= 1);
  assert.ok(Object.keys(rel.recusadas).some(m => /licença/.test(m)) && Object.keys(rel.recusadas).some(m => /marca/.test(m)));
  assert.ok(r.esperas.length >= rel.requisicoes - 1 && r.esperas.every(ms => ms <= 1500), 'intervalo mínimo entre requisições');
  const linhas = db.prepare("SELECT * FROM imagens WHERE entidade_slug='bahai'").all(); assert.equal(linhas.length, 3);
  for (const l of linhas) { assert.equal(l.verificada, 0); assert.match(l.arquivo_url, /^\/images\/tradicoes\/bahai\//); assert.ok(l.autor && l.licenca && /^https:\/\/commons/.test(l.fonte_url)); assert.match(l.nota, /evidência/); assert.ok(fs.existsSync(path.join(process.env.IMAGENS_TRAD_DIR, l.arquivo_url.slice('/images/tradicoes/'.length)))); }
  assert.equal(linhas.find(l => /Delhi/.test(l.fonte_url)).autor, 'Fulano de Tal');
  I.invalidar(); assert.equal(I.imagensDe('tradicao', 'bahai').length, 0, 'não verificada não aparece no site');
  assert.equal(C.lerEstado(estado).tradicoes.bahai.status, 'concluida');
  db.prepare("DELETE FROM imagens WHERE entidade_slug='bahai'").run();
});

test('HTTP 429: lê Retry-After; sem ele usa espera progressiva; aumenta o intervalo; para se persistir', async () => {
  let c = commons({ erros429: [1, 3], retryAfter: '7' }); let r = relogio();
  const rel = await C.coletar({ tradicoes: [{ slug: 'bahai', nome: 'Fé Bahá’í', alt: [] }], f: c.f, esperar: r.esperar, agora: r.agora, intervalo: 1000, estado: path.join(tmp, 'e2.json'), refazer: 'todas' });
  assert.equal(rel.http429, 2); assert.ok(r.esperas.filter(ms => ms === 7000).length === 2, `esperas: ${r.esperas}`); assert.ok(rel.espera_ms >= 14000); assert.ok(rel.baixadas > 0, 'continua e conclui depois da espera');
  db.prepare("DELETE FROM imagens").run();
  // sem Retry-After: 5 s, 10 s, 20 s…
  const ctx = { f: commons({ erros429: [1, 2, 3], retryAfter: null }).f, rel: { requisicoes: 0, http429: 0, espera_ms: 0 }, lim: new C.Limitador({ intervalo: 1000, ...(r = relogio()) }) };
  await C.requisitar(ctx, 'https://commons.wikimedia.org/w/api.php?x=1'); assert.deepEqual(r.esperas.filter(ms => ms >= 5000), [5000, 10000, 20000]); assert.ok(ctx.lim.intervalo > 1000, 'intervalo aumentou após 429');
  // 429 permanente: lança ErroLimite
  const sempre = { f: async () => ({ status: 429, ok: false, headers: { get: () => null }, json: async () => ({}) }), rel: { requisicoes: 0, http429: 0, espera_ms: 0 }, lim: new C.Limitador({ intervalo: 10, ...relogio() }), maxTentativas: 2 };
  await assert.rejects(C.requisitar(sempre, 'https://x'), C.ErroLimite);
  // Retry-After enorme: não espera horas, para e pede para retomar depois
  const longo = { f: async () => ({ status: 429, ok: false, headers: { get: k => k === 'retry-after' ? '7200' : null }, json: async () => ({}) }), rel: { requisicoes: 0, http429: 0, espera_ms: 0 }, lim: new C.Limitador({ intervalo: 10, ...relogio() }) };
  await assert.rejects(C.requisitar(longo, 'https://x'), /retome mais tarde/);
});

test('limite persistente interrompe a execução e salva o andamento; retoma de onde parou', async () => {
  const estado = path.join(tmp, 'e3.json'); const trad = [{ slug: 'bahai', nome: 'Fé Bahá’í', alt: [] }, { slug: 'judaismo', nome: 'Judaísmo', alt: [] }];
  const bloqueado = { f: async () => ({ status: 429, ok: false, headers: { get: () => '1' }, json: async () => ({}) }) };
  const r1 = await C.coletar({ tradicoes: trad, ...bloqueado, ...relogio(), estado, intervalo: 10 });
  assert.match(r1.parada, /persistente/); assert.equal(r1.baixadas, 0); assert.equal(C.lerEstado(estado).tradicoes.bahai.status, 'pendente');
  const c = commons(); const r2 = await C.coletar({ tradicoes: trad, f: c.f, ...relogio(), estado, intervalo: 10 });
  assert.equal(r2.no_lote, 2); assert.equal(r2.parada, null); assert.equal(C.lerEstado(estado).tradicoes.bahai.status, 'concluida');
  db.prepare('DELETE FROM imagens').run();
});

test('lotes e retomada: processa só o lote pedido, pula as já concluídas e prioriza tradições sem imagem', async () => {
  const estado = path.join(tmp, 'e4.json'); const todas = C.carregarTradicoes().tradicoes.slice(0, 6);
  // a primeira já tem imagem verificada: deve ficar por último
  db.prepare("INSERT INTO imagens (entidade_tipo, entidade_slug, papel, arquivo_url, alt, autor, licenca, fonte_nome, fonte_url, verificada) VALUES ('tradicao', ?, 'foto', '/images/tradicoes/x/a.png', 'a', 'A', 'CC0', 'F', 'https://x.org', 1)").run(todas[0].slug);
  assert.equal(C.prioridade(todas).at(-1).slug, todas[0].slug);
  const c = { f: async () => ({ status: 200, ok: true, headers: { get: () => null }, json: async () => ({ query: {} }) }) };
  const a = await C.coletar({ tradicoes: todas, lote: 2, ...c, ...relogio(), estado, intervalo: 1 }); assert.equal(a.no_lote, 2); assert.equal(a.restantes, 4);
  const b = await C.coletar({ tradicoes: todas, lote: 2, ...c, ...relogio(), estado, intervalo: 1 }); assert.equal(b.no_lote, 2); assert.equal(b.restantes, 2);
  const slugsA = Object.keys(a.por_tradicao), slugsB = Object.keys(b.por_tradicao); assert.ok(slugsA.every(s => !slugsB.includes(s)), 'não repete tradições já processadas');
  const d = await C.coletar({ tradicoes: todas, lote: 10, ...c, ...relogio(), estado, intervalo: 1 }); assert.equal(d.no_lote, 2); assert.equal(d.restantes, 0);
  const e = await C.coletar({ tradicoes: todas, lote: 10, ...c, ...relogio(), estado, intervalo: 1 }); assert.equal(e.no_lote, 0);
  const f2 = await C.coletar({ tradicoes: todas, lote: 10, refazer: todas[1].slug, ...c, ...relogio(), estado, intervalo: 1 }); assert.equal(f2.no_lote, 1);
  db.prepare('DELETE FROM imagens').run();
});

test('duplicatas e teto: mesmo arquivo não é guardado duas vezes; --max limita os downloads; teto de requisições para a execução', async () => {
  const mesmo = png(900, 600);
  const f = async url => url.startsWith('https://upload') ? { status: 200, ok: true, headers: { get: () => null }, arrayBuffer: async () => mesmo }
    : { status: 200, ok: true, headers: { get: () => null }, json: async () => ({ query: { pages: [pag('Bahá’í temple one.png', { cats: 'Temples' }), pag('Bahá’í temple two.png', { cats: 'Temples' })] } }) };
  const rel = await C.coletar({ tradicoes: [T], f, ...relogio(), estado: path.join(tmp, 'e5.json'), intervalo: 1 });
  assert.equal(rel.baixadas, 1); assert.ok(rel.erros.some(e => /duplicata/.test(e)) || rel.recusadas[Object.keys(rel.recusadas).find(k => /duplicata/.test(k))] >= 1);
  db.prepare('DELETE FROM imagens').run();
  const c = commons(); const lim = await C.coletar({ tradicoes: [T], f: c.f, ...relogio(), estado: path.join(tmp, 'e6.json'), intervalo: 1, maxRequisicoes: 2 });
  assert.match(lim.parada, /teto/); assert.ok(lim.requisicoes <= 2);
  db.prepare('DELETE FROM imagens').run();
});

test('nada é aprovado automaticamente e lista vazia ou slug inexistente falham em voz alta', async () => {
  assert.equal(db.prepare('SELECT COUNT(*) n FROM imagens WHERE verificada=1').get().n, 0);
  await assert.rejects(C.coletar({ tradicoes: [], f: async () => { throw new Error('não deveria chamar'); } }), /lista vazia/);
  assert.throws(() => C.carregarTradicoes({ slugs: ['bahai', 'nao-existe'] }), /inexistente.*nao-existe/);
  const so = C.carregarTradicoes({ slugs: ['bahai', 'budismo'] }); assert.equal(so.tradicoes.length, 2);
});

test('regressão do "0 tradições": cópia nova do projeto (banco vazio) carrega o catálogo inteiro', () => {
  const { execFileSync } = require('child_process');
  const saida = execFileSync(process.execPath, ['--no-warnings', '-e', "const C=require('./scripts/colecionar-imagens');const c=C.carregarTradicoes();console.log(JSON.stringify({n:c.tradicoes.length,total:c.total}))"], { cwd: path.join(__dirname, '..'), env: { ...process.env, DB_FILE: path.join(tmp, 'vazio.db'), RETRATOS_DIR: path.join(tmp, 'p2') }, encoding: 'utf8' });
  assert.ok(JSON.parse(saida.trim().split('\n').pop()).total >= 336, saida);
});
