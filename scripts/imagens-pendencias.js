#!/usr/bin/env node
'use strict';
/**
 * Gera importacao/lista-de-tradicoes.csv e importacao/lista-de-pessoas.csv: o roteiro para quem vai coletar as imagens em um
 * computador com internet (slug exato, nome, nomes alternativos, categoria, vida/período e situação atual de imagens verificadas).
 *   node --no-warnings scripts/imagens-pendencias.js
 */
const fs = require('fs'); const path = require('path');
const { db } = require('../server/lib/db'); const { seed } = require('../server/seed'); seed(); require('../server/seed/aplicar_eixos').aplicar();
const csv = l => l.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');
const out = path.join(__dirname, '..', 'importacao'); fs.mkdirSync(out, { recursive: true });
const verif = new Set(db.prepare("SELECT entidade_tipo||':'||entidade_slug k FROM imagens WHERE verificada=1").all().map(r => r.k));
const pend = new Set(db.prepare("SELECT entidade_tipo||':'||entidade_slug k FROM imagens WHERE verificada=0").all().map(r => r.k));
const alt = db.prepare("SELECT t.slug, group_concat(n.nome, ' | ') a FROM tradicoes t LEFT JOIN nomes_alternativos n ON n.tradicao_id=t.id GROUP BY t.id");
let altMap = {}; try { for (const r of alt.all()) altMap[r.slug] = r.a; } catch { /* tabela com outro nome: segue sem alternativos */ }
const trad = db.prepare('SELECT slug, nome, categoria, periodo_texto, situacao FROM tradicoes ORDER BY nome').all();
fs.writeFileSync(path.join(out, 'lista-de-tradicoes.csv'), '﻿' + [csv(['entidade_tipo', 'entidade_slug', 'nome', 'nomes_alternativos', 'categoria', 'periodo', 'situacao_imagens', 'sugestao_de_categorias'])].concat(trad.map(t =>
  csv(['tradicao', t.slug, t.nome, altMap[t.slug] || '', t.categoria, t.periodo_texto, verif.has('tradicao:' + t.slug) ? 'verificada' : pend.has('tradicao:' + t.slug) ? 'aguardando verificação' : 'sem imagem', 'local sagrado; símbolo; escritura; cerimônia; arte (só o que existir e se aplicar)']))).join('\n'));
const pes = require('../server/lib/pessoas').relatorio();
fs.writeFileSync(path.join(out, 'lista-de-pessoas.csv'), '﻿' + [csv(['entidade_tipo', 'entidade_slug', 'nome', 'vida', 'situacao_imagens', 'regra'])].concat(pes.map(p =>
  csv([p.tipo, p.slug, p.nome, p.vida, verif.has(p.tipo + ':' + p.slug) ? 'verificada' : pend.has(p.tipo + ':' + p.slug) ? 'aguardando verificação' : 'sem imagem', 'papel=retrato; informar tipo_representacao e instituicao; nada de fotografia de quem morreu antes de 1839; sem retrato conhecido → deixe sem imagem']))).join('\n'));
console.log(`importacao/lista-de-tradicoes.csv (${trad.length}) e importacao/lista-de-pessoas.csv (${pes.length}) gerados.`);
