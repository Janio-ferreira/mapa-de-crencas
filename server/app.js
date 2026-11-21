'use strict';
/** Servidor Express: API pública, painel administrativo (token) e arquivos estáticos. */
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const { db, DB_FILE, transaction, slugify, reindexar } = require('./lib/db');
const compat = require('./lib/compat');
const eixosLib = require('./lib/eixos');
const perfilLib = require('./lib/perfil');
const questionario = require('./lib/questionario');
const desc = require('./lib/descoberta');
const { seed } = require('./seed');

const CATEGORIAS = ['religiao','familia_religiosa','denominacao','vertente','escola','movimento','tradicao_espiritual','culto_historico','sistema_filosofico_religioso'];
const SITUACOES = ['praticada','extinta','historica','reconstruida'];
const STATUS = ['rascunho','em_revisao','publicado','arquivado'];
const ERR = (status, msg) => Object.assign(new Error(msg), { status });

function criarApp() {
  seed();
  require('./seed/aplicar_eixos').aplicar();
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  const api = express.Router();

  // ---------- Token administrativo ----------
  const tokenFile = path.join(path.dirname(DB_FILE), 'admin-token.txt');
  let ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  if (!ADMIN_TOKEN) {
    try { ADMIN_TOKEN = fs.readFileSync(tokenFile, 'utf8').trim(); } catch { ADMIN_TOKEN = crypto.randomBytes(18).toString('base64url'); fs.writeFileSync(tokenFile, ADMIN_TOKEN, { mode: 0o600 }); }
  }
  const igual = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
  const admin = (req, _res, next) => {
    const t = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    if (!t || !igual(t, ADMIN_TOKEN)) return next(ERR(401, 'Token administrativo inválido.'));
    next();
  };
  const audit = (acao, entidade, id, detalhe) => db.prepare('INSERT INTO auditoria(acao,entidade,entidade_id,detalhe) VALUES (?,?,?,?)').run(acao, entidade, id ?? null, detalhe ? JSON.stringify(detalhe) : null);

  // ---------- Consultas públicas ----------
  const SEL_LISTA = `t.id, t.slug, t.nome, t.categoria, t.situacao, t.resumo, t.inicio_ano, t.fim_ano, t.periodo_texto, t.origem_texto, t.origem_lat lat, t.origem_lng lng,
    t.parent_id, p.nome parent_nome, p.slug parent_slug, r.nome regiao, t.verificacao`;
  const FROM_LISTA = `FROM tradicoes t LEFT JOIN tradicoes p ON p.id=t.parent_id LEFT JOIN regioes r ON r.id=t.origem_regiao_id`;

  function ftsQuery(q) {
    const tk = String(q).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().match(/[a-z0-9]+/g) || [];
    return tk.length ? tk.map(t => `"${t}"*`).join(' ') : null;
  }

  api.get('/stats', (_req, res) => {
    const q = s => db.prepare(s).all();
    res.json({
      total: db.prepare("SELECT COUNT(*) c FROM tradicoes WHERE status_publicacao='publicado'").get().c,
      por_categoria: q("SELECT categoria chave, COUNT(*) n FROM tradicoes WHERE status_publicacao='publicado' GROUP BY categoria ORDER BY n DESC"),
      por_situacao: q("SELECT situacao chave, COUNT(*) n FROM tradicoes WHERE status_publicacao='publicado' GROUP BY situacao"),
      referencias: db.prepare('SELECT COUNT(*) c FROM referencias').get().c,
      textos: db.prepare('SELECT COUNT(*) c FROM textos_sagrados').get().c,
      dimensoes: db.prepare('SELECT COUNT(*) c FROM dimensoes').get().c,
      ultima_atualizacao: db.prepare('SELECT MAX(atualizado_em) m FROM tradicoes').get().m,
    });
  });

  api.get('/filtros', (_req, res) => res.json({
    categorias: CATEGORIAS, situacoes: SITUACOES,
    regioes: db.prepare("SELECT slug, nome, tipo FROM regioes ORDER BY tipo, nome").all(),
    periodos: db.prepare('SELECT slug, nome, inicio, fim FROM periodos ORDER BY ordem').all(),
  }));

  api.get('/tradicoes', (req, res) => {
    const { q, categoria, situacao, regiao, pai, de, ate, verificacao, ordem = 'nome', pagina = 1, limite = 24 } = req.query;
    const w = ["t.status_publicacao='publicado'"], p = [];
    let from = FROM_LISTA, rank = '';
    if (q) {
      const fq = ftsQuery(q);
      if (fq) { from += ' JOIN (SELECT tradicao_id, bm25(busca,10,6,3,1) rk FROM busca WHERE busca MATCH ?) b ON b.tradicao_id=t.id'; p.push(fq); rank = 'b.rk'; }
    }
    const multi = (col, v) => { const a = String(v).split(',').filter(Boolean); if (a.length) { w.push(`${col} IN (${a.map(() => '?').join(',')})`); p.push(...a); } };
    if (categoria) multi('t.categoria', categoria);
    if (situacao) multi('t.situacao', situacao);
    if (verificacao) multi('t.verificacao', verificacao);
    if (regiao) { w.push(`(r.slug=? OR t.origem_regiao_id IN (SELECT id FROM regioes WHERE parent_id=(SELECT id FROM regioes WHERE slug=?)) OR r.parent_id=(SELECT id FROM regioes WHERE slug=?))`); p.push(regiao, regiao, regiao); }
    if (pai) { w.push('p.slug=?'); p.push(pai); }
    if (de !== undefined && de !== '') { w.push('(t.inicio_ano IS NOT NULL AND t.inicio_ano>=?)'); p.push(+de); }
    if (ate !== undefined && ate !== '') { w.push('(t.inicio_ano IS NOT NULL AND t.inicio_ano<=?)'); p.push(+ate); }
    const orders = { nome: 't.nome COLLATE NOCASE', antigas: 't.inicio_ano IS NULL, t.inicio_ano', recentes: 't.inicio_ano DESC', relevancia: rank || 't.nome' };
    const lim = Math.min(100, Math.max(1, +limite || 24)), off = (Math.max(1, +pagina || 1) - 1) * lim;
    const where = w.join(' AND ');
    const total = db.prepare(`SELECT COUNT(*) c ${from} WHERE ${where}`).get(...p).c;
    const itens = db.prepare(`SELECT ${SEL_LISTA} ${from} WHERE ${where} ORDER BY ${orders[ordem] || orders.nome} LIMIT ? OFFSET ?`).all(...p, lim, off);
    res.json({ total, pagina: +pagina || 1, limite: lim, itens });
  });

  api.get('/tradicoes/:slug', (req, res, next) => {
    const t = db.prepare(`SELECT t.*, p.nome parent_nome, p.slug parent_slug, r.nome regiao_nome FROM tradicoes t LEFT JOIN tradicoes p ON p.id=t.parent_id LEFT JOIN regioes r ON r.id=t.origem_regiao_id WHERE t.slug=?`).get(req.params.slug);
    if (!t || (t.status_publicacao !== 'publicado' && !req.query.preview)) return next(ERR(404, 'Tradição não encontrada.'));
    const id = t.id, a = s => db.prepare(s).all(id);
    const out = {
      ...t,
      nomes_alternativos: a('SELECT nome, idioma, tipo FROM nomes_alternativos WHERE tradicao_id=?'),
      subdivisoes: a("SELECT slug, nome, categoria, situacao FROM tradicoes WHERE parent_id=? AND status_publicacao='publicado' ORDER BY nome"),
      cadeia: cadeia(t),
      fundadores: a('SELECT f.slug, f.nome, f.descricao, f.historicidade, tf.papel, tf.nota FROM tradicao_figuras tf JOIN figuras f ON f.id=tf.figura_id WHERE tf.tradicao_id=?'),
      textos_sagrados: a('SELECT s.slug, s.nome, s.tipo, s.descricao, tt.autoridade FROM tradicao_textos tt JOIN textos_sagrados s ON s.id=tt.texto_id WHERE tt.tradicao_id=?'),
      crencas: a('SELECT titulo, descricao, centralidade FROM crencas WHERE tradicao_id=? ORDER BY centralidade DESC'),
      praticas: a('SELECT nome, tipo, descricao FROM praticas WHERE tradicao_id=?'),
      regioes: a('SELECT r.slug, r.nome, tr.papel FROM tradicao_regioes tr JOIN regioes r ON r.id=tr.regiao_id WHERE tr.tradicao_id=?'),
      relacoes: db.prepare(`SELECT 'saida' sentido, x.tipo, x.descricao, t2.slug, t2.nome FROM relacoes x JOIN tradicoes t2 ON t2.id=x.destino_id WHERE x.origem_id=?
        UNION ALL SELECT 'entrada', x.tipo, x.descricao, t2.slug, t2.nome FROM relacoes x JOIN tradicoes t2 ON t2.id=x.origem_id WHERE x.destino_id=?`).all(id, id),
      referencias: a('SELECT r.chave, r.tipo_fonte, r.autores, r.titulo, r.ano, r.editora, r.local, r.url, r.doi, r.nota, tr.escopo FROM tradicao_referencias tr JOIN referencias r ON r.id=tr.referencia_id WHERE tr.tradicao_id=? ORDER BY r.autores'),
      doutrinas: doutrinasDe(id),
      eixos: eixosDetalhados(t.slug),
    };
    res.json(out);
  });
  function cadeia(t) { const c = []; let cur = t; while (cur?.parent_id) { cur = db.prepare('SELECT id, slug, nome, parent_id FROM tradicoes WHERE id=?').get(cur.parent_id); if (cur) c.unshift({ slug: cur.slug, nome: cur.nome }); } return c; }
  function eixosDetalhados(slug) {
    const e = eixosLib.eixosDaTradicao(slug); if (!e) return [];
    return eixosLib.AXES.map(ax => { const x = e[ax.id]; const o = { id: ax.id, n: ax.n, nome: ax.nome, esq: ax.esq, dir: ax.dir, status: x.status };
      if (x.status === 'ok') Object.assign(o, { valor: x.valor, faixa: x.faixa, dispersao: x.dispersao, confianca: x.confianca, intensidade: eixosLib.intensidade(x.valor).nivel, posicao: eixosLib.rotuloPosicao(ax, x.valor), interna: x.dispersao >= 25 });
      return o; });
  }
  function doutrinasDe(id) {
    const rows = db.prepare(`SELECT d.chave dimensao, d.nome dimensao_nome, d.ordem, o.nome opcao, x.peso, x.confianca, x.nota FROM doutrinas x JOIN dimensoes d ON d.id=x.dimensao_id JOIN opcoes o ON o.id=x.opcao_id WHERE x.tradicao_id=? ORDER BY d.ordem, x.peso DESC`).all(id);
    const por = {}; for (const r of rows) (por[r.dimensao] ??= { dimensao: r.dimensao, nome: r.dimensao_nome, posicoes: [], nota: null }).posicoes.push({ opcao: r.opcao, peso: +r.peso.toFixed(2), confianca: r.confianca }), por[r.dimensao].nota ||= r.nota;
    const dims = db.prepare('SELECT chave, nome FROM dimensoes ORDER BY ordem').all();
    return dims.map(d => por[d.chave] || { dimensao: d.chave, nome: d.nome, posicoes: [], nota: 'Informação não documentada.' });
  }

  api.get('/arvore', (_req, res) => {
    const rows = db.prepare("SELECT id, slug, nome, categoria, situacao, parent_id FROM tradicoes WHERE status_publicacao='publicado' ORDER BY nome").all();
    const by = new Map(rows.map(r => [r.id, { ...r, filhos: [] }])); const raiz = [];
    for (const n of by.values()) (n.parent_id && by.get(n.parent_id) ? by.get(n.parent_id).filhos : raiz).push(n);
    res.json(raiz);
  });

  api.get('/mapa', (_req, res) => res.json(db.prepare(`SELECT t.slug, t.nome, t.categoria, t.situacao, t.origem_lat lat, t.origem_lng lng, t.origem_texto, t.inicio_ano FROM tradicoes t WHERE status_publicacao='publicado' AND origem_lat IS NOT NULL AND categoria!='familia_religiosa'`).all()));

  api.get('/linha-do-tempo', (_req, res) => res.json({
    periodos: db.prepare('SELECT slug, nome, inicio, fim FROM periodos ORDER BY ordem').all(),
    itens: db.prepare(`SELECT slug, nome, categoria, situacao, inicio_ano, inicio_aprox, fim_ano, periodo_texto, parent_id FROM tradicoes WHERE status_publicacao='publicado' AND inicio_ano IS NOT NULL AND categoria!='familia_religiosa' ORDER BY inicio_ano`).all(),
    sem_data: db.prepare("SELECT slug, nome FROM tradicoes WHERE status_publicacao='publicado' AND inicio_ano IS NULL AND categoria!='familia_religiosa' ORDER BY nome").all(),
  }));

  api.get('/referencias', (req, res) => {
    const { q, tipo } = req.query; const w = [], p = [];
    if (q) { w.push('(r.titulo LIKE ? OR r.autores LIKE ?)'); p.push(`%${q}%`, `%${q}%`); }
    if (tipo) { w.push('r.tipo_fonte=?'); p.push(tipo); }
    res.json(db.prepare(`SELECT r.*, (SELECT COUNT(*) FROM tradicao_referencias x WHERE x.referencia_id=r.id) usos,
      (SELECT GROUP_CONCAT(t.slug || '|' || t.nome, ';;') FROM tradicao_referencias x JOIN tradicoes t ON t.id=x.tradicao_id WHERE x.referencia_id=r.id) tradicoes
      FROM referencias r ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY r.autores, r.ano`).all(...p)
      .map(r => ({ ...r, tradicoes: (r.tradicoes || '').split(';;').filter(Boolean).map(s => { const [slug, nome] = s.split('|'); return { slug, nome }; }) })));
  });

  api.get('/comparar', (req, res, next) => {
    const slugs = [...new Set(String(req.query.slugs || '').split(',').filter(Boolean))].slice(0, 5);
    if (slugs.length < 2) return next(ERR(400, 'Informe de 2 a 5 tradições em ?slugs=a,b.'));
    const itens = slugs.map(s => db.prepare("SELECT t.id, t.slug, t.nome, t.categoria, t.situacao, t.parent_id, p.nome parent_nome, p.slug parent_slug, t.periodo_texto, t.origem_texto, t.divindade, t.humanidade, t.alma_espirito, t.pos_morte, t.praticas_rituais, t.organizacao, t.relacao_outras FROM tradicoes t LEFT JOIN tradicoes p ON p.id=t.parent_id WHERE t.slug=? AND t.status_publicacao='publicado'").get(s));
    if (itens.some(i => !i)) return next(ERR(404, 'Alguma tradição não foi encontrada.'));
    const tradicoes = itens.map(i => ({ ...i, doutrinas: doutrinasDe(i.id), eixos: eixosDetalhados(i.slug),
      textos: db.prepare('SELECT s.slug, s.nome, s.tipo FROM tradicao_textos tt JOIN textos_sagrados s ON s.id=tt.texto_id WHERE tt.tradicao_id=? ORDER BY s.nome').all(i.id),
      praticas: db.prepare('SELECT nome, tipo FROM praticas WHERE tradicao_id=?').all(i.id) }));
    // eixos em que as tradições mais se afastam / se aproximam
    const spread = eixosLib.AXES.map(ax => { const vs = tradicoes.map(t => t.eixos.find(e => e.id === ax.id)).filter(e => e?.status === 'ok').map(e => e.valor);
      return { id: ax.id, nome: ax.nome, n: vs.length, amplitude: vs.length >= 2 ? +(Math.max(...vs) - Math.min(...vs)).toFixed(0) : null }; }).filter(x => x.amplitude != null);
    const mesma_familia = tradicoes.length > 1 && tradicoes.every(t => t.parent_id && t.parent_id === tradicoes[0].parent_id);
    res.json({ tradicoes: tradicoes.map(({ id, parent_id, ...r }) => r), dimensoes: db.prepare('SELECT chave, nome FROM dimensoes ORDER BY ordem').all(),
      eixos: eixosLib.definicoes(), maiores_diferencas: [...spread].sort((a, b) => b.amplitude - a.amplitude).slice(0, 4), maiores_semelhancas: [...spread].sort((a, b) => a.amplitude - b.amplitude).slice(0, 4), mesma_familia,
      aviso: 'Posições nos eixos são projeções das dimensões doutrinárias do banco; "não documentado" significa ausência de dado, não ausência de crença.' });
  });

  api.get('/dimensoes', (_req, res) => {
    const dims = db.prepare('SELECT chave, nome, pergunta, descricao, peso_base FROM dimensoes ORDER BY ordem').all();
    const ops = db.prepare('SELECT d.chave dim, o.chave, o.nome, o.descricao FROM opcoes o JOIN dimensoes d ON d.id=o.dimensao_id ORDER BY o.dimensao_id, o.ordem').all();
    res.json(dims.map(d => ({ ...d, opcoes: ops.filter(o => o.dim === d.chave).map(({ chave, nome, descricao }) => ({ chave, nome, descricao })) })));
  });

  api.get('/eixos', (_req, res) => res.json({ eixos: eixosLib.definicoes(), temas: questionario.TEMAS }));
  api.get('/perfil/questionario', (_req, res) => res.json({ versao: 'v1', perguntas: questionario.perguntasPublicas(), temas: questionario.TEMAS,
    escala: ['Discordo totalmente', 'Discordo', 'Em parte / sem posição', 'Concordo', 'Concordo totalmente'], minimo: 8, recomendado: 20 }));
  api.post('/perfil/resultado', (req, res, next) => {
    try {
      let { respostas, importancias, codigo } = req.body || {};
      if (codigo) { const d = questionario.decodificar(codigo); if (!d) return next(ERR(400, 'Código de resultado inválido.')); respostas = d.respostas; importancias = importancias && Object.keys(importancias).length ? importancias : d.importancias; }
      res.json(perfilLib.resultado({ respostas: respostas || {}, importancias: importancias || {} }));
    } catch (e) { next(e); }
  });
  api.get('/perfil/resultado/:codigo', (req, res, next) => {
    try { const d = questionario.decodificar(req.params.codigo); if (!d) return next(ERR(400, 'Código de resultado inválido.')); res.json(perfilLib.resultado(d)); } catch (e) { next(e); }
  });
  api.post('/compatibilidade', (req, res, next) => { try { res.json(compat.calcular(req.body?.respostas, { limite: Math.min(100, +req.body?.limite || 100) })); } catch (e) { next(e); } });

  // ---------- Administração ----------
  const adm = express.Router(); adm.use(admin);
  adm.get('/ping', (_req, res) => res.json({ ok: true }));

  const CAMPOS = ['nome','categoria','situacao','resumo','origem_regiao_id','origem_texto','origem_lat','origem_lng','inicio_ano','inicio_aprox','fim_ano','periodo_texto','periodo_id','contexto_historico','historia','crencas_fundamentais','divindade','humanidade','alma_espirito','pos_morte','praticas_rituais','organizacao','relacao_outras','distribuicao','situacao_atual','controversias','adeptos_estimativa','verificacao'];
  function validar(b, criando) {
    if (criando && !b.nome) throw ERR(400, 'nome é obrigatório');
    if (b.categoria && !CATEGORIAS.includes(b.categoria)) throw ERR(400, 'categoria inválida');
    if (b.situacao && !SITUACOES.includes(b.situacao)) throw ERR(400, 'situação inválida');
    if (criando && (!b.categoria || !b.situacao || !b.resumo)) throw ERR(400, 'categoria, situacao e resumo são obrigatórios');
    if (b.fim_ano != null && b.inicio_ano != null && b.fim_ano < b.inicio_ano) throw ERR(400, 'fim_ano anterior ao inicio_ano');
    if (b.situacao === 'extinta' && b.situacao_atual && /praticad/i.test(b.situacao_atual) && !/n[ãa]o|extint|reconstr/i.test(b.situacao_atual)) throw ERR(400, 'tradição extinta não pode ser descrita como praticada atualmente');
  }
  function resolverPai(b) { if (b.parent_slug === undefined) return undefined; if (!b.parent_slug) return null; const p = db.prepare('SELECT id FROM tradicoes WHERE slug=?').get(b.parent_slug); if (!p) throw ERR(400, 'pai não encontrado'); return p.id; }
  function ciclo(id, paiId) { for (let c = paiId; c; c = db.prepare('SELECT parent_id FROM tradicoes WHERE id=?').get(c)?.parent_id) if (c === id) return true; return false; }
  function filhos(id, b) {
    if (b.nomes_alternativos) { db.prepare('DELETE FROM nomes_alternativos WHERE tradicao_id=?').run(id); for (const n of b.nomes_alternativos) db.prepare('INSERT OR IGNORE INTO nomes_alternativos(tradicao_id,nome,idioma,tipo) VALUES (?,?,?,?)').run(id, n.nome, n.idioma || null, n.tipo || 'alternativo'); }
    if (b.referencias) { db.prepare('DELETE FROM tradicao_referencias WHERE tradicao_id=?').run(id); for (const r of b.referencias) { const ref = db.prepare('SELECT id FROM referencias WHERE chave=?').get(r.chave); if (!ref) throw ERR(400, 'referência inexistente: ' + r.chave); db.prepare('INSERT OR IGNORE INTO tradicao_referencias VALUES (?,?,?)').run(id, ref.id, r.escopo || null); } }
    if (b.doutrinas) { db.prepare('DELETE FROM doutrinas WHERE tradicao_id=?').run(id); for (const d of b.doutrinas) {
      const o = db.prepare('SELECT o.id, o.dimensao_id FROM opcoes o JOIN dimensoes d ON d.id=o.dimensao_id WHERE d.chave=? AND o.chave=?').get(d.dimensao, d.opcao); if (!o) throw ERR(400, `opção inválida ${d.dimensao}.${d.opcao}`);
      db.prepare('INSERT OR REPLACE INTO doutrinas(tradicao_id,dimensao_id,opcao_id,peso,confianca,nota) VALUES (?,?,?,?,?,?)').run(id, o.dimensao_id, o.id, d.peso ?? 1, d.confianca ?? 0.6, d.nota || null); }
      compat.invalidar(); }
    if (b.crencas) { db.prepare('DELETE FROM crencas WHERE tradicao_id=?').run(id); for (const c of b.crencas) db.prepare('INSERT INTO crencas(tradicao_id,titulo,descricao,centralidade) VALUES (?,?,?,?)').run(id, c.titulo, c.descricao, c.centralidade || 2); }
    if (b.praticas) { db.prepare('DELETE FROM praticas WHERE tradicao_id=?').run(id); for (const c of b.praticas) db.prepare('INSERT INTO praticas(tradicao_id,nome,tipo,descricao) VALUES (?,?,?,?)').run(id, c.nome, c.tipo || 'ritual', c.descricao); }
  }

  adm.get('/tradicoes', (req, res) => {
    const st = req.query.status; res.json(db.prepare(`SELECT t.id, t.slug, t.nome, t.categoria, t.situacao, t.status_publicacao, t.verificacao, t.atualizado_em,
      (SELECT COUNT(*) FROM tradicao_referencias x WHERE x.tradicao_id=t.id) n_refs, (SELECT COUNT(DISTINCT dimensao_id) FROM doutrinas d WHERE d.tradicao_id=t.id) n_dim
      FROM tradicoes t ${st ? 'WHERE t.status_publicacao=?' : ''} ORDER BY t.atualizado_em DESC, t.nome`).all(...(st ? [st] : [])));
  });
  adm.get('/tradicoes/:slug', (req, res, next) => { const t = db.prepare('SELECT * FROM tradicoes WHERE slug=?').get(req.params.slug); if (!t) return next(ERR(404, 'não encontrada'));
    res.json({ ...t, parent_slug: t.parent_id ? db.prepare('SELECT slug FROM tradicoes WHERE id=?').get(t.parent_id).slug : null,
      nomes_alternativos: db.prepare('SELECT nome, idioma, tipo FROM nomes_alternativos WHERE tradicao_id=?').all(t.id),
      referencias: db.prepare('SELECT r.chave, tr.escopo FROM tradicao_referencias tr JOIN referencias r ON r.id=tr.referencia_id WHERE tr.tradicao_id=?').all(t.id),
      crencas: db.prepare('SELECT titulo, descricao, centralidade FROM crencas WHERE tradicao_id=?').all(t.id), praticas: db.prepare('SELECT nome, tipo, descricao FROM praticas WHERE tradicao_id=?').all(t.id),
      doutrinas: db.prepare('SELECT d.chave dimensao, o.chave opcao, x.peso, x.confianca, x.nota FROM doutrinas x JOIN dimensoes d ON d.id=x.dimensao_id JOIN opcoes o ON o.id=x.opcao_id WHERE x.tradicao_id=?').all(t.id) }); });

  adm.post('/tradicoes', (req, res, next) => { try {
    const b = req.body || {}; validar(b, true); const pai = resolverPai(b);
    const slug = slugify(b.slug || b.nome); if (db.prepare('SELECT 1 FROM tradicoes WHERE slug=?').get(slug)) throw ERR(409, 'já existe uma tradição com este slug');
    const dup = desc.acharDuplicatas(b.nome, (b.nomes_alternativos || []).map(n => n.nome)).filter(d => d.score >= 0.9);
    if (dup.length && !b.ignorar_duplicata) throw Object.assign(ERR(409, 'Possível duplicata: ' + dup.map(d => d.nome).join(', ') + '. Reenvie com ignorar_duplicata=true se for outra tradição.'), { duplicatas: dup });
    const id = transaction(() => {
      const cols = CAMPOS.filter(c => b[c] !== undefined);
      const id = Number(db.prepare(`INSERT INTO tradicoes(slug,parent_id,status_publicacao,${cols.join(',')}) VALUES (?,?,'rascunho',${cols.map(() => '?').join(',')})`).run(slug, pai ?? null, ...cols.map(c => b[c])).lastInsertRowid);
      filhos(id, b); reindexar(id); audit('criar', 'tradicao', id, { slug }); return id; });
    res.status(201).json({ id, slug });
  } catch (e) { next(e); } });

  adm.put('/tradicoes/:slug', (req, res, next) => { try {
    const t = db.prepare('SELECT * FROM tradicoes WHERE slug=?').get(req.params.slug); if (!t) throw ERR(404, 'não encontrada');
    const b = req.body || {}; validar({ ...t, ...b }, false); const pai = resolverPai(b);
    if (pai && ciclo(t.id, pai)) throw ERR(400, 'hierarquia circular não permitida');
    transaction(() => {
      const cols = CAMPOS.filter(c => b[c] !== undefined); const sets = cols.map(c => `${c}=?`); const vals = cols.map(c => b[c]);
      if (pai !== undefined) { sets.push('parent_id=?'); vals.push(pai); }
      if (sets.length) db.prepare(`UPDATE tradicoes SET ${sets.join(',')}, atualizado_em=datetime('now') WHERE id=?`).run(...vals, t.id);
      filhos(t.id, b); reindexar(t.id); audit('editar', 'tradicao', t.id, { campos: Object.keys(b) }); });
    res.json({ ok: true });
  } catch (e) { next(e); } });

  adm.post('/tradicoes/:slug/status', (req, res, next) => { try {
    const t = db.prepare('SELECT * FROM tradicoes WHERE slug=?').get(req.params.slug); if (!t) throw ERR(404, 'não encontrada');
    const { status } = req.body || {}; if (!STATUS.includes(status)) throw ERR(400, 'status inválido');
    if (status === 'publicado') {
      const nRefs = db.prepare('SELECT COUNT(*) c FROM tradicao_referencias WHERE tradicao_id=?').get(t.id).c;
      const faltas = []; if (!nRefs) faltas.push('ao menos uma referência bibliográfica'); if (!t.resumo) faltas.push('resumo'); if (!t.categoria) faltas.push('categoria');
      if (faltas.length) throw ERR(422, 'Para publicar é necessário: ' + faltas.join(', ') + '.');
    }
    db.prepare("UPDATE tradicoes SET status_publicacao=?, atualizado_em=datetime('now') WHERE id=?").run(status, t.id); reindexar(t.id); compat.invalidar(); audit('status', 'tradicao', t.id, { status });
    res.json({ ok: true });
  } catch (e) { next(e); } });

  adm.get('/referencias', (_req, res) => res.json(db.prepare('SELECT * FROM referencias ORDER BY autores').all()));
  adm.post('/referencias', (req, res, next) => { try { const b = req.body || {};
    if (!b.chave || !b.titulo || !b.tipo_fonte) throw ERR(400, 'chave, titulo e tipo_fonte são obrigatórios');
    const r = db.prepare('INSERT INTO referencias(chave,tipo_fonte,autores,titulo,ano,editora,local,url,doi,isbn,nota) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(b.chave, b.tipo_fonte, b.autores || null, b.titulo, b.ano || null, b.editora || null, b.local || null, b.url || null, b.doi || null, b.isbn || null, b.nota || null);
    audit('criar', 'referencia', Number(r.lastInsertRowid), { chave: b.chave }); res.status(201).json({ id: Number(r.lastInsertRowid) });
  } catch (e) { if (/UNIQUE/.test(e.message)) e = ERR(409, 'chave já existe'); next(e); } });

  adm.get('/candidatos', (req, res) => res.json(db.prepare(`SELECT c.*, f.nome fonte FROM candidatos c LEFT JOIN fontes_consultadas f ON f.id=c.fonte_id ${req.query.status ? 'WHERE c.status=?' : ''} ORDER BY c.criado_em DESC LIMIT 500`).all(...(req.query.status ? [req.query.status] : []))
    .map(c => ({ ...c, nomes_alternativos: JSON.parse(c.nomes_alternativos || '[]'), possiveis_duplicatas: JSON.parse(c.possiveis_duplicatas || '[]') }))));
  adm.post('/candidatos', (req, res, next) => { try {
    const lista = Array.isArray(req.body) ? req.body : req.body?.itens || [req.body];
    res.status(201).json(lista.map(i => desc.registrarCandidato(i)));
  } catch (e) { next(e); } });
  adm.post('/descoberta/wikidata', async (req, res, next) => { try { res.json(await desc.descobrirWikidata({ limite: Math.min(200, +req.body?.limite || 50), offset: +req.body?.offset || 0 })); }
    catch (e) { next(ERR(502, 'Não foi possível consultar o Wikidata agora: ' + e.message + '. Use a importação manual (POST /api/admin/candidatos).')); } });
  adm.get('/fontes', (_req, res) => res.json(db.prepare('SELECT * FROM fontes_consultadas').all()));
  adm.post('/candidatos/:id/rejeitar', (req, res) => { db.prepare("UPDATE candidatos SET status='rejeitado', notas_revisao=?, revisado_em=datetime('now') WHERE id=?").run(req.body?.notas || null, req.params.id); audit('rejeitar', 'candidato', +req.params.id); res.json({ ok: true }); });
  adm.post('/candidatos/:id/mesclar', (req, res, next) => { try {
    const c = db.prepare('SELECT * FROM candidatos WHERE id=?').get(req.params.id); if (!c) throw ERR(404, 'candidato não encontrado');
    const t = db.prepare('SELECT id FROM tradicoes WHERE slug=?').get(req.body?.slug); if (!t) throw ERR(400, 'tradição de destino não encontrada');
    transaction(() => { db.prepare('INSERT OR IGNORE INTO nomes_alternativos(tradicao_id,nome,tipo) VALUES (?,?,?)').run(t.id, c.nome, 'alternativo'); for (const n of JSON.parse(c.nomes_alternativos || '[]')) db.prepare('INSERT OR IGNORE INTO nomes_alternativos(tradicao_id,nome,tipo) VALUES (?,?,?)').run(t.id, n, 'alternativo');
      db.prepare("UPDATE candidatos SET status='mesclado', tradicao_id=?, revisado_em=datetime('now') WHERE id=?").run(t.id, c.id); reindexar(t.id); audit('mesclar', 'candidato', c.id, { destino: req.body.slug }); });
    res.json({ ok: true });
  } catch (e) { next(e); } });
  adm.post('/candidatos/:id/aprovar', (req, res, next) => { try {
    const c = db.prepare('SELECT * FROM candidatos WHERE id=?').get(req.params.id); if (!c) throw ERR(404, 'candidato não encontrado');
    const b = { nome: c.nome, ...req.body }; validar(b, true); const slug = slugify(b.slug || b.nome);
    if (db.prepare('SELECT 1 FROM tradicoes WHERE slug=?').get(slug)) throw ERR(409, 'slug já existe');
    const pai = resolverPai(b);
    const id = transaction(() => { const id = Number(db.prepare("INSERT INTO tradicoes(slug,nome,categoria,situacao,resumo,parent_id,status_publicacao) VALUES (?,?,?,?,?,?,'rascunho')").run(slug, b.nome, b.categoria, b.situacao, b.resumo, pai ?? null).lastInsertRowid);
      for (const n of JSON.parse(c.nomes_alternativos || '[]')) db.prepare('INSERT OR IGNORE INTO nomes_alternativos(tradicao_id,nome,tipo) VALUES (?,?,?)').run(id, n, 'alternativo');
      db.prepare("UPDATE candidatos SET status='aprovado', tradicao_id=?, revisado_em=datetime('now'), notas_revisao=? WHERE id=?").run(id, b.notas || null, c.id); reindexar(id); audit('aprovar', 'candidato', c.id, { slug }); return id; });
    res.status(201).json({ id, slug, aviso: 'Criado como rascunho. Complete o perfil, adicione referências acadêmicas e publique.' });
  } catch (e) { next(e); } });
  adm.get('/auditoria', (_req, res) => res.json(db.prepare('SELECT * FROM auditoria ORDER BY id DESC LIMIT 200').all()));
  adm.get('/qualidade', (_req, res) => res.json(db.prepare(`SELECT t.slug, t.nome,
      (SELECT COUNT(*) FROM tradicao_referencias x WHERE x.tradicao_id=t.id) refs,
      (SELECT COUNT(DISTINCT dimensao_id) FROM doutrinas d WHERE d.tradicao_id=t.id) dimensoes,
      (SELECT AVG(confianca) FROM doutrinas d WHERE d.tradicao_id=t.id) conf_media, t.verificacao
      FROM tradicoes t WHERE t.status_publicacao='publicado' AND t.categoria!='familia_religiosa' ORDER BY dimensoes, refs`).all()));

  api.use('/admin', adm);
  api.use((_req, _res, next) => next(ERR(404, 'Rota da API não encontrada.')));
  app.use('/api', api);

  const pub = path.join(__dirname, '..', 'public');
  app.use(express.static(pub, { extensions: ['html'] }));
  app.use('/vendor/leaflet', express.static(path.join(__dirname, '..', 'node_modules', 'leaflet', 'dist')));
  app.use('/vendor/qrcode', express.static(path.join(__dirname, '..', 'node_modules', 'qrcode-generator')));
  app.use('/vendor/fonts', express.static(path.join(__dirname, '..', 'node_modules', '@fontsource-variable')));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(pub, 'index.html')));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    const status = err.status || (err.type === 'entity.parse.failed' ? 400 : 500);
    if (status === 500) console.error(err);
    res.status(status).json({ erro: status === 500 ? 'Erro interno do servidor.' : err.message, ...(err.duplicatas ? { duplicatas: err.duplicatas } : {}) });
  });
  app.locals.adminToken = ADMIN_TOKEN;
  return app;
}

if (require.main === module) {
  const app = criarApp(); const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Mapa de Crenças em http://localhost:${port}\nToken administrativo: ${app.locals.adminToken}`));
}
module.exports = { criarApp };
