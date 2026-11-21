'use strict';
/**
 * Carga inicial do banco. Idempotente: roda só se o catálogo estiver vazio (ou com --reset).
 * Valida referências e pesos; avisa (não inventa) quando algo falta.
 */
const { db, transaction, slugify, reindexar } = require('../lib/db');
const base = require('./base');
const dimensoes = require('./dimensoes');
const partes = [
  require('./t1_judaismo_cristianismo'), require('./t2_islamismo_oriente_proximo'),
  require('./t3_indianas'), require('./t4_asia_oriental_antiguidade'), require('./t5_africa_diaspora_indigenas'), require('./t6_expansao_1'), require('./t7_subdivisoes'), require('./t8_indigenas_africa_2'), require('./t9_asia_2'), require('./t10_movimentos_modernos'), require('./t11_antiguidade_2'), require('./t12_ramos'), require('./t13_americas_oceania'), require('./t14_oriente_india'), require('./t15_escolas_budistas'), require('./t16_vertentes_2'), require('./t17_movimentos_2'), require('./t18_povos_3'), require('./t19_islam_escolas'), require('./t20_hindu_escolas'),
];

function parseD(str) {
  // 'a:.6|b:.4@.8' -> { itens:[{chave,peso}], conf }
  const [lista, conf] = String(str).split('@');
  const itens = lista.split('|').map(s => { const [k, p] = s.split(':'); return { chave: k.trim(), peso: p === undefined ? 1 : parseFloat(p) }; });
  const soma = itens.reduce((a, i) => a + i.peso, 0);
  itens.forEach(i => { i.peso = i.peso / soma; });
  return { itens, conf: conf === undefined ? 0.8 : parseFloat(conf) };
}

function seed({ reset = false } = {}) {
  const n = db.prepare('SELECT COUNT(*) c FROM tradicoes').get().c;
  if (n > 0 && !reset) return { pulado: true, total: n };
  const avisos = [];
  transaction(() => {
    if (reset) for (const t of ['doutrinas','relacoes','tradicao_referencias','tradicao_textos','tradicao_figuras','tradicao_regioes','nomes_alternativos','crencas','praticas','candidatos','tradicoes','busca','similaridade_opcoes','opcoes','dimensoes','referencias','textos_sagrados','figuras','regioes','periodos','fontes_consultadas','pensador_eixos','pensadores']) db.exec(`DELETE FROM ${t}`);

    const R = {};
    for (const [slug, nome, tipo, pai, lat, lng] of base.regioes)
      R[slug] = Number(db.prepare('INSERT INTO regioes(slug,nome,tipo,parent_id,lat,lng) VALUES (?,?,?,?,?,?)').run(slug, nome, tipo, pai ? R[pai] : null, lat, lng).lastInsertRowid);
    const P = [];
    for (const [slug, nome, ini, fim, ordem] of base.periodos)
      P.push({ id: Number(db.prepare('INSERT INTO periodos(slug,nome,inicio,fim,ordem) VALUES (?,?,?,?,?)').run(slug, nome, ini, fim, ordem).lastInsertRowid), ini, fim });
    const REF = {};
    for (const [chave, tipo, autores, titulo, ano, editora, local, url, nota] of base.referencias)
      REF[chave] = Number(db.prepare('INSERT INTO referencias(chave,tipo_fonte,autores,titulo,ano,editora,local,url,nota) VALUES (?,?,?,?,?,?,?,?,?)').run(chave, tipo, autores, titulo, ano, editora, local, url || null, nota || null).lastInsertRowid);

    // Dimensões, opções e similaridades
    const DIM = {}, OPC = {};
    dimensoes.forEach((d, i) => {
      const did = Number(db.prepare('INSERT INTO dimensoes(chave,nome,pergunta,descricao,ordem,peso_base) VALUES (?,?,?,?,?,?)').run(d.chave, d.nome, d.pergunta, d.descricao, i + 1, d.peso_base).lastInsertRowid);
      DIM[d.chave] = did; OPC[d.chave] = {};
      d.opcoes.forEach(([k, nome, desc], j) => { OPC[d.chave][k] = Number(db.prepare('INSERT INTO opcoes(dimensao_id,chave,nome,descricao,ordem) VALUES (?,?,?,?,?)').run(did, k, nome, desc, j).lastInsertRowid); });
      for (const [a, b, v, just] of d.sim) {
        if (!OPC[d.chave][a] || !OPC[d.chave][b]) { avisos.push(`sim inválida ${d.chave}: ${a}/${b}`); continue; }
        for (const [x, y] of [[a, b], [b, a]]) db.prepare('INSERT OR REPLACE INTO similaridade_opcoes(opcao_a,opcao_b,valor,justificativa) VALUES (?,?,?,?)').run(OPC[d.chave][x], OPC[d.chave][y], v, just);
      }
    });

    db.prepare("INSERT INTO fontes_consultadas(slug,nome,tipo,url,confiabilidade) VALUES ('wikidata','Wikidata (base de conhecimento aberta)','base_de_conhecimento','https://www.wikidata.org','baixa')").run();
    db.prepare("INSERT INTO fontes_consultadas(slug,nome,tipo,confiabilidade) VALUES ('manual','Importação manual / CSV','importacao_manual','media')").run();

    const todas = partes.flat();
    const T = {}, FIG = {}, TXT = {};
    // 1ª passada: tradições
    for (const t of todas) {
      if (T[t.slug]) { avisos.push('slug duplicado ' + t.slug); continue; }
      const per = P.find(p => t.inicio != null && (p.ini == null || t.inicio >= p.ini) && (p.fim == null || t.inicio < p.fim)) || (t.inicio == null ? null : P[P.length - 1]);
      T[t.slug] = Number(db.prepare(`INSERT INTO tradicoes(slug,nome,categoria,situacao,resumo,origem_regiao_id,origem_texto,origem_lat,origem_lng,inicio_ano,fim_ano,periodo_texto,periodo_id,
        contexto_historico,historia,crencas_fundamentais,divindade,humanidade,alma_espirito,pos_morte,praticas_rituais,organizacao,relacao_outras,distribuicao,situacao_atual,controversias,adeptos_estimativa,status_publicacao)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'publicado')`).run(
        t.slug, t.nome, t.cat, t.sit, t.resumo, R[t.regiao] ?? null, t.origem?.[0] ?? null, t.origem?.[1] ?? null, t.origem?.[2] ?? null,
        t.inicio ?? null, t.fim ?? null, t.periodo ?? null, per ? per.id : null,
        t.contexto ?? null, t.historia ?? null, (t.crencas || []).map(c => `${c[0]}: ${c[1]}`).join(' '), t.divindade ?? null, t.humanidade ?? null, t.alma ?? null, t.posmorte ?? null,
        (t.praticas || []).map(p => `${p[0]}: ${p[2]}`).join(' '), t.organizacao ?? null, t.relacao ?? null, t.distribuicao ?? null, t.atual ?? null, t.controversias ?? null, t.adeptos ?? null).lastInsertRowid);
      if (R[t.regiao] == null) avisos.push(`região desconhecida em ${t.slug}: ${t.regiao}`);
    }
    // 2ª passada: hierarquia, filhos, relações
    for (const t of todas) {
      const id = T[t.slug];
      if (t.pai) { if (!T[t.pai]) avisos.push(`pai ausente ${t.slug} -> ${t.pai}`); else db.prepare('UPDATE tradicoes SET parent_id=? WHERE id=?').run(T[t.pai], id); }
      for (const [nome, idioma, tipo] of t.alt || []) db.prepare('INSERT OR IGNORE INTO nomes_alternativos(tradicao_id,nome,idioma,tipo) VALUES (?,?,?,?)').run(id, nome, idioma, tipo);
      for (const r of t.dist || []) { if (!R[r]) avisos.push(`região dist ${r}`); else db.prepare("INSERT OR IGNORE INTO tradicao_regioes VALUES (?,?,'distribuicao')").run(id, R[r]); }
      for (const [c, d, cent] of t.crencas || []) db.prepare('INSERT INTO crencas(tradicao_id,titulo,descricao,centralidade) VALUES (?,?,?,?)').run(id, c, d, cent);
      for (const [n, tipo, d] of t.praticas || []) db.prepare('INSERT INTO praticas(tradicao_id,nome,tipo,descricao) VALUES (?,?,?,?)').run(id, n, tipo, d);
      for (const [s, nome, desc, hist, papel, nota] of t.fundadores || []) {
        if (!FIG[s]) FIG[s] = Number(db.prepare('INSERT INTO figuras(slug,nome,descricao,historicidade) VALUES (?,?,?,?)').run(s, nome, desc, hist).lastInsertRowid);
        db.prepare('INSERT OR IGNORE INTO tradicao_figuras VALUES (?,?,?,?)').run(id, FIG[s], papel, nota);
      }
      for (const [s, nome, tipo, desc, aut] of t.textos || []) {
        if (!TXT[s]) TXT[s] = Number(db.prepare('INSERT INTO textos_sagrados(slug,nome,tipo,descricao) VALUES (?,?,?,?)').run(s, nome, tipo, desc).lastInsertRowid);
        db.prepare('INSERT OR IGNORE INTO tradicao_textos VALUES (?,?,?)').run(id, TXT[s], aut);
      }
      for (const [k, escopo] of t.refs || []) { if (!REF[k]) avisos.push(`ref ausente ${k} em ${t.slug}`); else db.prepare('INSERT OR IGNORE INTO tradicao_referencias VALUES (?,?,?)').run(id, REF[k], escopo); }
      for (const [tipo, dest, desc] of t.rel || []) { if (!T[dest]) avisos.push(`relação para slug ausente ${t.slug} -> ${dest} (ignorada)`); else db.prepare('INSERT OR IGNORE INTO relacoes(origem_id,destino_id,tipo,descricao) VALUES (?,?,?,?)').run(id, T[dest], tipo, desc); }
      // doutrinas
      for (const [dim, str] of Object.entries(t.d || {})) {
        if (!DIM[dim]) { avisos.push(`dimensão ${dim} em ${t.slug}`); continue; }
        const { itens, conf } = parseD(str);
        for (const it of itens) {
          if (!OPC[dim][it.chave]) { avisos.push(`opção ${dim}.${it.chave} em ${t.slug}`); continue; }
          db.prepare('INSERT OR REPLACE INTO doutrinas(tradicao_id,dimensao_id,opcao_id,peso,confianca,nota) VALUES (?,?,?,?,?,?)').run(id, DIM[dim], OPC[dim][it.chave], Math.min(1, Math.max(0.0001, it.peso)), conf, t.dn?.[dim] ?? null);
        }
      }
    }
    for (const id of Object.values(T)) reindexar(id);
  });
  try { avisos.push(...require('./aplicar_eixos').aplicar().avisos); } catch (e) { avisos.push('aplicar_eixos: ' + e.message); }
  return { total: db.prepare('SELECT COUNT(*) c FROM tradicoes').get().c, avisos };
}
module.exports = { seed };
if (require.main === module) { const r = seed({ reset: process.argv.includes('--reset') }); console.log(JSON.stringify(r, null, 2)); }
