'use strict';
/**
 * Importação de imagens baixadas externamente ("pacote": pasta com arquivos + manifesto CSV/JSON).
 * Regras:
 *  - valida cada arquivo pelo CONTEÚDO (JPEG/PNG/WebP), lê a resolução, calcula SHA-256 e detecta duplicatas (no pacote e no projeto);
 *  - valida os metadados com as mesmas regras do cadastro (autor, licença livre, fonte https, entidade existente, retratos);
 *  - copia para public/images/tradicoes/<tipo-slug>/ (tradições, textos, regiões) ou para o armazenamento de retratos (pessoas);
 *  - registra SEMPRE com verificada=0: a aprovação é humana (painel admin → Imagens → verificar). Campos "verificada"/"conferido" do manifesto são ignorados.
 */
const fs = require('fs'); const path = require('path'); const crypto = require('crypto');
const imagens = require('./imagens'); const retratos = require('./retratos_store');
const RAIZ = path.join(__dirname, '..', '..');
const DIR_TRAD = process.env.IMAGENS_TRAD_DIR || path.join(RAIZ, 'public', 'images', 'tradicoes');
const URL_TRAD = '/images/tradicoes';
const LIM = { larguraMin: 800, larguraMinRetrato: 400, ladoMax: 12000, bytesMax: 8 * 1024 * 1024, bytesMin: 5000, proporcaoMax: 4 };
const COLUNAS = ['arquivo', 'entidade_tipo', 'entidade_slug', 'papel', 'alt', 'autor', 'licenca', 'licenca_url', 'fonte_nome', 'fonte_url', 'titulo', 'tipo_representacao', 'instituicao', 'data_acesso', 'nota'];

/** CSV simples com aspas duplas, vírgula ou ponto e vírgula; linhas iniciadas por # são comentários. */
function lerCSV(txt) {
  txt = txt.replace(/^﻿/, ''); const primeira = txt.split(/\r?\n/).find(l => l.trim() && !l.startsWith('#')) || '';
  const sep = (primeira.match(/;/g) || []).length > (primeira.match(/,/g) || []).length ? ';' : ',';
  const linhas = []; let campo = '', linha = [], aspas = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (aspas) { if (c === '"' && txt[i + 1] === '"') { campo += '"'; i++; } else if (c === '"') aspas = false; else campo += c; }
    else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; linha.push(campo); campo = ''; if (linha.some(x => x.trim()) && !String(linha[0]).trim().startsWith('#')) linhas.push(linha); linha = []; }
    else campo += c;
  }
  linha.push(campo); if (linha.some(x => x.trim()) && !String(linha[0]).trim().startsWith('#')) linhas.push(linha);
  if (!linhas.length) return [];
  const cab = linhas[0].map(x => x.trim().toLowerCase());
  return linhas.slice(1).map(l => Object.fromEntries(cab.map((k, i) => [k, (l[i] || '').trim()])));
}
function lerManifesto(pasta) {
  for (const n of ['manifesto.csv', 'manifesto.json']) {
    const p = path.join(pasta, n); if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, 'utf8');
    return { arquivo: n, itens: n.endsWith('.json') ? JSON.parse(txt) : lerCSV(txt) };
  }
  return null;
}

/** Detecta o tipo e as dimensões pelo conteúdo. Devolve { ext, largura, altura } ou { erro }. */
function inspecionar(b) {
  let ext = null;
  if (b.length >= 12) {
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ext = 'jpg';
    else if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) ext = 'png';
    else if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') ext = 'webp';
  }
  if (!ext) return { erro: 'conteúdo não é JPEG, PNG ou WebP (arquivo inválido ou página de erro)' };
  let largura, altura;
  try {
    if (ext === 'png') { largura = b.readUInt32BE(16); altura = b.readUInt32BE(20); }
    else if (ext === 'jpg') {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1]; if (m === 0xff) { i++; continue; }
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) { altura = b.readUInt16BE(i + 5); largura = b.readUInt16BE(i + 7); break; }
        i += 2 + b.readUInt16BE(i + 2);
      }
    } else {
      const t = b.subarray(12, 16).toString('latin1');
      if (t === 'VP8X') { largura = 1 + b.readUIntLE(24, 3); altura = 1 + b.readUIntLE(27, 3); }
      else if (t === 'VP8 ') { largura = b.readUInt16LE(26) & 0x3fff; altura = b.readUInt16LE(28) & 0x3fff; }
      else if (t === 'VP8L') { const x = b.readUInt32LE(21); largura = (x & 0x3fff) + 1; altura = ((x >> 14) & 0x3fff) + 1; }
    }
  } catch { /* cai no erro abaixo */ }
  const fim = b.subarray(Math.max(0, b.length - 1024));
  const completo = ext === 'png' ? fim.includes(Buffer.from('IEND')) : ext === 'jpg' ? (() => { let k = b.length; while (k > 0 && b[k - 1] === 0) k--; return b[k - 2] === 0xff && b[k - 1] === 0xd9; })() : b.readUInt32LE(4) + 8 <= b.length;
  if (!completo) return { erro: 'arquivo truncado ou incompleto (download interrompido)' };
  if (!largura || !altura) return { erro: 'não foi possível ler a resolução (arquivo corrompido ou truncado)' };
  return { ext, largura, altura };
}
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const pessoa = t => t === 'figura' || t === 'pensador';
const seguro = s => String(s).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 60);

/** SHA-256 dos arquivos já presentes no projeto (tradições + retratos). */
function hashesExistentes() {
  const m = new Map();
  const varrer = d => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) varrer(p); else if (/\.(jpe?g|png|webp)$/i.test(e.name)) m.set(sha(fs.readFileSync(p)), p.replace(RAIZ + path.sep, '')); } };
  varrer(DIR_TRAD); varrer(retratos.DIR); return m;
}

/** Valida o pacote sem alterar nada. Devolve { itens:[{linha,arquivo,erros,avisos,info}], resumo, orfaos }. */
function validarPacote(pasta) {
  const man = lerManifesto(pasta);
  if (!man) return { fatal: `Não encontrei manifesto.csv nem manifesto.json em ${pasta}.` };
  const existentes = hashesExistentes(); const vistos = new Map(); const itens = []; const usados = new Set();
  man.itens.forEach((it, k) => {
    const r = { linha: k + 2, arquivo: String(it.arquivo || ''), erros: [], avisos: [], info: {}, meta: it };
    const rel = r.arquivo.replace(/\\/g, '/');
    if (!rel) r.erros.push('coluna "arquivo" vazia');
    else if (path.isAbsolute(rel) || rel.split('/').includes('..') || /[\0]/.test(rel)) r.erros.push('caminho do arquivo inseguro (use caminho relativo dentro do pacote)');
    else if (!/\.(jpe?g|png|webp)$/i.test(rel)) r.erros.push('formato não aceito (use .jpg, .jpeg, .png ou .webp)');
    else {
      const p = path.join(pasta, rel); usados.add(path.normalize(p));
      if (!fs.existsSync(p) || !fs.statSync(p).isFile()) r.erros.push('arquivo não encontrado no pacote');
      else {
        const b = fs.readFileSync(p); r.buffer = b; r.info.bytes = b.length;
        if (b.length < LIM.bytesMin) r.erros.push('arquivo pequeno demais');
        if (b.length > LIM.bytesMax) r.erros.push('arquivo maior que 8 MB (reduza antes de importar)');
        const ins = inspecionar(b);
        if (ins.erro) r.erros.push(ins.erro);
        else {
          Object.assign(r.info, ins); r.info.sha256 = sha(b);
          const ehExt = rel.toLowerCase().match(/\.(jpe?g|png|webp)$/)[1].replace('jpeg', 'jpg');
          if (ehExt !== ins.ext) r.erros.push(`extensão .${ehExt} não corresponde ao conteúdo real (${ins.ext})`);
          const minimo = (it.papel === 'retrato' || (pessoa(String(it.entidade_tipo || '').toLowerCase()) && !it.papel)) ? LIM.larguraMinRetrato : LIM.larguraMin;
          if (ins.largura < minimo) r.erros.push(`largura ${ins.largura}px menor que o mínimo (${minimo}px)`);
          if (ins.largura > LIM.ladoMax || ins.altura > LIM.ladoMax) r.erros.push(`dimensão acima de ${LIM.ladoMax}px`);
          if (Math.max(ins.largura / ins.altura, ins.altura / ins.largura) > LIM.proporcaoMax) r.avisos.push('proporção muito alongada: verifique o recorte');
          const h = r.info.sha256;
          if (vistos.has(h)) r.erros.push(`duplicata do arquivo da linha ${vistos.get(h)} do pacote`); else vistos.set(h, r.linha);
          if (existentes.has(h)) r.erros.push(`já existe no projeto (${existentes.get(h)})`);
        }
      }
    }
    if (it.verificada || it.conferido) r.avisos.push('campos "verificada"/"conferido" são ignorados: a aprovação é feita por uma pessoa no painel admin');
    // metadados: mesmas regras do cadastro, com um URL local provisório
    const tipo = String(it.entidade_tipo || '').toLowerCase(); const slug = String(it.entidade_slug || '').trim();
    const provisoria = pessoa(tipo) ? `${retratos.URL_BASE}/${seguro(slug)}/x.jpg` : `${URL_TRAD}/${seguro(slug)}/x.jpg`;
    const meta = { ...it, entidade_tipo: tipo, entidade_slug: slug, arquivo_url: provisoria };
    if (pessoa(tipo) && !meta.papel) meta.papel = 'retrato';
    r.meta = meta; r.destinoTipo = tipo;
    for (const e of imagens.validar(meta)) r.erros.push(e.replace('arquivo_url deve ser local (/img/..., /images/personalidades/...) ou https do Wikimedia', 'caminho de destino inválido'));
    itens.push(r);
  });
  const orfaos = [];
  const varrer = (d, base = '') => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) varrer(p, base + e.name + '/'); else if (/\.(jpe?g|png|webp)$/i.test(e.name) && !usados.has(path.normalize(p))) orfaos.push(base + e.name); } };
  varrer(pasta);
  const ok = itens.filter(i => !i.erros.length).length;
  return { manifesto: man.arquivo, itens, orfaos, resumo: { total: itens.length, validas: ok, recusadas: itens.length - ok, orfaos: orfaos.length, avisos: itens.reduce((a, i) => a + i.avisos.length, 0) } };
}

// ---- armazenamento de imagens de tradições / textos / regiões, com manifesto para reconstrução após --reset ----
const MANIF_TRAD = () => path.join(DIR_TRAD, 'manifest.json');
const { lerJSON, gravarJSON } = require('./json_seguro');
const lerManifTrad = () => lerJSON(MANIF_TRAD(), []);
const gravarManifTrad = l => gravarJSON(MANIF_TRAD(), l);
function armazenarTrad(tipo, slug, buffer, ext) {
  const pasta = tipo === 'tradicao' ? seguro(slug) : `_${tipo}-${seguro(slug)}`; const dir = path.join(DIR_TRAD, pasta); fs.mkdirSync(dir, { recursive: true });
  const h = sha(buffer); const nome = `${seguro(slug)}-${h.slice(0, 10)}.${ext}`; fs.writeFileSync(path.join(dir, nome), buffer);
  return { url: `${URL_TRAD}/${pasta}/${nome}`, sha256: h };
}

/** Importa as linhas válidas. Registra tudo com verificada=0. Linhas inválidas são relatadas e não importadas. */
function importarPacote(pasta, { somenteValidas = true } = {}) {
  const v = validarPacote(pasta); if (v.fatal) return v;
  if (!somenteValidas && v.resumo.recusadas) return { ...v, importadas: 0, abortado: true };
  let importadas = 0; const manif = lerManifTrad();
  for (const r of v.itens) {
    if (r.erros.length) continue;
    const m = { ...r.meta, verificada: false }; delete m.arquivo; delete m.conferido;
    m.data_acesso = m.data_acesso || new Date().toISOString().slice(0, 10);
    let url;
    if (pessoa(m.entidade_tipo)) { const a = retratos.armazenar(m.entidade_slug, r.buffer); url = a.url; }
    else url = armazenarTrad(m.entidade_tipo, m.entidade_slug, r.buffer, r.info.ext).url;
    m.arquivo_url = url; m.nota = [m.nota, `Importada de pacote externo (${r.info.largura}×${r.info.altura}px, sha256 ${r.info.sha256.slice(0, 12)}); aguardando verificação humana.`].filter(Boolean).join(' ');
    imagens.cadastrar(m);
    const rec = { ...m, sha256: r.info.sha256, verificada: false };
    if (pessoa(m.entidade_tipo)) retratos.registrarNoManifesto(rec);
    else { const i = manif.findIndex(x => x.arquivo_url === url && x.entidade_slug === m.entidade_slug); if (i >= 0) manif[i] = rec; else manif.push(rec); }
    r.importada = true; r.destino = url; importadas++;
  }
  if (manif.length) gravarManifTrad(manif);
  imagens.invalidar();
  return { ...v, importadas };
}

/** Reconstrói no banco (após --reset) as imagens de tradições guardadas localmente. Não sobrescreve registros já existentes, para não desfazer uma aprovação humana feita no painel. */
const existe = r => !!require('./db').db.prepare('SELECT 1 FROM imagens WHERE entidade_tipo=? AND entidade_slug=? AND arquivo_url=?').get(r.entidade_tipo, r.entidade_slug, r.arquivo_url);
let ultimaRestauracao = null;
function reimportarTradicoes() {
  const r = { restauradas: 0, jaExistiam: 0, removidas: 0, arquivoAusente: 0, slugDesconhecido: [], rejeitadas: [] };
  const slugsOk = new Set(require('./db').db.prepare('SELECT slug FROM tradicoes').all().map(x => x.slug));
  for (const m of lerManifTrad()) {
    if (m.removida) { r.removidas++; continue; }
    if (!fs.existsSync(path.join(DIR_TRAD, m.arquivo_url.slice(URL_TRAD.length + 1)))) { r.arquivoAusente++; continue; }
    const { sha256, ...rec } = m;
    if (rec.entidade_tipo === 'tradicao' && !slugsOk.has(rec.entidade_slug)) { r.slugDesconhecido.push(rec.entidade_slug); continue; }
    try { if (existe(rec)) { r.jaExistiam++; continue; } imagens.cadastrar(rec); r.restauradas++; }
    catch (e) { r.rejeitadas.push({ slug: rec.entidade_slug, arquivo: rec.arquivo_url, erro: e.message }); }
  }
  imagens.invalidar(); ultimaRestauracao = r;
  return r.restauradas;
}
const relatorioRestauracao = () => ultimaRestauracao;

/** Estado geral: totais por situação e arquivos do manifesto ausentes ou inválidos. */
function auditoria() {
  const db = require('./db').db; const rows = db.prepare('SELECT id,entidade_tipo,entidade_slug,arquivo_url,verificada FROM imagens').all();
  const locais = rows.filter(r => !/^https?:/.test(r.arquivo_url)); const quebradas = [];
  for (const r of locais) {
    const p = r.arquivo_url.startsWith(URL_TRAD) ? path.join(DIR_TRAD, r.arquivo_url.slice(URL_TRAD.length + 1)) : r.arquivo_url.startsWith(retratos.URL_BASE) ? retratos.caminhoDe(r.arquivo_url) : null;
    if (!p || !fs.existsSync(p) || inspecionar(fs.readFileSync(p)).erro) quebradas.push(r);
  }
  return { total: rows.length, verificadas: rows.filter(r => r.verificada).length, pendentes: rows.filter(r => !r.verificada).length, locais: locais.length, quebradas };
}

/** Persiste no manifesto (tradições ou personalidades) uma decisão tomada no painel — aprovação ou remoção —, para que ela sobreviva à perda do banco. Não apaga arquivos. */
function marcarNoManifesto(row, patch) {
  if (!row || /^https?:/.test(row.arquivo_url || '')) return false;
  const trad = row.arquivo_url.startsWith(URL_TRAD + '/');
  const pess = row.arquivo_url.startsWith(retratos.URL_BASE + '/');
  if (!trad && !pess) return false;
  const l = trad ? lerManifTrad() : retratos.lerManifesto();
  const i = l.findIndex(x => x.arquivo_url === row.arquivo_url && x.entidade_slug === row.entidade_slug);
  if (i < 0) return false;
  l[i] = { ...l[i], ...patch };
  if (trad) gravarManifTrad(l); else retratos.gravarManifesto(l);
  return true;
}

/** Auditoria estendida: cruza manifestos, arquivos em disco e banco. Só lê. */
function auditoriaCompleta() {
  const base = auditoria();
  const arquivos = [];
  const varrer = (dir, urlBase) => { if (!fs.existsSync(dir)) return; for (const d of fs.readdirSync(dir, { withFileTypes: true })) { if (!d.isDirectory()) continue; for (const f of fs.readdirSync(path.join(dir, d.name))) if (/\.(jpe?g|png|webp|gif|tiff?)$/i.test(f) && !/-(sm|mini)\./.test(f)) arquivos.push(`${urlBase}/${d.name}/${f}`); } };
  varrer(DIR_TRAD, URL_TRAD); varrer(retratos.DIR, retratos.URL_BASE);
  const man = []; let manifestoErro = null;
  try { man.push(...lerManifTrad().map(r => ({ ...r, _t: 'tradicao' }))); man.push(...retratos.lerManifesto().map(r => ({ ...r, _t: 'pessoa' }))); } catch (e) { manifestoErro = e.message; }
  const noDisco = new Set(arquivos), noManif = new Set(man.map(r => r.arquivo_url));
  const caminho = u => u.startsWith(URL_TRAD + '/') ? path.join(DIR_TRAD, u.slice(URL_TRAD.length + 1)) : retratos.caminhoDe(u);
  const manifSemArquivo = man.filter(r => !r.removida && !fs.existsSync(caminho(r.arquivo_url))).map(r => r.arquivo_url);
  const orfaos = arquivos.filter(u => !noManif.has(u));
  const db = require('./db').db;
  const verificadasSemArquivo = base.quebradas.filter(r => r.verificada).length;
  const emDisco = /^\/images\/tradicoes\//;
  const slugsCat = new Set(db.prepare('SELECT slug FROM tradicoes').all().map(x => x.slug));
  const manifTrad = man.filter(r => r._t === 'tradicao' && r.entidade_tipo === 'tradicao');
  const slugsManif = new Set(manifTrad.map(r => r.entidade_slug));
  return { ...base, manifestoErro, catalogo: { tradicoes: slugsCat.size, slugsNoManifesto: slugsManif.size, slugsDoManifestoForaDoCatalogo: [...slugsManif].filter(x => !slugsCat.has(x)).slice(0, 20), tradicoesSemImagemNoManifesto: [...slugsCat].filter(x => !slugsManif.has(x)).length },
    restauracao: ultimaRestauracao,
    manifesto: { total: man.length, tradicoes: man.filter(r => r._t === 'tradicao').length, personalidades: man.filter(r => r._t === 'pessoa').length, removidas: man.filter(r => r.removida).length, comArquivo: man.filter(r => !r.removida).length - manifSemArquivo.length, semArquivo: manifSemArquivo.length },
    arquivosEmDisco: arquivos.length, arquivosTradicoes: arquivos.filter(u => emDisco.test(u)).length, orfaosSemRegistro: orfaos.length,
    verificadasSemArquivo, amostraSemArquivo: manifSemArquivo.slice(0, 10), amostraOrfaos: orfaos.slice(0, 10),
    tradicoesComImagem: new Set(db.prepare("SELECT entidade_slug s FROM imagens WHERE entidade_tipo='tradicao'").all().map(r => r.s)).size };
}
/** Guarda uma imagem de tradição já baixada (coleta automática): valida, evita duplicata, copia, registra como NÃO verificada e atualiza o manifesto. */
function salvarImagemTrad(meta, buffer, hashes = null) {
  const ins = inspecionar(buffer); if (ins.erro) throw new Error(ins.erro);
  if (ins.largura < LIM.larguraMin) throw new Error(`largura ${ins.largura}px menor que o mínimo (${LIM.larguraMin}px)`);
  const h = sha(buffer); const conhecidos = hashes || hashesExistentes();
  if (conhecidos.has(h)) throw new Error('duplicata: arquivo idêntico já existe no projeto');
  const a = armazenarTrad('tradicao', meta.entidade_slug, buffer, ins.ext);
  const rec = { ...meta, entidade_tipo: 'tradicao', arquivo_url: a.url, verificada: false, data_acesso: meta.data_acesso || new Date().toISOString().slice(0, 10) };
  try { imagens.cadastrar(rec); } catch (e) { try { fs.unlinkSync(path.join(DIR_TRAD, a.url.slice(URL_TRAD.length + 1))); } catch { /* ignora */ } throw e; }
  const manif = lerManifTrad(); manif.push({ ...rec, sha256: h }); gravarManifTrad(manif);
  conhecidos.set(h, a.url); imagens.invalidar();
  return { url: a.url, largura: ins.largura, altura: ins.altura, ext: ins.ext, sha256: h, bytes: buffer.length };
}
module.exports = { salvarImagemTrad, hashesExistentes, LIM, COLUNAS, lerCSV, inspecionar, validarPacote, importarPacote, reimportarTradicoes, relatorioRestauracao, auditoria, auditoriaCompleta, marcarNoManifesto, DIR_TRAD };
