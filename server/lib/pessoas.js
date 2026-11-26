'use strict';
/**
 * Registro único de TODAS as pessoas do catálogo (personalidades + fundadores/figuras) e do estado do seu retrato.
 * REGRA PERMANENTE: qualquer pessoa nova (pensador ou figura) entra aqui automaticamente, pois a lista é derivada do banco;
 * a sincronização de retratos (scripts/retratos.js, executada ao iniciar o servidor) percorre esta lista inteira, e o teste
 * test/retratos.test.js falha se alguma pessoa ficar fora do relatório.
 */
const { db } = require('./db');
const { anosDeVida } = require('./imagens');
db.exec(`CREATE TABLE IF NOT EXISTS retratos_status (
  entidade_tipo TEXT NOT NULL, entidade_slug TEXT NOT NULL, status TEXT NOT NULL, motivo TEXT, tentado_em TEXT NOT NULL,
  PRIMARY KEY (entidade_tipo, entidade_slug))`);

const norm = x => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\(.*?\)/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const ANOS_DESC = /\((?:c\.\s*)?(\d{3,4})\s*[–-]\s*(\d{3,4})(\s*a\.?C\.?)?\)|(\d{3,4})\s*[–-]\s*(\d{3,4})\s*d\.C\./;
/** Pessoas cuja representação visual não deve ser buscada automaticamente (por respeito à tradição ou por falta de registro autêntico). */
const SEM_IMAGEM_POR_RESPEITO = [/^(maome|muhammad|mohammad|mohamed)$/, /^bab$/, /^baha u llah$/];
function politica(p) {
  if (SEM_IMAGEM_POR_RESPEITO.some(r => r.test(norm(p.nome)))) return { buscar: false, status: 'aniconismo', motivo: 'tradição que não admite ou restringe representações visuais da pessoa: nenhuma imagem é buscada' };
  if (p.historicidade && p.historicidade !== 'historica') return { buscar: false, status: 'sem_registro_autentico', motivo: `figura de historicidade “${p.historicidade}”: não existe retrato ou fotografia autêntica; qualquer imagem seria representação artística posterior` };
  return { buscar: true };
}
function listar() {
  const pens = db.prepare("SELECT slug, nome, vida FROM pensadores WHERE tipo='pensador' ORDER BY nome").all()
    .map(p => ({ tipo: 'pensador', slug: p.slug, nome: p.nome, vida: p.vida, anos: anosDeVida(p.vida), historicidade: 'historica' }));
  const nomes = new Set(pens.map(p => norm(p.nome))); const slugs = new Set(pens.map(p => p.slug));
  const figs = db.prepare('SELECT slug, nome, descricao, historicidade FROM figuras ORDER BY nome').all()
    .filter(f => !nomes.has(norm(f.nome)) && !slugs.has(f.slug))   // a mesma pessoa não conta duas vezes: o retrato é compartilhado
    .map(f => { const m = ANOS_DESC.exec(f.descricao || ''); const neg = m?.[3] ? -1 : 1;
      const anos = m ? (m[1] ? [neg * +m[1], neg * +m[2]] : [+m[4], +m[5]]) : null;
      return { tipo: 'figura', slug: f.slug, nome: f.nome, vida: anos ? `${anos[0]}–${anos[1]}` : null, anos, historicidade: f.historicidade }; });
  return [...pens, ...figs];
}
function registrar(p, status, motivo) {
  db.prepare(`INSERT INTO retratos_status(entidade_tipo,entidade_slug,status,motivo,tentado_em) VALUES (?,?,?,?,?)
    ON CONFLICT(entidade_tipo,entidade_slug) DO UPDATE SET status=excluded.status,motivo=excluded.motivo,tentado_em=excluded.tentado_em`)
    .run(p.tipo, p.slug, status, motivo || null, new Date().toISOString());
}
/** Relatório de todas as pessoas: com retrato verificado, ou o motivo (ou "ainda não tentado"). */
function relatorio() {
  const imagens = require('./imagens');
  const st = new Map(db.prepare('SELECT * FROM retratos_status').all().map(r => [`${r.entidade_tipo}:${r.entidade_slug}`, r]));
  return listar().map(p => {
    const img = p.tipo === 'figura' ? imagens.retratoDeFigura(p.slug, p.nome) : imagens.principal('pensador', p.slug, ['retrato', 'foto']);
    const s = st.get(`${p.tipo}:${p.slug}`); const pol = politica(p);
    const status = img ? 'com_retrato' : (!pol.buscar ? pol.status : (s?.status || 'nao_tentado'));
    return { tipo: p.tipo, slug: p.slug, nome: p.nome, vida: p.vida, status, motivo: img ? null : (!pol.buscar ? pol.motivo : s?.motivo || 'a sincronização ainda não rodou com acesso à internet'), url: img?.url || null, tipo_representacao: img?.tipo_representacao || null };
  });
}
module.exports = { listar, politica, registrar, relatorio, norm };
