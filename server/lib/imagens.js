'use strict';
/**
 * Sistema de imagens. Regras (por direitos autorais e honestidade histórica):
 *  - cada imagem tem autor, licença, fonte e URL da fonte registrados; sem isso, o cadastro é recusado;
 *  - só licenças livres: domínio público, CC0, CC BY, CC BY-SA (qualquer versão);
 *  - só são exibidas imagens com verificada=1 (alguém conferiu a página de origem);
 *  - arquivo local (/img/...) ou hospedagem do Wikimedia (upload.wikimedia.org / Special:FilePath);
 *  - nada de imagem genérica de preenchimento: sem imagem, a interface mostra símbolo ou ilustração tipográfica.
 */
const { db } = require('./db');
/* Migração idempotente: campos de natureza da representação, instituição, atribuição e foco do recorte circular. */
(function migrar() {
  const cols = new Set(db.prepare('PRAGMA table_info(imagens)').all().map(c => c.name));
  if (!cols.size) return;
  /* Migração: a tabela passa a aceitar entidade_tipo 'figura' (fundadores/figuras). SQLite não altera CHECK; reconstrói a tabela. */
  const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='imagens'").get()?.sql || '';
  if (!sql.includes("'figura'")) {
    db.exec('DROP VIEW IF EXISTS imagens_campos; ALTER TABLE imagens RENAME TO imagens_antiga;');
    db.exec(sql.replace(/CREATE TABLE (IF NOT EXISTS )?"?imagens"?/i, 'CREATE TABLE imagens').replace("('tradicao','pensador','texto','regiao')", "('tradicao','pensador','figura','texto','regiao')"));
    const novas = new Set(db.prepare('PRAGMA table_info(imagens)').all().map(c => c.name));
    const comuns = [...cols].filter(c => novas.has(c)).join(',');
    db.exec(`INSERT INTO imagens(${comuns}) SELECT ${comuns} FROM imagens_antiga; DROP TABLE imagens_antiga; CREATE INDEX IF NOT EXISTS ix_imagens_ent ON imagens(entidade_tipo, entidade_slug);`);
  }
  const cols2 = new Set(db.prepare('PRAGMA table_info(imagens)').all().map(c => c.name));
  cols.clear(); cols2.forEach(c => cols.add(c));
  for (const [c, d] of [['tipo_representacao', 'TEXT'], ['instituicao', 'TEXT'], ['atribuicao', 'TEXT'], ['foco', 'TEXT']]) if (!cols.has(c)) db.exec(`ALTER TABLE imagens ADD COLUMN ${c} ${d}`);
  /* Visão com os nomes padronizados pedidos para o cadastro de imagens. */
  db.exec(`DROP VIEW IF EXISTS imagens_campos; CREATE VIEW imagens_campos AS SELECT id, entidade_tipo, entidade_slug,
    arquivo_url AS image_url, tipo_representacao AS image_type, autor AS image_author, COALESCE(instituicao, fonte_nome) AS image_source,
    licenca AS image_license, atribuicao AS image_attribution, verificada AS image_verified, fonte_url AS image_source_page FROM imagens`);
})();
const TIPOS_REP = ['fotografia', 'pintura', 'gravura', 'escultura', 'desenho', 'medalha', 'iluminura', 'relevo', 'outro'];
const LICENCAS = /^(dom[ií]nio p[uú]blico|public domain|pd(-[\w-]+)?|cc0(\s*1\.0)?|cc[- ]by(-sa)?(\s*\d\.\d)?)$/i;
const HOSTS = new Set(['upload.wikimedia.org', 'commons.wikimedia.org']);
const TIPOS = ['tradicao', 'pensador', 'figura', 'texto', 'regiao'];
const PAPEIS = ['foto', 'monumento', 'retrato', 'capa', 'simbolo', 'mapa', 'bandeira'];

function urlPermitida(u) {
  if (typeof u !== 'string') return false;
  if (/^\/(img|images\/personalidades)\/[\w\-./]+$/.test(u) && !u.includes('..')) return true;
  try { const x = new URL(u); return x.protocol === 'https:' && HOSTS.has(x.hostname); } catch { return false; }
}
function validar(i) {
  const e = [];
  if (!TIPOS.includes(i.entidade_tipo)) e.push('entidade_tipo inválido');
  if (!PAPEIS.includes(i.papel)) e.push('papel inválido');
  if (!i.entidade_slug) e.push('entidade_slug obrigatório');
  else {
    const tab = { tradicao: 'tradicoes', pensador: 'pensadores', figura: 'figuras', texto: 'textos_sagrados', regiao: 'regioes' }[i.entidade_tipo];
    if (tab && !db.prepare(`SELECT 1 FROM ${tab} WHERE slug=?`).get(i.entidade_slug)) e.push(`${i.entidade_tipo} "${i.entidade_slug}" não existe no banco`);
  }
  if (!urlPermitida(i.arquivo_url)) e.push('arquivo_url deve ser local (/img/..., /images/personalidades/...) ou https do Wikimedia');
  if (i.miniatura_url && !urlPermitida(i.miniatura_url)) e.push('miniatura_url inválida');
  for (const k of ['alt', 'autor', 'licenca', 'fonte_nome', 'fonte_url']) if (!String(i[k] || '').trim()) e.push(`${k} obrigatório`);
  if (i.licenca && !LICENCAS.test(String(i.licenca).trim())) e.push('licença não aceita (use domínio público, CC0, CC BY ou CC BY-SA)');
  if (i.fonte_url && !/^https:\/\//.test(i.fonte_url)) e.push('fonte_url deve ser https');
  if (i.papel === 'retrato') {
    if (!TIPOS_REP.includes(i.tipo_representacao)) e.push(`tipo_representacao obrigatório para retrato (${TIPOS_REP.join(', ')})`);
    if (!String(i.instituicao || '').trim()) e.push('instituicao (museu, biblioteca, arquivo) obrigatória para retrato');
    if (i.entidade_tipo === 'figura' && i.tipo_representacao === 'fotografia' && db.prepare('SELECT historicidade h FROM figuras WHERE slug=?').get(i.entidade_slug)?.h !== 'historica')
      e.push('fotografia só é aceita para figuras historicamente documentadas e do período da fotografia');
    if (i.entidade_tipo === 'pensador' && i.tipo_representacao === 'fotografia') {
      const t = db.prepare('SELECT vida FROM pensadores WHERE slug=?').get(i.entidade_slug); const a = anosDeVida(t?.vida);
      if (a && a[1] != null && a[1] < 1839) e.push(`fotografia impossível: a pessoa morreu em ${a[1]}, antes da invenção da fotografia (1839)`);
    }
  }
  if (i.foco && !/^\d{1,3}% \d{1,3}%$/.test(i.foco)) e.push('foco deve ser como "50% 20%"');
  return e;
}
/** "354–430", "c. 551–479 a.C.", "1926–2022" -> [nascimento, morte] (negativo = a.C.); null se não houver anos exatos. */
function anosDeVida(v) {
  const m = /(\d{3,4})\s*[–-]\s*(\d{3,4})(\s*a\.?C\.?)?/.exec(String(v || '')); if (!m) return null;
  const k = m[3] ? -1 : 1; return [k * +m[1], k * +m[2]];
}
const atribuicaoPadrao = i => [i.autor, i.titulo, i.instituicao, i.licenca, i.fonte_nome ? `via ${i.fonte_nome}` : null].filter(Boolean).join('. ');
function cadastrar(i) {
  const e = validar(i); if (e.length) { const err = new Error(e.join('; ')); err.status = 400; throw err; }
  db.prepare(`INSERT INTO imagens(entidade_tipo,entidade_slug,papel,arquivo_url,miniatura_url,titulo,alt,autor,licenca,licenca_url,fonte_nome,fonte_url,data_acesso,verificada,nota,tipo_representacao,instituicao,atribuicao,foco)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(entidade_tipo,entidade_slug,arquivo_url) DO UPDATE SET papel=excluded.papel,miniatura_url=excluded.miniatura_url,titulo=excluded.titulo,alt=excluded.alt,autor=excluded.autor,licenca=excluded.licenca,licenca_url=excluded.licenca_url,fonte_nome=excluded.fonte_nome,fonte_url=excluded.fonte_url,data_acesso=excluded.data_acesso,verificada=excluded.verificada,nota=excluded.nota,tipo_representacao=excluded.tipo_representacao,instituicao=excluded.instituicao,atribuicao=excluded.atribuicao,foco=excluded.foco`)
    .run(i.entidade_tipo, i.entidade_slug, i.papel, i.arquivo_url, i.miniatura_url || null, i.titulo || null, i.alt, i.autor, i.licenca, i.licenca_url || null, i.fonte_nome, i.fonte_url, i.data_acesso || new Date().toISOString().slice(0, 10), i.verificada ? 1 : 0, i.nota || null, i.tipo_representacao || null, i.instituicao || null, i.atribuicao || atribuicaoPadrao(i), i.foco || null);
}
const ROTULO_REP = { fotografia: 'Fotografia', pintura: 'Pintura', gravura: 'Gravura', escultura: 'Escultura', desenho: 'Desenho', medalha: 'Medalha', iluminura: 'Iluminura', relevo: 'Relevo', outro: 'Representação histórica' };
const pub = r => ({ tipo_representacao: r.tipo_representacao, rotulo_representacao: ROTULO_REP[r.tipo_representacao] || null, instituicao: r.instituicao, atribuicao: r.atribuicao, foco: r.foco, url: r.arquivo_url, miniatura: r.miniatura_url || r.arquivo_url, papel: r.papel, alt: r.alt, autor: r.autor, licenca: r.licenca, licenca_url: r.licenca_url, fonte: r.fonte_nome, fonte_url: r.fonte_url, titulo: r.titulo });
const ORDEM = { foto: 0, monumento: 1, retrato: 0, capa: 0, mapa: 2, bandeira: 3, simbolo: 4 };
/** Mapa "tipo:slug" -> imagens verificadas (uma consulta só; o catálogo é pequeno). */
let cache = null;
function todas() {
  if (cache) return cache;
  cache = {};
  for (const r of db.prepare('SELECT * FROM imagens WHERE verificada=1').all()) (cache[`${r.entidade_tipo}:${r.entidade_slug}`] ??= []).push(r);
  for (const k of Object.keys(cache)) cache[k].sort((a, b) => (ORDEM[a.papel] ?? 9) - (ORDEM[b.papel] ?? 9) || a.id - b.id);
  return cache;
}
function invalidar() { cache = null; }
function imagensDe(tipo, slug, papeis) { return (todas()[`${tipo}:${slug}`] || []).filter(r => !papeis || papeis.includes(r.papel)).map(pub); }
/** Retrato de uma figura (fundador): o cadastro próprio ou, se a mesma pessoa estiver entre as personalidades, o dela (mesmo nome). */
function retratoDeFigura(slug, nome) {
  const direto = principal('figura', slug, ['retrato', 'foto']); if (direto) return direto;
  const norm = x => String(x).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\(.*?\)/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const p = db.prepare("SELECT slug, nome FROM pensadores WHERE tipo='pensador'").all().find(x => x.slug === slug || norm(x.nome) === norm(nome));
  return p ? principal('pensador', p.slug, ['retrato', 'foto']) : null;
}
function principal(tipo, slug, papeis) { return imagensDe(tipo, slug, papeis)[0] || null; }

/* Símbolos: emblemas geométricos simples, desenhados no front (public/js/simbolos.js). Só onde há símbolo amplamente associado;
 * os ramos herdam o da família, exceto os que NÃO usam esse símbolo. Islã e outros marcados como "popular, não doutrinário". */
const SIMBOLO_DE = { cristianismo: 'cruz', judaismo: 'estrela_david', islamismo: 'crescente', budismo: 'dharmachakra', taoismo: 'taijitu', xintoismo: 'torii', bahai: 'estrela9', wicca: 'pentaculo', 'religiao-egipcia-antiga': 'ankh', cabala: 'menorah' };
const SEM_SIMBOLO = new Set(['testemunhas-de-jeova', 'santos-dos-ultimos-dias', 'quakers', 'unitarismo-universalista', 'igreja-da-unificacao', 'cientologia', 'bahai-reformista']);
const NOTA_SIMBOLO = { crescente: 'Símbolo popular associado ao islã; não é doutrinário nem oficial de todos os ramos.', estrela_david: 'Símbolo amplamente associado ao judaísmo desde a Idade Média.', cruz: 'Símbolo central do cristianismo; alguns grupos cristãos não o utilizam.', dharmachakra: 'Roda do Dharma, símbolo associado ao budismo.', taijitu: 'Símbolo do yin-yang, associado ao taoísmo e ao pensamento chinês.', torii: 'Portal de santuários xintoístas.', estrela9: 'Estrela de nove pontas, associada à fé bahá’í.', pentaculo: 'Pentáculo, usado em tradições wiccanas e neopagãs.', ankh: 'Ankh, hieróglifo egípcio da vida.', menorah: 'Menorá, candelabro de sete braços do judaísmo.' };
function simboloDe(slug) {
  const seen = new Set(); let s = slug;
  while (s && !seen.has(s)) {
    if (SEM_SIMBOLO.has(s)) return null;
    if (SIMBOLO_DE[s]) return { chave: SIMBOLO_DE[s], de: s, nota: NOTA_SIMBOLO[SIMBOLO_DE[s]] };
    seen.add(s); s = db.prepare('SELECT p.slug FROM tradicoes t JOIN tradicoes p ON p.id=t.parent_id WHERE t.slug=?').get(s)?.slug;
  }
  return null;
}
module.exports = { retratoDeFigura, anosDeVida, TIPOS_REP, validar, cadastrar, imagensDe, principal, invalidar, simboloDe, urlPermitida, LICENCAS: 'domínio público, CC0, CC BY, CC BY-SA' };
