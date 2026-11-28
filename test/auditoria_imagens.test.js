'use strict';
// Garante que a pasta public/images/tradicoes devolvida ao projeto é reconhecida sem aprovar nada, e que manifestos nunca são sobrescritos em silêncio.
process.env.DB_FILE = ':memory:';
const os = require('os'), path = require('path'), fs = require('fs'), zlib = require('zlib'), crypto = require('crypto');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aud-'));
process.env.RETRATOS_DIR = path.join(tmp, 'ret'); process.env.IMAGENS_TRAD_DIR = path.join(tmp, 'trad');
const test = require('node:test'); const assert = require('node:assert');
const { seed } = require('../server/seed'); seed(); require('../server/seed/aplicar_eixos').aplicar();
const P = require('../server/lib/pacote_imagens'); const I = require('../server/lib/imagens'); const { db } = require('../server/lib/db');
const J = require('../server/lib/json_seguro');

function png(w, h) {
  const chunk = (t, d) => { const b = Buffer.concat([Buffer.from(t), d]); const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const c = Buffer.alloc(4); c.writeUInt32BE(zlib.crc32(b) >>> 0); return Buffer.concat([l, b, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 0;
  const raw = Buffer.alloc((w + 1) * h); for (let y = 0; y < h; y++) crypto.randomFillSync(raw, y * (w + 1) + 1, w);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const slugs = db.prepare('SELECT slug FROM tradicoes ORDER BY id LIMIT 4').all().map(r => r.slug);
const manifPath = path.join(process.env.IMAGENS_TRAD_DIR, 'manifest.json');
const meta = (slug, url) => ({ entidade_tipo: 'tradicao', entidade_slug: slug, papel: 'monumento', alt: 'Templo', autor: 'Fulano', licenca: 'CC BY-SA 4.0', fonte_nome: 'Wikimedia Commons', fonte_url: `https://commons.wikimedia.org/wiki/File:${slug}_x.jpg`, arquivo_url: url, data_acesso: '2026-11-27', verificada: false });

test('json_seguro: ausente → padrão; corrompido → erro e nada sobrescrito; gravação atômica com .bak', () => {
  const f = path.join(tmp, 'x', 'a.json');
  assert.deepEqual(J.lerJSON(f, []), []);
  J.gravarJSON(f, [1]); J.gravarJSON(f, [1, 2]);
  assert.deepEqual(J.lerJSON(f), [1, 2]); assert.deepEqual(JSON.parse(fs.readFileSync(f + '.bak', 'utf8')), [1]);
  assert.equal(fs.readdirSync(path.dirname(f)).filter(n => n.endsWith('.tmp')).length, 0);
  fs.writeFileSync(f, '{quebrado'); assert.throws(() => J.lerJSON(f), /corrompido/);
  assert.equal(fs.readFileSync(f, 'utf8'), '{quebrado');
});

test('pasta devolvida ao projeto: manifesto + arquivos são reconhecidos, tudo volta NÃO verificado, nada é apagado', () => {
  const registros = [];
  for (const s of slugs) for (let k = 0; k < 2; k++) {
    const buf = png(820 + k, 40); const h = crypto.createHash('sha256').update(buf).digest('hex'); const nome = `${s}-${h.slice(0, 10)}.png`;
    fs.mkdirSync(path.join(process.env.IMAGENS_TRAD_DIR, s), { recursive: true }); fs.writeFileSync(path.join(process.env.IMAGENS_TRAD_DIR, s, nome), buf);
    registros.push({ ...meta(s, `/images/tradicoes/${s}/${nome}`), sha256: h });
  }
  fs.writeFileSync(manifPath, JSON.stringify(registros));
  const antes = fs.readFileSync(manifPath, 'utf8');
  db.prepare('DELETE FROM imagens').run(); I.invalidar();
  assert.equal(P.reimportarTradicoes(), 8);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM imagens WHERE verificada=1').get().n, 0, 'nenhuma aprovação automática');
  assert.equal(P.reimportarTradicoes(), 0, 'idempotente');
  const a = P.auditoriaCompleta();
  assert.equal(a.total, 8); assert.equal(a.pendentes, 8); assert.equal(a.manifesto.total, 8); assert.equal(a.manifesto.semArquivo, 0); assert.equal(a.orfaosSemRegistro, 0); assert.equal(a.quebradas.length, 0); assert.equal(a.arquivosTradicoes, 8); assert.equal(a.tradicoesComImagem, 4);
  assert.equal(fs.readFileSync(manifPath, 'utf8'), antes, 'manifesto intocado pela reimportação');
});

test('arquivo extra sem registro aparece como órfão; entrada do manifesto sem arquivo aparece como ausente', () => {
  const s = slugs[0]; const extra = path.join(process.env.IMAGENS_TRAD_DIR, s, `${s}-zzzzzzzzzz.png`); fs.writeFileSync(extra, png(900, 40));
  let a = P.auditoriaCompleta(); assert.equal(a.orfaosSemRegistro, 1); fs.unlinkSync(extra);
  const m = J.lerJSON(manifPath); const alvo = m[0]; const p = path.join(process.env.IMAGENS_TRAD_DIR, alvo.arquivo_url.slice('/images/tradicoes/'.length)); const guarda = fs.readFileSync(p); fs.unlinkSync(p);
  a = P.auditoriaCompleta(); assert.equal(a.manifesto.semArquivo, 1); assert.equal(a.quebradas.length, 1); fs.writeFileSync(p, guarda);
  assert.equal(P.auditoriaCompleta().manifesto.semArquivo, 0);
});

test('aprovação e remoção feitas no painel persistem no manifesto e sobrevivem à perda do banco', () => {
  const rows = db.prepare("SELECT * FROM imagens WHERE entidade_tipo='tradicao' ORDER BY id").all();
  const aprovada = rows[0], removida = rows[1], intocada = rows[2];
  db.prepare('UPDATE imagens SET verificada=1 WHERE id=?').run(aprovada.id); assert.ok(P.marcarNoManifesto(aprovada, { verificada: true }));
  assert.ok(P.marcarNoManifesto(removida, { removida: true, verificada: false })); db.prepare('DELETE FROM imagens WHERE id=?').run(removida.id);
  assert.equal(P.marcarNoManifesto({ arquivo_url: 'https://x/y.jpg', entidade_slug: 'a' }, { verificada: true }), false);
  db.prepare('DELETE FROM imagens').run(); I.invalidar();
  assert.equal(P.reimportarTradicoes(), 7, 'a removida não volta');
  const g = u => db.prepare('SELECT verificada FROM imagens WHERE arquivo_url=?').get(u);
  assert.equal(g(aprovada.arquivo_url).verificada, 1); assert.equal(g(removida.arquivo_url), undefined); assert.equal(g(intocada.arquivo_url).verificada, 0);
  assert.ok(fs.existsSync(path.join(process.env.IMAGENS_TRAD_DIR, removida.arquivo_url.slice('/images/tradicoes/'.length))), 'o arquivo da removida continua em disco');
});

test('manifesto corrompido: a reimportação falha com aviso e NÃO sobrescreve o arquivo', () => {
  const bom = fs.readFileSync(manifPath, 'utf8'); fs.writeFileSync(manifPath, '[{"quebrado"');
  assert.throws(() => P.reimportarTradicoes(), /corrompido/);
  assert.throws(() => P.salvarImagemTrad({ entidade_slug: slugs[0], papel: 'foto', alt: 'a', autor: 'a', licenca: 'CC0', fonte_nome: 'a', fonte_url: 'https://commons.wikimedia.org/wiki/File:A.jpg' }, png(900, 40)), /corrompido/);
  assert.equal(fs.readFileSync(manifPath, 'utf8'), '[{"quebrado"');
  const a = P.auditoriaCompleta(); assert.match(a.manifestoErro, /corrompido/);
  fs.writeFileSync(manifPath, bom);
});

test('coleta: títulos do Commons já usados são reconstruídos do banco quando o estado se perde', () => {
  const C = require('../scripts/colecionar-imagens'); db.prepare("UPDATE imagens SET fonte_url=? WHERE id=(SELECT MIN(id) FROM imagens WHERE entidade_tipo='tradicao')").run('https://commons.wikimedia.org/wiki/File:Templo_de_Teste%20%C3%A9.jpg');
  assert.ok(C.titulosDoBanco().has('File:Templo de Teste é.jpg'));
  const est = path.join(tmp, 'estado.json'); assert.deepEqual(C.lerEstado(est).tradicoes, {}); fs.writeFileSync(est, 'lixo'); assert.throws(() => C.lerEstado(est), /corrompido/);
});

test('API do painel: paginação e filtros; aprovar/remover persiste; nunca aprova sozinho', async () => {
  const { criarApp } = require('../server/app'); const app = criarApp(); const srv = app.listen(0); const base = `http://127.0.0.1:${srv.address().port}/api/admin`;
  const H = { authorization: 'Bearer ' + app.locals.adminToken, 'content-type': 'application/json' };
  try {
    let r = await (await fetch(base + '/imagens?pagina=1&porPagina=10&situacao=pendentes', { headers: H })).json();
    assert.equal(r.itens.length, Math.min(10, r.total)); assert.equal(r.contagem.verificadas, 1); assert.ok(r.itens.every(i => !i.verificada));
    r = await (await fetch(base + '/imagens?pagina=1&q=' + slugs[1], { headers: H })).json(); assert.ok(r.itens.every(i => i.entidade_slug.includes(slugs[1])));
    const alvo = db.prepare('SELECT * FROM imagens WHERE verificada=0 ORDER BY id LIMIT 1').get();
    const p = await (await fetch(`${base}/imagens/${alvo.id}/verificar`, { method: 'PATCH', headers: H, body: JSON.stringify({ verificada: true }) })).json(); assert.equal(p.persistida, true);
    assert.equal(J.lerJSON(manifPath).find(x => x.arquivo_url === alvo.arquivo_url).verificada, true);
    await fetch(`${base}/imagens/${alvo.id}`, { method: 'DELETE', headers: H });
    assert.equal(J.lerJSON(manifPath).find(x => x.arquivo_url === alvo.arquivo_url).removida, true);
    assert.ok(fs.existsSync(path.join(process.env.IMAGENS_TRAD_DIR, alvo.arquivo_url.slice('/images/tradicoes/'.length))));
  } finally { srv.close(); }
});

test('restauração informa o que não restaurou: slug fora do catálogo e rejeitadas (nada some em silêncio)', () => {
  const m = J.lerJSON(manifPath); const s = slugs[3]; const novo = { ...m.find(x => x.entidade_slug === s), entidade_slug: 'slug-que-nao-existe', arquivo_url: '/images/tradicoes/slug-que-nao-existe/a.png' };
  fs.mkdirSync(path.join(process.env.IMAGENS_TRAD_DIR, 'slug-que-nao-existe'), { recursive: true }); fs.writeFileSync(path.join(process.env.IMAGENS_TRAD_DIR, 'slug-que-nao-existe', 'a.png'), png(900, 40));
  J.gravarJSON(manifPath, [...m, novo]); P.reimportarTradicoes();
  const r = P.relatorioRestauracao(); assert.deepEqual(r.slugDesconhecido, ['slug-que-nao-existe']); assert.equal(P.auditoriaCompleta().catalogo.slugsDoManifestoForaDoCatalogo[0], 'slug-que-nao-existe');
  J.gravarJSON(manifPath, m);
});

test('banco em pasta inexistente é criado (sem "unable to open database file")', () => {
  const d = path.join(tmp, 'a', 'b', 'c'); const r = require('child_process').spawnSync(process.execPath, ['--no-warnings', '-e', "const {db}=require('./server/lib/db');console.log(db.prepare('select 1 n').get().n)"], { cwd: path.join(__dirname, '..'), env: { ...process.env, DB_FILE: path.join(d, 'x.db') }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); assert.ok(fs.existsSync(path.join(d, 'x.db')));
});
