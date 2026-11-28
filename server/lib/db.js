'use strict';
/**
 * Acesso ao banco (SQLite nativo do Node >= 22.5, sem dependências nativas).
 * Expõe: db, transaction(), slugify(), normalizar(), reindexar().
 */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, 'mapa.db');

if (DB_FILE !== ':memory:' && !DB_FILE.startsWith('file:')) fs.mkdirSync(path.dirname(path.resolve(DB_FILE)), { recursive: true });   // pasta do banco sempre existe (evita "unable to open database file")
const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8'));

/** Executa fn dentro de uma transação; reverte em caso de erro. */
function transaction(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { try { db.exec('ROLLBACK'); } catch (_) {} throw e; }
}

/** "Religião Iorubá" -> "religiao-ioruba" */
function slugify(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/['’`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Normaliza para comparação de nomes (sem acento, minúsculas, sem pontuação/termos genéricos). */
function normalizar(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Reconstrói a linha de busca de texto completo de uma tradição. */
function reindexar(id) {
  db.prepare('DELETE FROM busca WHERE tradicao_id = ?').run(id);
  const t = db.prepare('SELECT * FROM tradicoes WHERE id = ?').get(id);
  if (!t || t.status_publicacao === 'arquivado') return;
  const alt = db.prepare('SELECT nome FROM nomes_alternativos WHERE tradicao_id = ?').all(id).map(r => r.nome).join(' ; ');
  const conteudo = [t.contexto_historico, t.historia, t.crencas_fundamentais, t.divindade, t.humanidade,
    t.alma_espirito, t.pos_morte, t.praticas_rituais, t.organizacao, t.origem_texto].filter(Boolean).join(' ');
  db.prepare('INSERT INTO busca(nome, alternativos, resumo, conteudo, tradicao_id) VALUES (?,?,?,?,?)')
    .run(t.nome, alt, t.resumo, conteudo, id);
}

module.exports = { db, DB_FILE, transaction, slugify, normalizar, reindexar };
