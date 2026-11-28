#!/usr/bin/env node
'use strict';
/**
 * Importa um pacote de imagens baixadas externamente (pasta com os arquivos + manifesto.csv ou manifesto.json).
 *   node --no-warnings scripts/importar-pacote.js validar  <pasta>   # só confere; não altera nada
 *   node --no-warnings scripts/importar-pacote.js importar <pasta>   # importa as linhas válidas; registra como NÃO verificadas
 *   node --no-warnings scripts/importar-pacote.js auditar            # confere os arquivos locais do projeto
 *   node --no-warnings scripts/importar-pacote.js pendentes          # imagens aguardando aprovação humana
 * A aprovação (verificada=1) é feita por uma pessoa: painel admin → Imagens → verificar. Este script nunca aprova.
 */
const fs = require('fs'); const path = require('path');
const { seed } = require('../server/seed'); seed(); require('../server/seed/aplicar_eixos').aplicar(); // garante o catálogo (idempotente)
const P = require('../server/lib/pacote_imagens');
const [cmd, pasta] = process.argv.slice(2);
function relatorio(r, rotulo) {
  if (r.fatal) { console.error('✗ ' + r.fatal); process.exit(2); }
  for (const i of r.itens) {
    const f = `linha ${i.linha} · ${i.arquivo || '(sem arquivo)'}`;
    if (i.erros.length) console.log(`✗ ${f}\n    ${i.erros.join('\n    ')}`);
    else console.log(`✓ ${f}  [${i.info.largura}×${i.info.altura}px, ${(i.info.bytes / 1024).toFixed(0)} KB]${i.importada ? ' → ' + i.destino : ''}`);
    i.avisos.forEach(a => console.log(`    ⚠ ${a}`));
  }
  if (r.orfaos.length) console.log(`\n⚠ ${r.orfaos.length} arquivo(s) no pacote que não constam no manifesto:\n   ` + r.orfaos.join('\n   '));
  console.log(`\n${rotulo}: ${r.resumo.total} linha(s) · ${r.resumo.validas} válida(s) · ${r.resumo.recusadas} recusada(s)` + (r.importadas != null ? ` · ${r.importadas} importada(s) (todas aguardando verificação humana)` : ''));
  const rel = path.join(__dirname, '..', 'data', 'relatorio-importacao.json'); fs.mkdirSync(path.dirname(rel), { recursive: true });
  fs.writeFileSync(rel, JSON.stringify({ quando: new Date().toISOString(), pasta, resumo: r.resumo, importadas: r.importadas ?? 0, itens: r.itens.map(i => ({ linha: i.linha, arquivo: i.arquivo, erros: i.erros, avisos: i.avisos, destino: i.destino || null })) }, null, 2));
  process.exit(r.resumo.recusadas && cmd === 'validar' ? 1 : 0);
}
if (cmd === 'validar' && pasta) relatorio(P.validarPacote(path.resolve(pasta)), 'Validação');
else if (cmd === 'importar' && pasta) relatorio(P.importarPacote(path.resolve(pasta)), 'Importação');
else if (cmd === 'auditar') {
  // O banco só recebe as imagens do manifesto quando o servidor inicia OU aqui. Restaurar é seguro: só ADICIONA o que falta, nunca aprova, nunca apaga.
  if (!process.argv.includes('--somente-leitura')) { try { P.reimportarTradicoes(); require('../server/lib/retratos_store').reimportar(); } catch (e) { console.error('✗ restauração: ' + e.message); } }
  const a = P.auditoriaCompleta(); const { quebradas, amostraSemArquivo, amostraOrfaos, ...resto } = a;
  console.log(JSON.stringify({ ...resto, quebradas: quebradas.length }, null, 2));
  quebradas.forEach(q => console.log(`✗ ${q.entidade_tipo}:${q.entidade_slug} → ${q.arquivo_url} (ausente ou inválida)`));
  amostraSemArquivo.forEach(u => console.log(`✗ manifesto sem arquivo: ${u}`)); amostraOrfaos.forEach(u => console.log(`? arquivo sem registro no manifesto: ${u}`));
  if (a.manifestoErro) console.log('✗ ' + a.manifestoErro);
  if (a.restauracao && a.restauracao.rejeitadas.length) { console.log('✗ rejeitadas na restauração:'); a.restauracao.rejeitadas.slice(0, 20).forEach(x => console.log('   ', x.slug, x.erro)); }
  console.log(`\nConferir: manifesto.semArquivo = 0, orfaosSemRegistro = 0, quebradas = 0, verificadasSemArquivo = 0. Nada é aprovado automaticamente (verificadas deve refletir só o que VOCÊ aprovou).`);
  process.exit(a.manifestoErro || a.manifesto.semArquivo || quebradas.length ? 3 : 0);
}
else if (cmd === 'pendentes') {
  const { db } = require('../server/lib/db');
  const l = db.prepare('SELECT id, entidade_tipo t, entidade_slug s, papel, autor, licenca, fonte_url FROM imagens WHERE verificada=0 ORDER BY 2,3').all();
  l.forEach(i => console.log(`#${i.id} ${i.t}:${i.s} (${i.papel}) — ${i.autor} — ${i.licenca}\n     ${i.fonte_url}`)); console.log(`\n${l.length} aguardando verificação humana.`);
} else { console.error('Uso: validar <pasta> | importar <pasta> | auditar | pendentes'); process.exit(1); }
