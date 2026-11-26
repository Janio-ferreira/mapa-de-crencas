'use strict';
/**
 * Armazenamento local dos retratos: public/images/personalidades/<slug>/<slug>-<hash>.<ext> (+ miniatura "-sm").
 * - valida o arquivo pelo conteúdo (assinatura JPEG/PNG/WebP, tamanho mínimo/máximo), não pela extensão;
 * - evita duplicatas por SHA-256 (o mesmo arquivo nunca é gravado duas vezes);
 * - mantém manifest.json com créditos e licenças, para reconstruir o banco após um --reset ou em outra máquina.
 */
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const DIR = process.env.RETRATOS_DIR || path.join(__dirname, '..', '..', 'public', 'images', 'personalidades');
const MANIFESTO = path.join(DIR, 'manifest.json');
const URL_BASE = '/images/personalidades';

function tipoDoBuffer(b) {
  if (!Buffer.isBuffer(b) || b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}
function validarBuffer(b) {
  const ext = tipoDoBuffer(b);
  if (!ext) return { erro: 'conteúdo não é JPEG, PNG ou WebP (arquivo inválido ou página de erro)' };
  if (b.length < 2000) return { erro: 'arquivo pequeno demais para ser um retrato' };
  if (b.length > 8 * 1024 * 1024) return { erro: 'arquivo grande demais (>8 MB)' };
  return { ext };
}
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const seguro = s => String(s).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 60);

/** Grava a imagem (e a miniatura opcional). Devolve { url, miniatura, sha256, duplicada }. */
function armazenar(slug, buffer, miniaturaBuffer) {
  const v = validarBuffer(buffer); if (v.erro) throw new Error(v.erro);
  const s = seguro(slug); const dir = path.join(DIR, s); fs.mkdirSync(dir, { recursive: true });
  const h = sha(buffer); const nome = `${s}-${h.slice(0, 10)}.${v.ext}`;
  const existente = fs.readdirSync(dir).find(f => f === nome);
  if (!existente) fs.writeFileSync(path.join(dir, nome), buffer);
  let mini = null;
  if (miniaturaBuffer && !validarBuffer(miniaturaBuffer).erro) {
    const vm = validarBuffer(miniaturaBuffer); const nm = `${s}-${h.slice(0, 10)}-sm.${vm.ext}`;
    if (!fs.existsSync(path.join(dir, nm))) fs.writeFileSync(path.join(dir, nm), miniaturaBuffer);
    mini = `${URL_BASE}/${s}/${nm}`;
  }
  return { url: `${URL_BASE}/${s}/${nome}`, miniatura: mini, sha256: h, duplicada: !!existente };
}
const caminhoDe = url => path.join(DIR, url.slice(URL_BASE.length + 1));

function lerManifesto() { try { return JSON.parse(fs.readFileSync(MANIFESTO, 'utf8')); } catch { return []; } }
function gravarManifesto(lista) { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(MANIFESTO, JSON.stringify(lista, null, 2)); }
function registrarNoManifesto(rec) {
  const l = lerManifesto().filter(x => !(x.entidade_slug === rec.entidade_slug && x.arquivo_url === rec.arquivo_url));
  l.push(rec); gravarManifesto(l);
}
/** Confere os arquivos do manifesto: existem e têm conteúdo válido. */
function verificarArquivos() {
  const ok = [], invalidos = [];
  for (const r of lerManifesto()) {
    try { const b = fs.readFileSync(caminhoDe(r.arquivo_url)); const v = validarBuffer(b); (v.erro ? invalidos.push({ ...r, erro: v.erro }) : ok.push(r)); }
    catch { invalidos.push({ ...r, erro: 'arquivo ausente' }); }
  }
  return { ok, invalidos };
}
/** Recria no banco os registros do manifesto cujos arquivos locais são válidos. */
function reimportar() {
  const imagens = require('./imagens'); const { ok } = verificarArquivos(); let n = 0;
  for (const r of ok) { try { const { sha256, ...rec } = r; imagens.cadastrar(rec); n++; } catch { /* personalidade removida do catálogo */ } }
  imagens.invalidar(); return n;
}
module.exports = { DIR, URL_BASE, validarBuffer, armazenar, lerManifesto, registrarNoManifesto, verificarArquivos, reimportar, caminhoDe };
