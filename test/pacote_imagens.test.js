'use strict';
process.env.DB_FILE = ':memory:';
const os = require('os'), path = require('path'), fs = require('fs'), zlib = require('zlib'), crypto = require('crypto');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pacote-'));
process.env.RETRATOS_DIR = path.join(tmp, 'ret'); process.env.IMAGENS_TRAD_DIR = path.join(tmp, 'trad');
const test = require('node:test'); const assert = require('node:assert');
const { seed } = require('../server/seed'); seed(); require('../server/seed/aplicar_eixos').aplicar();
const P = require('../server/lib/pacote_imagens'); const I = require('../server/lib/imagens'); const { db } = require('../server/lib/db');

/** PNG cinza com ruído (arquivo de TESTE gerado em memória; nunca entra no projeto). */
function png(w, h) {
  const chunk = (t, d) => { const b = Buffer.concat([Buffer.from(t), d]); const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const c = Buffer.alloc(4); c.writeUInt32BE(zlib.crc32(b) >>> 0); return Buffer.concat([l, b, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 0;
  const raw = Buffer.alloc((w + 1) * h); for (let y = 0; y < h; y++) crypto.randomFillSync(raw, y * (w + 1) + 1, w);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const slug = db.prepare('SELECT slug FROM tradicoes ORDER BY id LIMIT 1').get().slug;
const base = { entidade_tipo: 'tradicao', entidade_slug: slug, papel: 'monumento', alt: 'Fachada do templo', autor: 'Fulano de Tal', licenca: 'CC BY-SA 4.0', fonte_nome: 'Wikimedia Commons', fonte_url: 'https://commons.wikimedia.org/wiki/File:Teste.jpg' };
function pacote(linhas, arquivos) {
  const d = fs.mkdtempSync(path.join(tmp, 'p-')); for (const [n, b] of Object.entries(arquivos)) { fs.mkdirSync(path.dirname(path.join(d, n)), { recursive: true }); fs.writeFileSync(path.join(d, n), b); }
  fs.writeFileSync(path.join(d, 'manifesto.json'), JSON.stringify(linhas)); return d;
}

test('CSV: aspas, ponto e vírgula, comentários e BOM', () => {
  const r = P.lerCSV('﻿# comentário\narquivo;alt;autor\na.jpg;"Texto; com ""aspas""";Fulano\n');
  assert.deepEqual(r, [{ arquivo: 'a.jpg', alt: 'Texto; com "aspas"', autor: 'Fulano' }]);
});

test('inspeciona formato e resolução pelo conteúdo', () => {
  const i = P.inspecionar(png(900, 600)); assert.equal(i.ext, 'png'); assert.equal(i.largura, 900); assert.equal(i.altura, 600);
  assert.ok(P.inspecionar(Buffer.from('<html>403</html>'.repeat(500))).erro);
  assert.ok(P.inspecionar(png(900, 600).subarray(0, 40)).erro, 'arquivo truncado');
});

test('pacote válido: importa, copia, registra como NÃO verificada e não aparece no site', () => {
  const d = pacote([{ ...base, arquivo: 'a.png', verificada: true, conferido: true }], { 'a.png': png(900, 600) });
  const v = P.validarPacote(d); assert.equal(v.resumo.validas, 1, JSON.stringify(v.itens[0].erros)); assert.ok(v.itens[0].avisos.some(a => /ignorados/.test(a)));
  assert.equal(db.prepare('SELECT COUNT(*) n FROM imagens').get().n, 0, 'validar não altera o banco');
  const r = P.importarPacote(d); assert.equal(r.importadas, 1);
  const row = db.prepare('SELECT * FROM imagens').get(); assert.equal(row.verificada, 0); assert.match(row.arquivo_url, /^\/images\/tradicoes\//);
  assert.ok(fs.existsSync(path.join(process.env.IMAGENS_TRAD_DIR, row.arquivo_url.slice('/images/tradicoes/'.length))));
  I.invalidar(); assert.equal(I.imagensDe('tradicao', slug).length, 0, 'só aparece depois da aprovação humana');
  assert.equal(P.auditoria().quebradas.length, 0);
  db.prepare('UPDATE imagens SET verificada=1').run(); I.invalidar(); assert.equal(I.imagensDe('tradicao', slug).length, 1);
  // reinício: reimportar não desfaz a aprovação
  assert.equal(P.reimportarTradicoes(), 0); assert.equal(db.prepare('SELECT verificada v FROM imagens').get().v, 1);
  // pacote com o mesmo arquivo é recusado como duplicata do projeto
  assert.ok(P.validarPacote(d).itens[0].erros.some(e => /já existe no projeto/.test(e)));
  // reconstrução após perda do banco
  db.prepare('DELETE FROM imagens').run(); assert.equal(P.reimportarTradicoes(), 1);
  db.prepare('DELETE FROM imagens').run(); fs.rmSync(process.env.IMAGENS_TRAD_DIR, { recursive: true, force: true });
});

test('recusa: formato, resolução, duplicata, caminho, licença, entidade inexistente e metadados ausentes', () => {
  const img = png(900, 600);
  const d = pacote([
    { ...base, arquivo: 'ok.png' },
    { ...base, arquivo: 'dup.png' },                                   // duplicata de ok.png
    { ...base, arquivo: 'pequena.png' },                               // 300 px
    { ...base, arquivo: 'falsa.jpg' },                                 // texto com extensão .jpg
    { ...base, arquivo: 'ok2.png', licenca: 'Todos os direitos reservados' },
    { ...base, arquivo: 'ok3.png', entidade_slug: 'religiao-que-nao-existe' },
    { ...base, arquivo: 'ok4.png', autor: '' },
    { ...base, arquivo: '../fora.png' },
    { ...base, arquivo: 'ausente.png' },
    { ...base, arquivo: 'doc.gif' },
    { ...base, arquivo: 'ext.jpg' },                                   // conteúdo PNG com extensão .jpg
    { ...base, arquivo: 'ok5.png', fonte_url: 'http://exemplo.org/x' },
  ], { 'ok.png': img, 'dup.png': img, 'pequena.png': png(300, 200), 'falsa.jpg': Buffer.from('<html>erro</html>'.repeat(600)), 'ok2.png': png(900, 600), 'ok3.png': png(901, 600), 'ok4.png': png(902, 600), 'ok5.png': png(903, 600), 'ext.jpg': png(904, 600), 'sobra.png': png(905, 600) });
  const v = P.validarPacote(d); const e = n => v.itens.find(i => i.arquivo === n).erros.join(' | ');
  assert.equal(v.resumo.validas, 1, JSON.stringify(v.itens.map(i => [i.arquivo, i.erros])));
  assert.match(e('dup.png'), /duplicata/); assert.match(e('pequena.png'), /largura 300px/); assert.match(e('falsa.jpg'), /não é JPEG|resolução/);
  assert.match(e('ok2.png'), /licença/); assert.match(e('ok3.png'), /não existe/); assert.match(e('ok4.png'), /autor/);
  assert.match(e('../fora.png'), /inseguro/); assert.match(e('ausente.png'), /não encontrado/); assert.match(e('doc.gif'), /formato não aceito/);
  assert.match(e('ext.jpg'), /não corresponde ao conteúdo/); assert.match(e('ok5.png'), /https/);
  assert.deepEqual(v.orfaos, ['sobra.png']);
  const r = P.importarPacote(d); assert.equal(r.importadas, 1, 'só a linha válida é importada');
  assert.equal(P.importarPacote(d, { somenteValidas: false }).abortado, true);
});

test('pessoas: retrato exige tipo de representação e instituição; foto de quem morreu antes de 1839 é recusada', () => {
  const p = db.prepare("SELECT slug, vida FROM pensadores WHERE vida LIKE '%1546%' OR slug LIKE '%lutero%' LIMIT 1").get() || db.prepare('SELECT slug FROM pensadores LIMIT 1').get();
  const m = { arquivo: 'r.png', entidade_tipo: 'pensador', entidade_slug: p.slug, alt: 'Retrato', autor: 'Pintor X', licenca: 'Public domain', fonte_nome: 'Wikimedia Commons', fonte_url: 'https://commons.wikimedia.org/wiki/File:R.jpg' };
  let v = P.validarPacote(pacote([m], { 'r.png': png(500, 600) }));
  assert.ok(v.itens[0].erros.some(x => /tipo_representacao/.test(x)) && v.itens[0].erros.some(x => /instituicao/.test(x)));
  v = P.validarPacote(pacote([{ ...m, tipo_representacao: 'pintura', instituicao: 'Museu X' }], { 'r.png': png(500, 600) }));
  assert.equal(v.resumo.validas, 1, JSON.stringify(v.itens[0].erros));
  const r = P.importarPacote(pacote([{ ...m, tipo_representacao: 'pintura', instituicao: 'Museu X' }], { 'r.png': png(500, 600) }));
  assert.equal(r.importadas, 1); assert.match(r.itens[0].destino, /^\/images\/personalidades\//); assert.equal(db.prepare("SELECT verificada v FROM imagens WHERE entidade_tipo='pensador'").get().v, 0);
});

test('sem manifesto: erro claro', () => { assert.match(P.validarPacote(fs.mkdtempSync(path.join(tmp, 'v-'))).fatal, /manifesto/); });
