'use strict';
/**
 * Descoberta de tradições ausentes. NADA é publicado automaticamente:
 * tudo entra em `candidatos` (status pendente) com possíveis duplicatas, e exige revisão humana.
 * Fontes: Wikidata (consulta SPARQL; confiabilidade BAIXA — serve só para achar nomes) e importação manual.
 */
const { db, normalizar } = require('./db');

// Classes do Wikidata usadas como ponto de partida (configurável; confira os QIDs antes de usar em produção).
const CLASSES_WIKIDATA = (process.env.WIKIDATA_CLASSES || 'Q9174,Q1131296').split(','); // religião; denominação religiosa

function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
const GENERICAS = new Set(['religiao', 'igreja', 'de', 'do', 'da', 'dos', 'das', 'the', 'church', 'religion', 'e', 'and', 'of', 'ancient', 'antiga', 'antigo']);
function tokens(s) { return normalizar(s).split(' ').filter(t => t && !GENERICAS.has(t)); }

function similaridadeNomes(a, b) {
  const na = normalizar(a), nb = normalizar(b);
  if (!na || !nb) return 0; if (na === nb) return 1;
  const ta = new Set(tokens(a)), tb = new Set(tokens(b));
  const inter = [...ta].filter(t => tb.has(t)).length, uni = new Set([...ta, ...tb]).size;
  const jac = uni ? inter / uni : 0;
  const ratio = 1 - lev(na, nb) / Math.max(na.length, nb.length);
  return Math.max(jac * 0.9, ratio);
}

/** Procura registros existentes parecidos com `nome` (+ variantes). */
function acharDuplicatas(nome, variantes = [], limiar = 0.78) {
  const todos = [nome, ...variantes];
  const nomes = db.prepare(`SELECT t.id tradicao_id, t.nome, t.slug FROM tradicoes t
    UNION ALL SELECT n.tradicao_id, n.nome, t.slug FROM nomes_alternativos n JOIN tradicoes t ON t.id = n.tradicao_id`).all();
  const melhores = new Map();
  for (const r of nomes) for (const x of todos) {
    const s = similaridadeNomes(x, r.nome);
    if (s >= limiar && s > (melhores.get(r.tradicao_id)?.score ?? 0))
      melhores.set(r.tradicao_id, { tradicao_id: r.tradicao_id, slug: r.slug, nome: r.nome, score: +s.toFixed(2), motivo: s === 1 ? 'nome idêntico' : 'nome semelhante' });
  }
  return [...melhores.values()].sort((a, b) => b.score - a.score).slice(0, 5);
}

function registrarCandidato({ nome, nomes_alternativos = [], categoria_sugerida = null, descricao_bruta = null, fonte_slug = 'manual', fonte_url = null, id_externo = null }) {
  if (!nome || !String(nome).trim()) throw Object.assign(new Error('nome obrigatório'), { status: 400 });
  const fonte = db.prepare('SELECT id FROM fontes_consultadas WHERE slug=?').get(fonte_slug);
  if (!fonte) throw Object.assign(new Error('fonte desconhecida: ' + fonte_slug), { status: 400 });
  if (id_externo && db.prepare('SELECT 1 FROM candidatos WHERE fonte_id=? AND id_externo=?').get(fonte.id, id_externo)) return { duplicado_candidato: true };
  const dups = acharDuplicatas(nome, nomes_alternativos);
  const status = dups.some(d => d.score === 1) ? 'duplicata' : 'pendente';
  const r = db.prepare(`INSERT INTO candidatos(nome,nomes_alternativos,categoria_sugerida,descricao_bruta,fonte_id,fonte_url,id_externo,possiveis_duplicatas,status)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(nome.trim(), JSON.stringify(nomes_alternativos), categoria_sugerida, descricao_bruta, fonte.id, fonte_url, id_externo, JSON.stringify(dups), status);
  return { id: Number(r.lastInsertRowid), status, possiveis_duplicatas: dups };
}

async function buscarWikidata({ limite = 50, offset = 0 } = {}) {
  const valores = CLASSES_WIKIDATA.map(q => 'wd:' + q.trim()).join(' ');
  const sparql = `SELECT ?item ?itemLabel ?desc WHERE { VALUES ?c { ${valores} } ?item wdt:P31 ?c .
    OPTIONAL { ?item schema:description ?desc FILTER(LANG(?desc)='en') }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". } } LIMIT ${+limite} OFFSET ${+offset}`;
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(sparql);
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'MapaDeCrencas/1.0 (plataforma de pesquisa; contato via administrador)', Accept: 'application/sparql-results+json' } });
    if (!res.ok) throw new Error('Wikidata respondeu HTTP ' + res.status);
    const j = await res.json();
    return j.results.bindings.map(b => ({ nome: b.itemLabel.value, descricao: b.desc?.value || null, qid: b.item.value.split('/').pop(), url: b.item.value }))
      .filter(x => !/^Q\d+$/.test(x.nome));
  } finally { clearTimeout(to); }
}

async function descobrirWikidata(opts) {
  const fonte = db.prepare("SELECT * FROM fontes_consultadas WHERE slug='wikidata'").get();
  const achados = await buscarWikidata(opts);
  let novos = 0, duplicatas = 0, ignorados = 0;
  for (const a of achados) {
    const r = registrarCandidato({ nome: a.nome, descricao_bruta: a.descricao, fonte_slug: 'wikidata', fonte_url: a.url, id_externo: a.qid });
    if (r.duplicado_candidato) ignorados++; else if (r.status === 'duplicata') duplicatas++; else novos++;
  }
  db.prepare("UPDATE fontes_consultadas SET ultima_execucao=datetime('now') WHERE id=?").run(fonte.id);
  return { consultados: achados.length, novos_candidatos: novos, duplicatas_detectadas: duplicatas, ja_conhecidos: ignorados };
}

module.exports = { acharDuplicatas, registrarCandidato, descobrirWikidata, similaridadeNomes };
