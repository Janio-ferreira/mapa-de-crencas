#!/usr/bin/env node
'use strict';
/**
 * Coleta de imagens das tradições no Wikimedia Commons, em LOTES PEQUENOS e RETOMÁVEIS, respeitando os limites da API.
 *
 *   node --no-warnings scripts/colecionar-imagens.js                 # próximo lote (10 tradições, as sem imagem primeiro)
 *   node --no-warnings scripts/colecionar-imagens.js --lote 20 --max 40
 *   node --no-warnings scripts/colecionar-imagens.js --slugs hopi,ratana      # só estas
 *   node --no-warnings scripts/colecionar-imagens.js --status                 # andamento (não usa a internet)
 *   node --no-warnings scripts/colecionar-imagens.js --refazer hopi           # (ou --refazer todas) reprocessa
 * Opções: --por 3 (imagens por tradição) · --categorias locais,simbolos,escrituras,cerimonias,arte · --intervalo 1500 (ms entre requisições)
 *         --max-requisicoes 300 (teto por execução) · --estado data/coleta-estado.json
 *
 * Controle de frequência: uma requisição por vez, com intervalo mínimo (padrão 1,5 s). HTTP 429/503 e "maxlag": lê Retry-After e espera;
 * sem ele, espera progressiva (5, 10, 20, 40… s). Cada 429 também aumenta o intervalo. Se o limite persistir, a execução PARA e salva o andamento.
 * Relevância: só aceita imagem com relação comprovada com a tradição (categoria do Commons com o nome da tradição, ou o nome no título/categorias do arquivo).
 * Filtros mantidos: JPEG/PNG/WebP, largura ≥ 800 px, licença livre (domínio público, CC0, CC BY, CC BY-SA), autor identificado,
 * sem marca-d'água/logotipo/mapa/bandeira/diagrama/retrato, sem duplicatas (SHA-256, inclusive contra o projeto).
 * NENHUMA imagem é aprovada automaticamente: tudo entra com verificada=0 e só aparece no site após conferência humana no painel admin.
 */
const fs = require('fs'); const path = require('path');
const UA = 'MapaDeCrencas/1.1 (projeto educacional; coleta em lotes com verificação humana; contato: ver repositório)';
const API = 'https://commons.wikimedia.org/w/api.php';
const CATEGORIAS = {
  locais: { papel: 'monumento', re: /\b(temple|templo|church|igreja|mosque|mesquita|synagogue|sinagoga|shrine|santuario|cathedral|catedral|monastery|mosteiro|pagoda|gurdwara|chapel|capela|basilica|sanctuary|kiva|meetinghouse|longhouse|casa longa|mandir|vihara|stupa|abbey|exterior|interior|facade|fachada|building|edificio)\b/ },
  escrituras: { papel: 'capa', re: /\b(manuscript|manuscrito|scripture|escritura|codex|bible|biblia|quran|coran|sutra|torah|talmud|gospel|evangelho|book of|livro|hymnal|prayer book|text)\b/ },
  simbolos: { papel: 'simbolo', re: /\b(symbol|simbolo|emblem|emblema|seal|selo|amulet|amuleto|altar|ritual object|objeto|mask|mascara|talisman|rosary|rosario|icon|icone)\b/ },
  cerimonias: { papel: 'foto', re: /\b(ceremony|cerimonia|festival|ritual|procession|procissao|celebration|celebracao|service|culto|pilgrimage|peregrinacao|dance|danca|prayer|oracao|worship|adoracao|mass|missa|baptism|batismo|meeting|gathering|sacrifice|oferenda)\b/ },
  arte: { papel: 'foto', re: /\b(art|arte|painting|pintura|sculpture|escultura|mural|fresco|architecture|arquitetura|relief|relevo|statue|estatua|mosaic|mosaico|stained glass|vitral)\b/ },
};
const RECUSAR = /watermark|marca d.?agua|\blogo\b|logotype|\bmap\b|mapa de|flag of|bandeira|diagram|chart|screenshot|stock photo|ai[- ]generated|\bportrait\b|\bretrato\b|headshot|self[- ]portrait/i;
const LICENCA_OK = /^(public domain|pd[- ]|cc0|cc[- ]by(-sa)?[- ]\d\.\d)/i;
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const lim = s => ` ${norm(s).replace(/['’ʻʼʿ`]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
const limpa = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
const seguro = s => String(s).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 60);
const GENERICAS = new Set(['igreja', 'movimento', 'religiao', 'tradicao', 'escola', 'ordem', 'culto', 'fe', 'como', 'antiga', 'antigo', 'crista', 'cristao', 'ortodoxa', 'nova', 'novo', 'igrejas', 'caminho', 'sociedade', 'comunidade', 'tradicional', 'espiritual', 'historica', 'historico', 'de', 'da', 'do', 'das', 'dos', 'e', 'the', 'of', 'and', 'church', 'religion', 'movement', 'faith', 'tradition', 'catolica', 'catolico']);
const palavras = s => lim(s).split(' ').filter(Boolean);
const distintivas = s => palavras(s).filter(w => w.length >= 3 && !GENERICAS.has(w));

/** Nomes de consulta da tradição: núcleo do nome (sem termos genéricos), conteúdo entre parênteses, nomes alternativos/originais. Máx. 5. */
function consultas(t) {
  const brutos = []; const nome = String(t.nome || '');
  brutos.push(nome.replace(/\(.*?\)/g, ' '));
  for (const m of nome.matchAll(/\(([^)]*)\)/g)) m[1].split(/[,;/]/).forEach(x => brutos.push(x));
  for (const a of t.alt || []) { const s = String(a); brutos.push(s.replace(/\(.*?\)/g, ' ')); for (const m of s.matchAll(/\(([^)]*)\)/g)) m[1].split(/[,;/]/).forEach(x => brutos.push(x)); }
  const vistos = new Set(); const out = [];
  for (const b of brutos) {
    const ws = b.trim().split(/\s+/).filter(Boolean); while (ws.length && GENERICAS.has(norm(ws[0]).replace(/[^a-z]/g, ''))) ws.shift(); while (ws.length > 1 && GENERICAS.has(norm(ws[ws.length - 1]).replace(/[^a-z]/g, ''))) ws.pop();
    const core = ws.join(' ').replace(/^[“"'‘]+|[”"'’]+$/g, '').trim(); const f = lim(core).trim();
    if (f.length < 3 || vistos.has(f)) continue; vistos.add(f);
    out.push({ texto: core, frase: f, palavras: distintivas(core) });
  }
  return out.slice(0, 5);
}
/** Compatibilidade: palavras distintivas de todos os nomes da tradição. */
function nomesDe(t) { const s = new Set(); for (const c of consultas(t)) c.palavras.forEach(w => s.add(w)); return [...s]; }

function classificar(texto) { const x = lim(texto); for (const [k, v] of Object.entries(CATEGORIAS)) if (v.re.test(x)) return k; return 'outro'; }
const CAT_RUIM = /\b(people|persons|portraits?|births|deaths|politicians|musicians|footballers|actors|surname|family names?|given names?|writers|authors|photographers)\b/i;

/**
 * Avalia uma página do Commons (prop=imageinfo). viaCategoria = título da categoria da tradição de onde o arquivo veio (ou null).
 * Devolve { ok, motivo, evidencia, registro }.
 */
function avaliar(pag, tradicao, categoria, viaCategoria = null) {
  const ii = pag.imageinfo?.[0]; if (!ii) return { ok: false, motivo: 'sem dados do arquivo' };
  const em = ii.extmetadata || {}; const val = k => limpa(em[k]?.value);
  if (!/^image\/(jpeg|png|webp)$/.test(ii.mime || '')) return { ok: false, motivo: `formato ${ii.mime}` };
  if ((ii.width || 0) < 800) return { ok: false, motivo: 'resolução baixa (<800 px)' };
  const lic = val('LicenseShortName'); if (!LICENCA_OK.test(lic)) return { ok: false, motivo: `licença não livre ou desconhecida: ${lic || '—'}` };
  const autor = val('Artist') || val('Credit'); if (!autor) return { ok: false, motivo: 'autor não identificado' };
  const titulo = pag.title.replace(/^File:/, '').replace(/\.\w+$/, ''); const desc = val('ImageDescription'); const cats = val('Categories').replace(/\|/g, ' ; ');
  if (RECUSAR.test(`${titulo} ${desc} ${cats}`)) return { ok: false, motivo: 'marca-d\'água, logotipo, mapa, bandeira, diagrama ou retrato de pessoa' };
  const tc = lim(`${titulo} ${cats}`); const todo = lim(`${titulo} ${desc} ${cats}`); const toks = new Set(todo.trim().split(' '));
  const classe = classificar(`${titulo} ${desc} ${cats}`); const nomes = consultas(tradicao);
  let evidencia = null;
  if (viaCategoria) evidencia = `categoria do Commons "${viaCategoria}"`;
  else for (const n of nomes) {
    if (n.frase.length < 4) continue;                                   // nomes curtíssimos ("won", "ifa") só valem via categoria
    if (tc.includes(` ${n.frase} `)) { evidencia = `nome "${n.texto}" no título ou nas categorias do arquivo`; break; }
    if (n.palavras.length >= 2 && n.palavras.every(w => toks.has(w))) { evidencia = `palavras do nome "${n.texto}" no título, descrição ou categorias`; break; }
  }
  if (!evidencia) return { ok: false, motivo: 'sem relação comprovada: o nome da tradição não aparece no título/categorias e o arquivo não vem de uma categoria da tradição' };
  if (!viaCategoria && classe === 'outro') return { ok: false, motivo: 'tema religioso não identificável no título, descrição ou categorias' };
  if (categoria && categoria !== 'todas' && classe !== categoria && !(classe === 'outro' && viaCategoria)) return { ok: false, motivo: `fora das categorias pedidas (${classe})` };
  const cl = classe === 'outro' ? 'arte' : classe;
  return { ok: true, evidencia, classe: cl, registro: {
    entidade_tipo: 'tradicao', entidade_slug: tradicao.slug, papel: CATEGORIAS[cl].papel, categoria: cl,
    origem_url: ii.thumburl || ii.url, titulo, alt: (desc || titulo).slice(0, 220), autor: autor.slice(0, 200), licenca: lic,
    licenca_url: val('LicenseUrl') || null, fonte_nome: 'Wikimedia Commons', fonte_url: ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(pag.title)}`,
    largura: ii.width, altura: ii.height, _pontos: viaCategoria ? 3 : /nome ".*" no título/.test(evidencia) ? 2 : 1 } };
}

// ---------- controle de frequência ----------
class ErroLimite extends Error {}
class Limitador {
  constructor({ intervalo = 1500, esperar = ms => new Promise(r => setTimeout(r, ms)), agora = Date.now } = {}) { this.base = this.intervalo = intervalo; this.esperar = esperar; this.agora = agora; this.ultimo = -Infinity; this.ok = 0; }
  async aguardar() { const dt = this.agora() - this.ultimo; if (dt < this.intervalo) await this.esperar(this.intervalo - dt); this.ultimo = this.agora(); }
  penalizar() { this.intervalo = Math.min(this.intervalo * 1.5, 15000); this.ok = 0; }
  sucesso() { if (++this.ok >= 20 && this.intervalo > this.base) { this.intervalo = Math.max(this.base, this.intervalo * 0.9); this.ok = 0; } }
}
function lerRetryAfter(r, agora) {
  const v = r.headers?.get?.('retry-after'); if (v == null || v === '') return null;
  if (/^\d+(\.\d+)?$/.test(String(v).trim())) return Math.round(parseFloat(v) * 1000);
  const d = Date.parse(v); return Number.isFinite(d) ? Math.max(0, d - agora()) : null;
}
/** Requisição única com tratamento de 429/503/maxlag. Lança ErroLimite se o limite persistir ou o Retry-After for longo demais. */
async function requisitar(ctx, url, binario = false) {
  const { lim: L, rel, f } = ctx; const MAX = ctx.maxTentativas ?? 5; const TETO = ctx.tetoEspera ?? 600000;
  let falhasRede = 0;
  for (let t = 0; t <= MAX; t++) {
    if (ctx.maxRequisicoes && rel.requisicoes >= ctx.maxRequisicoes) throw new ErroLimite(`teto de ${ctx.maxRequisicoes} requisições por execução atingido`);
    await L.aguardar(); rel.requisicoes++;
    let r;
    try { r = await f(url, { headers: { 'user-agent': UA, 'accept-encoding': 'gzip' }, signal: AbortSignal.timeout(45000) }); }
    catch (e) { if (++falhasRede > 2) throw e; await L.esperar(3000 * falhasRede); t--; continue; }
    let espera = null; let motivo = null;
    if (r.status === 429 || r.status === 503) { motivo = `HTTP ${r.status}`; espera = lerRetryAfter(r, L.agora); }
    else if (!r.ok) throw new Error(`HTTP ${r.status}`);
    let j = null;
    if (!motivo) {
      if (binario) { L.sucesso(); return Buffer.from(await r.arrayBuffer()); }
      j = await r.json();
      if (j?.error?.code === 'maxlag') { motivo = 'maxlag'; espera = lerRetryAfter(r, L.agora) ?? 5000; }
      else { L.sucesso(); return j; }
    }
    rel.http429++; L.penalizar();
    const ms = espera ?? Math.min(300000, 5000 * 2 ** t);
    if (ms > TETO) throw new ErroLimite(`${motivo}: o servidor pediu ${Math.round(ms / 1000)} s de espera; retome mais tarde`);
    rel.espera_ms += ms; ctx.log?.(`  ⏳ ${motivo}: aguardando ${Math.round(ms / 1000)} s (tentativa ${t + 1}/${MAX + 1}; intervalo agora ${Math.round(L.intervalo)} ms)`);
    await L.esperar(ms);
  }
  throw new ErroLimite(`limite do servidor persistente após ${MAX + 1} tentativas`);
}

// ---------- buscas ----------
const IIP = 'prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1000&iiextmetadatafilter=LicenseShortName|LicenseUrl|Artist|Credit|ImageDescription|Categories';
const base = '?format=json&formatversion=2&maxlag=5&';
const paginas = j => { const p = j.query?.pages; return Array.isArray(p) ? p : Object.values(p || {}); };
async function categoriasDe(ctx, nome) { ctx.rel.buscas++; const j = await requisitar(ctx, `${API}${base}action=query&list=search&srnamespace=14&srlimit=8&srsearch=${encodeURIComponent('"' + nome.texto + '"')}`); return (j.query?.search || []).map(x => x.title).filter(t => { const c = lim(t.replace(/^Category:/, '')); return c.includes(` ${nome.frase} `) && !CAT_RUIM.test(t); }); }
async function arquivosDaCategoria(ctx, cat) { ctx.rel.buscas++; return paginas(await requisitar(ctx, `${API}${base}action=query&generator=categorymembers&gcmtype=file&gcmlimit=40&gcmtitle=${encodeURIComponent(cat)}&${IIP}`)); }
async function buscarArquivos(ctx, nome, extra = '') { ctx.rel.buscas++; return paginas(await requisitar(ctx, `${API}${base}action=query&generator=search&gsrnamespace=6&gsrlimit=20&gsrsearch=${encodeURIComponent(`"${nome.texto}"${extra ? ' ' + extra : ''} filetype:bitmap`)}&${IIP}`)); }
/** Compatibilidade: busca simples de arquivos por nome da tradição. */
async function buscar(tradicao, categoria, f = fetch) { const rel = { requisicoes: 0, buscas: 0, http429: 0, espera_ms: 0 }; const n = consultas(tradicao)[0]; return n ? buscarArquivos({ f, rel, lim: new Limitador({ intervalo: 0 }) }, n) : []; }

// ---------- estado (retomada) ----------
const ESTADO_PADRAO = path.join(__dirname, '..', 'data', 'coleta-estado.json');
const { lerJSON, gravarJSON } = require('../server/lib/json_seguro');
/** Lê o estado da coleta. Ausente → estado em branco. Corrompido → ERRO (não recomeça do zero em silêncio). */
function lerEstado(p) { const e = lerJSON(p, null); return e && typeof e === 'object' ? { versao: 1, tradicoes: {}, ...e } : { versao: 1, tradicoes: {} }; }
function gravarEstado(p, e) { gravarJSON(p, e); }
/** Títulos do Commons já usados, reconstruídos do banco (fonte_url) — vale quando o arquivo de estado se perdeu. */
function titulosDoBanco() {
  const out = new Set();
  try {
    const rows = require('../server/lib/db').db.prepare("SELECT fonte_url FROM imagens WHERE entidade_tipo='tradicao'").all();
    for (const { fonte_url: u } of rows) { const m = /commons\.wikimedia\.org\/wiki\/(File:[^?#]+)/i.exec(u || ''); if (m) { try { out.add(decodeURIComponent(m[1]).replace(/_/g, ' ')); } catch { /* ignora */ } } }
  } catch { /* banco indisponível */ }
  return out;
}
const FEITO = new Set(['concluida', 'sem_resultado']);
/** Ordena: sem nenhuma imagem → só com imagens não verificadas → já com imagem verificada; depois a ordem do catálogo. */
function prioridade(tradicoes) {
  const { db } = require('../server/lib/db'); const q = db.prepare("SELECT verificada v, COUNT(*) n FROM imagens WHERE entidade_tipo='tradicao' AND entidade_slug=? GROUP BY verificada");
  const p = t => { const r = q.all(t.slug); return r.some(x => x.v === 1) ? 2 : r.length ? 1 : 0; };
  return tradicoes.map((t, i) => ({ t, i, p: p(t) })).sort((a, b) => a.p - b.p || a.i - b.i).map(x => x.t);
}

async function processar(ctx, t, opc) {
  const r = { slug: t.slug, buscas0: ctx.rel.buscas, vistas: 0, aceitas: 0, recusadas: 0, baixadas: [], erros: [] };
  const nomes = consultas(t); const cand = new Map();           // título -> {pag, via}
  const juntar = (pags, via) => { for (const p of pags) { r.vistas++; ctx.rel.candidatos++; if (!cand.has(p.title)) cand.set(p.title, { pag: p, via }); else if (via && !cand.get(p.title).via) cand.get(p.title).via = via; } };
  const cats = [];
  for (const n of nomes.slice(0, 3)) { try { for (const c of await categoriasDe(ctx, n)) if (!cats.includes(c)) cats.push(c); } catch (e) { if (e instanceof ErroLimite) throw e; r.erros.push(`categorias "${n.texto}": ${e.message}`); } }
  for (const c of cats.slice(0, 3)) { try { juntar(await arquivosDaCategoria(ctx, c), c.replace(/^Category:/, '')); } catch (e) { if (e instanceof ErroLimite) throw e; r.erros.push(`${c}: ${e.message}`); } }
  if (cand.size < opc.por * 3) for (const n of nomes.slice(0, 2)) { try { juntar(await buscarArquivos(ctx, n), null); } catch (e) { if (e instanceof ErroLimite) throw e; r.erros.push(`arquivos "${n.texto}": ${e.message}`); } }
  const aceitas = [];
  for (const { pag, via } of cand.values()) {
    if (ctx.titulos.has(pag.title)) { ctx.recusa('já coletada anteriormente (mesmo arquivo do Commons)'); r.recusadas++; continue; }
    let a = avaliar(pag, t, 'todas', via);
    if (a.ok && opc.categorias.length < Object.keys(CATEGORIAS).length && !opc.categorias.includes(a.classe)) a = { ok: false, motivo: `fora das categorias pedidas (${a.classe})` };
    if (!a.ok) { ctx.recusa(a.motivo); r.recusadas++; continue; }
    aceitas.push({ pag, a });
  }
  r.aceitas = aceitas.length; ctx.rel.encontradas += aceitas.length;
  aceitas.sort((x, y) => y.a.registro._pontos - x.a.registro._pontos || y.a.registro.largura - x.a.registro.largura);
  const porClasse = {}; const escolhidas = [];
  for (const x of aceitas) { const c = x.a.classe; if ((porClasse[c] || 0) >= 2 || escolhidas.length >= opc.por) continue; porClasse[c] = (porClasse[c] || 0) + 1; escolhidas.push(x); }
  for (const { pag, a } of escolhidas) {
    if (ctx.rel.baixadas >= opc.max) break;
    const { categoria, largura, altura, origem_url, _pontos, ...reg } = a.registro;
    try {
      const buf = await requisitar(ctx, origem_url, true);
      const s = ctx.P.salvarImagemTrad({ ...reg, nota: `Coletada automaticamente (${categoria}; evidência: ${a.evidencia}); aguarda conferência humana da relevância. Arquivo de origem: ${origem_url}` }, buf, ctx.hashes);
      ctx.rel.baixadas++; ctx.rel.integradas++; ctx.titulos.add(pag.title); r.baixadas.push(s.url.split('/').pop());
      ctx.log?.(`  ✓ ${t.slug} [${categoria}] ${s.url} — ${reg.licenca} — ${reg.autor.slice(0, 50)}`);
    } catch (e) { if (e instanceof ErroLimite) throw e; r.erros.push(`${pag.title}: ${e.message}`); ctx.recusa(`falha ao baixar/guardar: ${e.message.slice(0, 60)}`); }
  }
  r.buscas = ctx.rel.buscas - r.buscas0; return r;
}

/**
 * Processa um LOTE de tradições (padrão 10), retomando de onde parou. Devolve o relatório da execução.
 * Opções: tradicoes (todas), lote, max (imagens por execução), por (imagens por tradição), categorias, intervalo, esperar/agora (testes), estado, refazer, maxRequisicoes, f, log.
 */
async function coletar({ tradicoes, lote = 10, max = 40, por = 3, categorias = Object.keys(CATEGORIAS), intervalo = 1500, esperar, agora, estado = ESTADO_PADRAO, refazer = null, maxRequisicoes = 300, f = fetch, log = () => {} }) {
  if (!Array.isArray(tradicoes) || !tradicoes.length) throw new Error('Nenhuma tradição para processar (lista vazia). Nada foi coletado.');
  const P = require('../server/lib/pacote_imagens');
  const est = lerEstado(estado);
  const rel = { carregadas: tradicoes.length, no_lote: 0, requisicoes: 0, buscas: 0, http429: 0, espera_ms: 0, candidatos: 0, encontradas: 0, recusadas: {}, baixadas: 0, integradas: 0, erros: [], por_tradicao: {}, parada: null, concluidas_total: 0, restantes: 0 };
  const L = new Limitador({ intervalo, ...(esperar ? { esperar } : {}), ...(agora ? { agora } : {}) });
  const ctx = { f, rel, lim: L, log, P, hashes: P.hashesExistentes(), titulos: new Set([...(est.titulos || []), ...titulosDoBanco()]), maxRequisicoes, recusa: m => { rel.recusadas[m] = (rel.recusadas[m] || 0) + 1; } };
  const refaz = refazer === 'todas' ? new Set(tradicoes.map(t => t.slug)) : new Set(refazer ? String(refazer).split(',') : []);
  const pend = prioridade(tradicoes).filter(t => refaz.has(t.slug) || !FEITO.has(est.tradicoes[t.slug]?.status));
  const fila = pend.slice(0, lote); rel.no_lote = fila.length;
  const salvar = () => { est.titulos = [...ctx.titulos]; gravarEstado(estado, est); };
  for (const t of fila) {
    if (rel.baixadas >= max) { rel.parada = `limite de ${max} imagens por execução atingido`; break; }
    log(`• ${t.slug} (${t.nome})`);
    try {
      const r = await processar(ctx, t, { por, max, categorias });
      rel.por_tradicao[t.slug] = { buscas: r.buscas, candidatos: r.vistas, encontradas: r.aceitas, recusadas: r.recusadas, baixadas: r.baixadas, erros: r.erros };
      rel.erros.push(...r.erros.map(e => `${t.slug}: ${e}`));
      est.tradicoes[t.slug] = { status: r.baixadas.length || r.aceitas ? 'concluida' : 'sem_resultado', ultima: new Date().toISOString(), buscas: r.buscas, baixadas: r.baixadas.length };
      salvar();
    } catch (e) {
      if (e instanceof ErroLimite) { rel.parada = e.message; est.tradicoes[t.slug] = { status: 'pendente', ultima: new Date().toISOString(), motivo: e.message }; salvar(); break; }
      throw e;
    }
  }
  salvar();
  rel.concluidas_total = Object.values(est.tradicoes).filter(x => FEITO.has(x.status)).length;
  rel.restantes = tradicoes.filter(t => !FEITO.has(est.tradicoes[t.slug]?.status)).length;
  require('../server/lib/imagens').invalidar(); return rel;
}

function carregarTradicoes({ slugs = null } = {}) {
  const { seed } = require('../server/seed'); seed(); require('../server/seed/aplicar_eixos').aplicar();
  const { db } = require('../server/lib/db');
  let ts = db.prepare('SELECT id, slug, nome FROM tradicoes ORDER BY id').all();
  if (!ts.length) throw new Error('O catálogo está vazio mesmo após o seed (verifique DB_FILE/DATA_DIR e rode "npm run seed").');
  const total = ts.length;
  for (const t of ts) t.alt = db.prepare('SELECT nome FROM nomes_alternativos WHERE tradicao_id=?').all(t.id).map(x => x.nome);
  if (slugs) {
    const lista = [...slugs].map(x => x.trim()).filter(Boolean); const existentes = new Set(ts.map(t => t.slug));
    const ausentes = lista.filter(x => !existentes.has(x));
    if (ausentes.length) throw new Error(`Slug(s) inexistente(s) em --slugs: ${ausentes.join(', ')}. Veja importacao/lista-de-tradicoes.csv.`);
    ts = ts.filter(t => lista.includes(t.slug));
  }
  return { tradicoes: ts, total };
}
module.exports = { titulosDoBanco, avaliar, nomesDe, consultas, classificar, coletar, carregarTradicoes, buscar, requisitar, Limitador, ErroLimite, lerEstado, prioridade, CATEGORIAS, ESTADO_PADRAO };

async function main() {
  const arg = k => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
  const num = (k, d) => { const v = arg(k); if (v == null) return d; const n = +v; if (!(n > 0)) { console.error(`✗ --${k} deve ser um número maior que zero.`); process.exit(3); } return n; };
  let carga; try { carga = carregarTradicoes({ slugs: arg('slugs') ? arg('slugs').split(',') : null }); } catch (e) { console.error('✗ ' + e.message); process.exit(3); }
  const estado = path.resolve(arg('estado') || ESTADO_PADRAO); const est = lerEstado(estado);
  const feitas = carga.tradicoes.filter(t => FEITO.has(est.tradicoes[t.slug]?.status)).length;
  console.log(`Banco: ${require('../server/lib/db').DB_FILE}\nTradições no catálogo: ${carga.total} · neste conjunto: ${carga.tradicoes.length} · já processadas: ${feitas} · faltam: ${carga.tradicoes.length - feitas}`);
  if (process.argv.includes('--status')) { const v = Object.values(est.tradicoes); console.log(JSON.stringify({ concluidas: v.filter(x => x.status === 'concluida').length, sem_resultado: v.filter(x => x.status === 'sem_resultado').length, pendentes: v.filter(x => x.status === 'pendente').length, imagens_baixadas: v.reduce((a, x) => a + (x.baixadas || 0), 0), arquivo_de_estado: estado }, null, 2)); return; }
  const lote = num('lote', 10); const max = num('max', 40); const por = num('por', 3); const intervalo = num('intervalo', 1500); const maxRequisicoes = num('max-requisicoes', 300);
  const categorias = arg('categorias') ? arg('categorias').split(',').map(s => s.trim()).filter(Boolean) : Object.keys(CATEGORIAS);
  const ruim = categorias.filter(c => !CATEGORIAS[c]); if (ruim.length) { console.error(`✗ categoria(s) inválida(s): ${ruim.join(', ')}. Use: ${Object.keys(CATEGORIAS).join(', ')}`); process.exit(3); }
  console.log(`Lote: até ${lote} tradições (as sem imagem primeiro) · até ${max} imagens · ${por} por tradição · intervalo ${intervalo} ms · teto ${maxRequisicoes} requisições\n`);
  try { await fetch(`${API}?action=query&meta=siteinfo&format=json`, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(20000) }); } catch (e) { console.error(`✗ Sem acesso ao Wikimedia Commons (${e.cause?.code || e.message}). Nada foi baixado nem registrado. Rode numa máquina com internet.`); process.exit(2); }
  let rel; try { rel = await coletar({ tradicoes: carga.tradicoes, lote, max, por, categorias, intervalo, maxRequisicoes, estado, refazer: arg('refazer'), log: console.log }); } catch (e) { console.error('✗ ' + e.message); process.exit(3); }
  const dataDir = path.join(__dirname, '..', 'data'); fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(path.join(dataDir, 'relatorio-imagens.json'), JSON.stringify(rel, null, 2));
  const rec = Object.values(rel.recusadas).reduce((a, b) => a + b, 0);
  console.log(`\nLote concluído: ${rel.no_lote} tradição(ões) · ${rel.requisicoes} requisições (${rel.buscas} buscas) · HTTP 429/503: ${rel.http429} (espera total ${Math.round(rel.espera_ms / 1000)} s)`);
  console.log(`Candidatos avaliados: ${rel.candidatos} · encontradas (aprovadas pelos filtros): ${rel.encontradas} · recusadas: ${rec} · baixadas: ${rel.baixadas} · integradas (aguardando aprovação humana): ${rel.integradas}`);
  if (rec) { console.log('Motivos das recusas:'); Object.entries(rel.recusadas).sort((a, b) => b[1] - a[1]).forEach(([m, n]) => console.log(`  ${n} × ${m}`)); }
  if (rel.erros.length) console.log(`Erros (${rel.erros.length}): ${rel.erros.slice(0, 5).join(' | ')}`);
  console.log(`Concluídas no total: ${rel.concluidas_total} · faltam ${rel.restantes}. ${rel.restantes ? 'Próximo lote: node --no-warnings scripts/colecionar-imagens.js' : 'Todas as tradições foram processadas.'}`);
  if (rel.parada) { console.error(`\n⏸ Execução interrompida: ${rel.parada}. O andamento foi salvo; rode de novo mais tarde para retomar.`); process.exit(6); }
  if (rel.no_lote === 0) { console.log('Nada a processar neste conjunto (use --refazer para reprocessar).'); return; }
  if (!rel.baixadas) { console.error('\n✗ Nenhuma imagem baixada neste lote. Veja os motivos acima; nada foi integrado.'); process.exit(5); }
}
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
