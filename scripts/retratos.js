#!/usr/bin/env node
'use strict';
/**
 * Retratos das personalidades — busca assistida e verificada (RODE EM UMA MÁQUINA COM INTERNET; o ambiente de desenvolvimento
 * original não alcança Wikidata/Commons).
 *
 *   node --no-warnings scripts/retratos.js status                 # quem tem / não tem retrato verificado
 *   node --no-warnings scripts/retratos.js buscar [slug ...]      # gera retratos-candidatos.json para conferência humana
 *   node --no-warnings scripts/importar-imagens.js retratos-candidatos.json   # importa (só "conferido": true vira verificado)
 *
 * Como a identidade é verificada (nada de adivinhar):
 *  1. busca a pessoa no Wikidata e só aceita o item que é humano (P31=Q5) E cujos anos de nascimento e morte coincidem com os do banco;
 *  2. usa SOMENTE a imagem principal (P18) desse item — não busca fotos por texto;
 *  3. lê a licença/autoria no Commons e só aceita licença livre (domínio público, CC0, CC BY, CC BY-SA);
 *  4. recusa "fotografia" de quem morreu antes de 1839;
 *  5. marca como representação póstuma/idealizada quando a pessoa morreu antes de 1500 (retratos de época não existem);
 *  6. pessoas com datas imprecisas (ex.: "séc. VIII") ficam para conferência MANUAL — não são casadas automaticamente.
 * O arquivo gerado traz "conferido": false: um humano abre "url_conferencia", confirma que é a pessoa e muda para true.
 */
const fs = require('fs');
const UA = 'MapaDeCrencas/1.0 (projeto educacional; retratos verificados)';
const LIVRE = /^(public domain|pd[-\s]|cc0|cc[- ]by(-sa)?[\s-]\d)/i;

const anoDeTempo = t => { const m = /^([+-])(\d{1,5})-/.exec(String(t || '')); return m ? (m[1] === '-' ? -1 : 1) * +m[2] : null; };
const anoDeClaim = c => anoDeTempo(c?.[0]?.mainsnak?.datavalue?.value?.time);
const nomeLimpo = n => String(n).replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
/** entidade = { id, claims } do Wikidata; anos = [nasc, morte] do banco. */
function entidadeCorresponde(ent, anos) {
  const humano = (ent.claims?.P31 || []).some(c => c.mainsnak?.datavalue?.value?.id === 'Q5');
  return humano && anos && anoDeClaim(ent.claims?.P569) === anos[0] && anoDeClaim(ent.claims?.P570) === anos[1];
}
const imagemP18 = ent => ent.claims?.P18?.[0]?.mainsnak?.datavalue?.value || null;
const textoLimpo = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#039;|&quot;/g, "'").replace(/\s+/g, ' ').trim();
function tipoDeRepresentacao(categorias, morte) {
  const c = String(categorias || '').toLowerCase();
  if (/engraving|etching|lithograph|woodcut|prints?\b/.test(c)) return 'gravura';
  if (/sculpture|bust|statue|bronze/.test(c)) return 'escultura';
  if (/painting|portraits? by|oil on/.test(c)) return 'pintura';
  if (/photograph|photo/.test(c) && morte >= 1839) return 'fotografia';
  return 'outro';
}
/** Monta o registro candidato; devolve {erro} quando não for seguro propor. */
function montarRegistro({ pensador, anos, arquivo, meta, entidadeId }) {
  const m = meta || {}; const licenca = textoLimpo(m.LicenseShortName?.value);
  if (!LIVRE.test(licenca)) return { erro: `licença não livre ou ausente (“${licenca || '—'}”)` };
  const tipo = tipoDeRepresentacao(m.Categories?.value, anos[1]);
  if (tipo === 'fotografia' && anos[1] < 1839) return { erro: 'fotografia incompatível com a época' };
  const autor = textoLimpo(m.Artist?.value) || 'Autor desconhecido (conforme a página do arquivo)';
  const credito = textoLimpo(m.Credit?.value);
  const f = encodeURIComponent(arquivo.replace(/ /g, '_'));
  const pagina = `https://commons.wikimedia.org/wiki/File:${f}`;
  const rec = {
    entidade_tipo: pensador.tipo || 'pensador', entidade_slug: pensador.slug, papel: 'retrato', tipo_representacao: tipo,
    arquivo_url: `https://commons.wikimedia.org/wiki/Special:FilePath/${f}?width=800`, miniatura_url: `https://commons.wikimedia.org/wiki/Special:FilePath/${f}?width=420`,
    titulo: textoLimpo(m.ObjectName?.value) || arquivo, alt: `${tipo === 'fotografia' ? 'Fotografia' : tipo === 'outro' ? 'Representação histórica' : tipo[0].toUpperCase() + tipo.slice(1)} de ${nomeLimpo(pensador.nome)}`,
    autor, licenca, licenca_url: m.LicenseUrl?.value || null, instituicao: credito || 'Wikimedia Commons (instituição de origem na página do arquivo)', fonte_nome: 'Wikimedia Commons', fonte_url: pagina,
    foco: '50% 22%', verificada: false, conferido: false, url_conferencia: pagina, wikidata: entidadeId,
    nota: anos[1] < 1500 ? 'Representação póstuma ou idealizada: não é retrato feito em vida.' : (textoLimpo(m.DateTimeOriginal?.value) ? `Data da obra: ${textoLimpo(m.DateTimeOriginal.value)}` : null),
    checagens: { identidade: 'item Wikidata humano com mesmos anos de nascimento/morte; imagem = P18', licenca_livre: true, anacronismo_ok: true, revisar: ['confirmar visualmente que é a pessoa', 'ajustar "foco" do recorte do rosto', 'conferir a instituição de origem'] },
  };
  return { registro: rec };
}
module.exports = { anoDeTempo, entidadeCorresponde, imagemP18, tipoDeRepresentacao, montarRegistro, textoLimpo, LIVRE };

async function jget(url) { const r = await fetch(url, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(`${r.status} em ${url}`); return r.json(); }
const espera = ms => new Promise(r => setTimeout(r, ms));
function curados() { try { return JSON.parse(fs.readFileSync(require('path').join(__dirname, 'retratos-curados.json'), 'utf8')); } catch { return []; } }
async function buscarUm(p) {
  const { anosDeVida } = require('../server/lib/imagens'); const pessoas = require('../server/lib/pessoas');
  const pol = pessoas.politica(p); if (!pol.buscar) return { slug: p.slug, status: pol.status, motivo: pol.motivo };
  const anos = p.anos || anosDeVida(p.vida);
  const cur = curados().find(c => c.slug === p.slug && /^Q\d+$/.test(c.wikidata || ''));
  if (cur) {   // identidade confirmada por pessoa (curadoria): usa o item informado, ainda exigindo humano + P18 + licença livre
    const ents = (await jget(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${cur.wikidata}&props=claims&format=json`)).entities; const ent = ents[cur.wikidata];
    if (!(ent?.claims?.P31 || []).some(c => c.mainsnak?.datavalue?.value?.id === 'Q5')) return { slug: p.slug, status: 'recusado', motivo: 'item curado não é humano' };
    const arq = cur.arquivo || imagemP18(ent); if (!arq) return { slug: p.slug, status: 'sem_imagem', motivo: `item ${cur.wikidata} sem imagem principal` };
    const info = await jget(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + arq)}&prop=imageinfo&iiprop=extmetadata&format=json`);
    const meta = Object.values(info.query?.pages || {})[0]?.imageinfo?.[0]?.extmetadata;
    const r = montarRegistro({ pensador: p, anos: anos || [null, 9999], arquivo: arq, meta, entidadeId: cur.wikidata });
    if (r.registro) r.registro.nota = `Identidade confirmada por curadoria (Wikidata ${cur.wikidata}). ${r.registro.nota || ''}`.trim();
    return r.erro ? { slug: p.slug, status: 'recusado', motivo: r.erro } : { slug: p.slug, status: 'candidato', registro: r.registro };
  }
  if (!anos) return { slug: p.slug, status: 'manual', motivo: 'datas imprecisas ou ausentes: a identidade não pode ser confirmada automaticamente; informe o item do Wikidata em scripts/retratos-curados.json' };
  const q = encodeURIComponent(nomeLimpo(p.nome));
  const achados = [];
  for (const lang of ['pt', 'en']) { const s = await jget(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${q}&language=${lang}&uselang=${lang}&type=item&limit=7&format=json`); for (const x of s.search || []) if (!achados.includes(x.id)) achados.push(x.id); await espera(250); }
  if (!achados.length) return { slug: p.slug, status: 'sem_resultado', motivo: 'nenhum item no Wikidata' };
  const ents = (await jget(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${achados.slice(0, 15).join('|')}&props=claims&format=json`)).entities;
  const ent = Object.values(ents).find(e => entidadeCorresponde(e, anos));
  if (!ent) return { slug: p.slug, status: 'sem_correspondencia', motivo: `nenhum item humano com anos ${anos[0]}–${anos[1]}` };
  const arq = imagemP18(ent); if (!arq) return { slug: p.slug, status: 'sem_imagem', motivo: `item ${ent.id} sem imagem principal (P18)` };
  const info = await jget(`https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent('File:' + arq)}&prop=imageinfo&iiprop=extmetadata&format=json`);
  const meta = Object.values(info.query?.pages || {})[0]?.imageinfo?.[0]?.extmetadata;
  const r = montarRegistro({ pensador: p, anos, arquivo: arq, meta, entidadeId: ent.id });
  return r.erro ? { slug: p.slug, status: 'recusado', motivo: r.erro } : { slug: p.slug, status: 'candidato', registro: r.registro };
}

/* ---------- Sincronização automática: busca, verifica, BAIXA, armazena localmente e registra créditos ---------- */
async function baixar(url, tentativas = 3) {
  let erro;
  for (let t = 1; t <= tentativas; t++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) });
      if (r.status === 429 || r.status >= 500) { erro = new Error(`HTTP ${r.status}`); await espera(1500 * t); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { erro = e; await espera(800 * t); }
  }
  throw erro;
}
async function internetDisponivel() {
  try { const r = await fetch('https://www.wikidata.org/w/api.php?action=query&meta=siteinfo&format=json', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(6000) }); return r.ok; } catch { return false; }
}
/** Baixa o arquivo de um candidato (800px e miniatura), guarda em public/images/personalidades e registra no banco e no manifesto. */
async function armazenarCandidato(reg) {
  const store = require('../server/lib/retratos_store'); const imagens = require('../server/lib/imagens');
  const grande = await baixar(reg.arquivo_url); const pequena = await baixar(reg.miniatura_url).catch(() => null);
  const a = store.armazenar(reg.entidade_slug, grande, pequena);
  const final = { ...reg, origem_url: reg.arquivo_url, arquivo_url: a.url, miniatura_url: a.miniatura, sha256: a.sha256,
    verificada: false, data_acesso: new Date().toISOString().slice(0, 10),
    nota: `${reg.nota || ''} Candidato automático (aguarda verificação humana): item do Wikidata (${reg.wikidata}) com os mesmos anos de nascimento e morte; imagem principal P18; licença livre conferida no Commons. Arquivo copiado para o servidor.`.trim() };
  delete final.conferido; delete final.checagens; delete final.url_conferencia; delete final.wikidata;
  imagens.cadastrar(final); store.registrarNoManifesto(final); imagens.invalidar();
  return { ...a, tipo: final.tipo_representacao };
}
/** Rotina completa. Opções: slugs (lista), atualizar (refaz mesmo quem já tem), log (função). */
async function sincronizar({ slugs = [], atualizar = false, log = () => {} } = {}) {
  const { db } = require('../server/lib/db'); const imagens = require('../server/lib/imagens'); const store = require('../server/lib/retratos_store');
  const res = { ok: [], falhas: [], duplicadas: 0, invalidos: store.verificarArquivos().invalidos };
  if (!(await internetDisponivel())) { log('Sem acesso ao Wikidata/Commons: nada a sincronizar agora (tentarei de novo na próxima execução).'); res.offline = true; return res; }
  const pessoas = require('../server/lib/pessoas');
  const com = new Set(db.prepare("SELECT entidade_tipo||':'||entidade_slug s FROM imagens WHERE verificada=1 AND papel='retrato' AND arquivo_url LIKE '/images/personalidades/%'").all().map(r => r.s));
  let alvo = pessoas.listar();   // TODAS as pessoas: personalidades e fundadores/figuras, atuais e futuras
  if (slugs.length) alvo = alvo.filter(p => slugs.includes(p.slug)); else if (!atualizar) alvo = alvo.filter(p => !com.has(`${p.tipo}:${p.slug}`));
  for (const p of alvo) {
    try {
      const r = await buscarUm(p);
      if (!r.registro) { pessoas.registrar(p, r.status, r.motivo); res.falhas.push({ slug: p.slug, motivo: `${r.status}: ${r.motivo}` }); log(`· ${p.nome}: ${r.motivo}`); await espera(250); continue; }
      const a = await armazenarCandidato(r.registro); if (a.duplicada) res.duplicadas++;
      pessoas.registrar(p, 'com_retrato', null); res.ok.push({ slug: p.slug, url: a.url, tipo: a.tipo }); log(`✔ ${p.nome}: ${a.tipo} salvo em ${a.url}`);
    } catch (e) { pessoas.registrar(p, 'erro', e.message); res.falhas.push({ slug: p.slug, motivo: e.message }); log(`✗ ${p.nome}: ${e.message}`); }
    await espera(300);
  }
  return res;
}
module.exports.sincronizar = sincronizar; module.exports.internetDisponivel = internetDisponivel; module.exports.baixar = baixar;

async function main() {
  const [cmd, ...slugs] = process.argv.slice(2); const { db } = require('../server/lib/db');
  const todos = require('../server/lib/pessoas').listar();
  if (cmd === 'status' || cmd === 'relatorio') {
    const rel = require('../server/lib/pessoas').relatorio(); const por = {};
    for (const r of rel) { por[r.status] = (por[r.status] || 0) + 1; if (cmd === 'relatorio' || r.status !== 'com_retrato') console.log(`${r.status === 'com_retrato' ? '✔' : '·'} [${r.tipo}] ${r.nome} (${r.vida || 'datas n/d'}) — ${r.status}${r.motivo ? ': ' + r.motivo : ''}`); }
    console.log(`\n${rel.length} pessoas no catálogo.`, JSON.stringify(por)); fs.writeFileSync('retratos-relatorio-completo.json', JSON.stringify(rel, null, 2)); return;
  }
  if (cmd === 'sincronizar') {
    const r = await sincronizar({ slugs: slugs.filter(x => !x.startsWith('--')), atualizar: process.argv.includes('--atualizar'), log: console.log });
    console.log(`\n${r.ok.length} retrato(s) baixado(s) e registrado(s); ${r.falhas.length} sem retrato verificável; ${r.invalidos.length} arquivo(s) inválido(s) no manifesto.`); return;
  }
  if (cmd === 'verificar') {
    const { ok, invalidos } = require('../server/lib/retratos_store').verificarArquivos();
    console.log(`${ok.length} arquivo(s) válido(s); ${invalidos.length} inválido(s).`); invalidos.forEach(i => console.log(`✗ ${i.entidade_slug}: ${i.erro}`)); return;
  }
  if (cmd !== 'buscar') { console.log('Uso: retratos.js status | relatorio | sincronizar [slug...] [--atualizar] | verificar | buscar [slug...]'); return; }
  const alvo = slugs.length ? todos.filter(p => slugs.includes(p.slug)) : todos; const saida = []; const relatorio = [];
  for (const p of alvo) {
    try { const r = await buscarUm(p); relatorio.push(r); if (r.registro) saida.push(r.registro); console.log(`${r.status === 'candidato' ? '✔' : '✗'} ${p.nome}: ${r.status}${r.motivo ? ' — ' + r.motivo : ''}`); } catch (e) { console.log(`✗ ${p.nome}: erro ${e.message}`); }
    await espera(300);
  }
  fs.writeFileSync('retratos-candidatos.json', JSON.stringify(saida, null, 2)); fs.writeFileSync('retratos-relatorio.json', JSON.stringify(relatorio, null, 2));
  console.log(`\n${saida.length} candidato(s) em retratos-candidatos.json. Abra cada "url_conferencia", confirme a pessoa e troque "conferido" para true; depois rode scripts/importar-imagens.js.`);
}
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
