'use strict';
/**
 * Migração idempotente do sistema de 12 eixos: dimensões novas (revelação, pluralismo, organização),
 * doutrinas correspondentes (apenas onde documentadas) e pensadores/escolas. Pode rodar em bancos já existentes.
 */
const { db, transaction } = require('../lib/db');
const novas = require('./dimensoes_eixos');
const { DADOS, expandir } = require('./eixos_extra');

function aplicar() {
  const avisos = [];
  const tem = db.prepare('SELECT COUNT(*) c FROM tradicoes').get().c;
  if (!tem) return { avisos };
  transaction(() => {
    let ordem = db.prepare('SELECT COALESCE(MAX(ordem),0) m FROM dimensoes').get().m;
    for (const d of novas) {
      let row = db.prepare('SELECT id FROM dimensoes WHERE chave=?').get(d.chave);
      if (!row) {
        const r = db.prepare('INSERT INTO dimensoes(chave,nome,pergunta,descricao,ordem,peso_base) VALUES (?,?,?,?,?,?)').run(d.chave, d.nome, d.pergunta, d.descricao, ++ordem, d.peso_base);
        row = { id: Number(r.lastInsertRowid) };
      }
      const O = {};
      d.opcoes.forEach(([k, nome, desc], j) => {
        db.prepare('INSERT OR IGNORE INTO opcoes(dimensao_id,chave,nome,descricao,ordem) VALUES (?,?,?,?,?)').run(row.id, k, nome, desc, j);
        O[k] = db.prepare('SELECT id FROM opcoes WHERE dimensao_id=? AND chave=?').get(row.id, k).id;
      });
      for (const [a, b, v, j] of d.sim) for (const [x, y] of [[a, b], [b, a]])
        db.prepare('INSERT OR IGNORE INTO similaridade_opcoes(opcao_a,opcao_b,valor,justificativa) VALUES (?,?,?,?)').run(O[x], O[y], v, j);
      // doutrinas: só insere para tradições sem dado nessa dimensão (não sobrescreve curadoria feita pelo admin)
      for (const slug of Object.keys(DADOS)) {
        const t = db.prepare('SELECT id FROM tradicoes WHERE slug=?').get(slug);
        if (!t) { if (d === novas[0]) avisos.push(`eixos_extra: slug inexistente ${slug}`); continue; }
        const ex = expandir(slug)[d.chave]; if (!ex) continue;
        if (db.prepare('SELECT 1 FROM doutrinas WHERE tradicao_id=? AND dimensao_id=?').get(t.id, row.id)) continue;
        const soma = ex.itens.reduce((a, i) => a + i.peso, 0);
        for (const it of ex.itens) db.prepare('INSERT OR IGNORE INTO doutrinas(tradicao_id,dimensao_id,opcao_id,peso,confianca,nota) VALUES (?,?,?,?,?,?)')
          .run(t.id, row.id, O[it.chave], it.peso / soma, ex.conf, 'Generalização de curadoria inicial para uma tradição internamente diversa; sujeita a revisão acadêmica.');
      }
    }
  });
  try { require('./pensadores').aplicar(avisos); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; }
  return { avisos };
}
module.exports = { aplicar };
if (require.main === module) console.log(JSON.stringify(aplicar(), null, 1));
