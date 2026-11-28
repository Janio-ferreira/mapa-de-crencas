'use strict';
const fs = require('fs'); const path = require('path');
/** Lê um JSON. Arquivo ausente → `padrao`. Arquivo corrompido → ERRO (nunca devolve vazio em silêncio, para que nada seja sobrescrito por engano). */
function lerJSON(arquivo, padrao = []) {
  let txt;
  try { txt = fs.readFileSync(arquivo, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return padrao; throw e; }
  try { return JSON.parse(txt); }
  catch (e) { throw new Error(`Arquivo JSON corrompido: ${arquivo} (${e.message}). Nada foi sobrescrito; restaure o arquivo .bak ao lado dele, se existir.`); }
}
/** Grava de forma atômica (arquivo temporário + renomear) e guarda a versão anterior em <arquivo>.bak. */
function gravarJSON(arquivo, dados) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const tmp = `${arquivo}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 2));
  if (fs.existsSync(arquivo)) { try { fs.copyFileSync(arquivo, `${arquivo}.bak`); } catch { /* melhor esforço */ } }
  fs.renameSync(tmp, arquivo);
}
module.exports = { lerJSON, gravarJSON };
