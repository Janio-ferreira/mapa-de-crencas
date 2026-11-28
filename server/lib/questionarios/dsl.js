'use strict';
/** Auxiliares para escrever perguntas de forma compacta. Efeito = 'dim:opcao[:massa]' separados por espaço (massa padrão 1). */
const E = s => String(s || '').trim().split(/\s+/).filter(Boolean).map(x => { const [dim, opcao, m] = x.split(':'); return { dim, opcao, massa: m === undefined ? 1 : parseFloat(m) }; });
/** Escala clássica: S(v1, v2, v4, v5) — v3 ("em parte") não gera efeito. */
const S = (a, b, c, d) => [a, b, '', c, d];
const esc = (id, tema, texto, efeitos, extra = {}) => ({ id, tema, tipo: 'escala', texto, efeitos: efeitos.map(E), ...extra });
const esl = (id, tema, texto, opcoes, extra = {}) => ({ id, tema, tipo: 'escolha', texto, opcoes: opcoes.map(([t, e, x]) => ({ t, e: E(e), ...(x || {}) })), ...extra });
const escala = (s, k) => E(s).map(e => ({ ...e, massa: +(e.massa * k).toFixed(3) }));
/** ES: escala em que concordar (4–5) reforça A e discordar (1–2) reforça B (opcional). Concordo/Discordo (sem "totalmente") valem metade. */
const ES = (id, tema, texto, A, B = '', extra = {}) => ({ id, tema, tipo: 'escala', texto, efeitos: [escala(B, 1), escala(B, .5), [], escala(A, .5), escala(A, 1)], p: 0.7, ...extra });
/** Acrescenta um subtema (rótulo de seção) a um grupo de perguntas. */
const blk = (sub, lista) => lista.map(q => ({ ...q, sub }));
module.exports = { E, S, esc, esl, ES, blk };
