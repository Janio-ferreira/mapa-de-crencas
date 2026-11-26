#!/usr/bin/env node
'use strict';
/* Uso: node --no-warnings scripts/importar-imagens.js imagens.json [--verificada]
 * O JSON é uma lista de objetos { entidade_tipo, entidade_slug, papel, arquivo_url, alt, autor, licenca, fonte_nome, fonte_url, ... }.
 * Valida licença, fonte e existência da entidade; registra com verificada=0 (use --verificada, ou "conferido": true no item, só depois de conferir a página de origem). */
const fs = require('fs'); const imagens = require('../server/lib/imagens');
const arq = process.argv[2]; if (!arq) { console.error('Informe o arquivo JSON.'); process.exit(1); }
const marcar = process.argv.includes('--verificada'); let ok = 0, falhas = 0;
for (const i of JSON.parse(fs.readFileSync(arq, 'utf8'))) {
  try { imagens.cadastrar({ ...i, verificada: marcar || i.verificada || i.conferido === true }); ok++; } catch (e) { falhas++; console.error(`✗ ${i.entidade_slug || '?'}: ${e.message}`); }
}
console.log(`${ok} cadastrada(s), ${falhas} recusada(s).`);
