/* Símbolos e ilustrações ORIGINAIS do Mapa de Crenças (geometria simples; nada copiado de obra protegida).
 * - simbolo(chave): emblema geométrico amplamente associado a uma tradição (nota de cautela vem do servidor).
 * - emblemaPerfil(id): ilustração abstrata do perfil descritivo — não representa pessoa, local nem fato histórico.
 * - padrao(slug): fundo gerado determinístico, usado quando não há fotografia verificada. */
const estrela = (n, R, r, rot = -90) => Array.from({ length: n * 2 }, (_, i) => { const a = (rot + i * 180 / n) * Math.PI / 180, k = i % 2 ? r : R; return `${(50 + k * Math.cos(a)).toFixed(1)},${(50 + k * Math.sin(a)).toFixed(1)}`; }).join(' ');
const pent = Array.from({ length: 5 }, (_, i) => { const a = (-90 + i * 144) * Math.PI / 180; return `${(50 + 36 * Math.cos(a)).toFixed(1)},${(50 + 36 * Math.sin(a)).toFixed(1)}`; }).join(' ');
const S = { stroke: 'currentColor', fill: 'none', 'stroke-width': 6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
const attr = o => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
const SIMBOLOS = {
  cruz: '<rect x="44" y="10" width="12" height="80" rx="2"/><rect x="22" y="32" width="56" height="12" rx="2"/>',
  estrela_david: `<g ${attr(S)}><polygon points="50,10 88,76 12,76"/><polygon points="50,90 88,24 12,24"/></g>`,
  crescente: '<path d="M77.6 21A40 40 0 1 0 77.6 79A32 32 0 1 1 77.6 21Z"/><polygon points="70,41 72.4,47.6 79.5,47.8 73.9,52.1 75.9,58.9 70,55 64.1,58.9 66.1,52.1 60.5,47.8 67.6,47.6"/>',
  dharmachakra: `<g ${attr(S)}><circle cx="50" cy="50" r="38"/><circle cx="50" cy="50" r="8"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${50 + 8 * Math.cos(a)}" y1="${50 + 8 * Math.sin(a)}" x2="${50 + 38 * Math.cos(a)}" y2="${50 + 38 * Math.sin(a)}"/>`; }).join('')}</g>`,
  taijitu: '<circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="5"/><path d="M50 10A40 40 0 0 1 50 90A20 20 0 0 1 50 50A20 20 0 0 0 50 10Z"/><circle cx="50" cy="30" r="6" fill="var(--sym-bg,#f6efe3)"/><circle cx="50" cy="70" r="6"/>',
  torii: '<path d="M6 22Q50 10 94 22L94 32L6 32Z"/><rect x="16" y="40" width="68" height="8"/><rect x="24" y="32" width="9" height="58"/><rect x="67" y="32" width="9" height="58"/>',
  estrela9: `<polygon points="${estrela(9, 44, 20)}" fill="currentColor"/>`,
  pentaculo: `<g ${attr(S)}><circle cx="50" cy="50" r="42"/><polygon points="${pent.split(' ')[0]} ${pent.split(' ')[2]} ${pent.split(' ')[4]} ${pent.split(' ')[1]} ${pent.split(' ')[3]}"/></g>`,
  ankh: `<g ${attr({ ...S, 'stroke-width': 9 })}><ellipse cx="50" cy="29" rx="15" ry="19"/><line x1="50" y1="48" x2="50" y2="92"/><line x1="28" y1="58" x2="72" y2="58"/></g>`,
  menorah: `<g ${attr({ ...S, 'stroke-width': 5 })}><path d="M16 26V46A34 34 0 0 0 84 46V26"/><path d="M33 26V46A17 17 0 0 0 67 46V26"/><line x1="50" y1="26" x2="50" y2="86"/><line x1="30" y1="88" x2="70" y2="88"/></g>${[16, 33, 50, 67, 84].map(x => `<ellipse cx="${x}" cy="19" rx="3" ry="5" fill="currentColor"/>`).join('')}`,
};
export const temSimbolo = c => !!SIMBOLOS[c];
export function simbolo(chave, { tam = 40, cor = 'currentColor', rotulo = '' } = {}) {
  const corpo = SIMBOLOS[chave]; if (!corpo) return '';
  return `<svg class="simbolo" viewBox="0 0 100 100" width="${tam}" height="${tam}" style="color:${cor}" fill="currentColor" role="img" aria-label="${rotulo || 'Símbolo'}">${corpo}</svg>`;
}
export const simboloComoSVG = (chave, cor) => SIMBOLOS[chave] ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200" fill="${cor}" color="${cor}" style="--sym-bg:#f6efe3">${SIMBOLOS[chave].replace(/currentColor/g, cor)}</svg>` : null;

const A = '#b4532a', T = '#1f5f63', O = '#a56b00', P = '#6b4c9a';
const circ = (cx, cy, r, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" ${extra}/>`;
const EMBLEMAS = {
  'fiel-da-tradicao': () => [60, 44, 28].map((r, i) => `<path d="M${50 - r} 92V${50 + 8}A${r} ${r} 0 0 1 ${50 + r} ${58}V92" fill="none" stroke="${[A, O, T][i]}" stroke-width="5"/>`).join('') + circ(50, 28, 5, `fill="${A}"`),
  'devoto-comunitario-aberto': () => Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return circ(50 + 34 * Math.cos(a), 50 + 34 * Math.sin(a), 6, `fill="${i % 2 ? T : A}"`); }).join('') + circ(50, 50, 14, `fill="none" stroke="${O}" stroke-width="4"`) + circ(50, 50, 4, `fill="${A}"`),
  'reverente-dos-muitos-poderes': () => { const p = [[20, 24, 6], [48, 14, 4], [78, 26, 7], [30, 58, 4], [62, 52, 6], [84, 70, 4], [44, 84, 7], [14, 80, 4]]; return p.slice(1).map((q, i) => `<line x1="${p[i][0]}" y1="${p[i][1]}" x2="${q[0]}" y2="${q[1]}" stroke="${O}" stroke-width="1.5" opacity=".6"/>`).join('') + p.map(([x, y, r], i) => circ(x, y, r, `fill="${[A, T, O, P][i % 4]}"`)).join(''); },
  'mistico-pluralista': () => Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return circ(50 + 18 * Math.cos(a), 50 + 18 * Math.sin(a), 20, `fill="none" stroke="${[A, T, O, P, A, T][i]}" stroke-width="3"`); }).join('') + circ(50, 50, 5, `fill="${A}"`),
  'esoterico-sincretico': () => [0, 15, 30, 45, 60, 75].map((r, i) => `<rect x="22" y="22" width="56" height="56" fill="none" stroke="${[A, T, O, P, A, T][i]}" stroke-width="2.5" transform="rotate(${r} 50 50)"/>`).join('') + circ(50, 50, 6, `fill="${O}"`),
  'crente-independente': () => `<path d="M12 90C40 86 30 62 52 58S70 40 56 30" fill="none" stroke="${T}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 9"/>` + circ(64, 22, 13, `fill="${A}"`) + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${64 + 17 * Math.cos(a)}" y1="${22 + 17 * Math.sin(a)}" x2="${64 + 23 * Math.cos(a)}" y2="${22 + 23 * Math.sin(a)}" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`; }).join(''),
  'humanista-religioso': () => circ(50, 50, 16, `fill="${A}"`) + Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return `<line x1="${50 + 22 * Math.cos(a)}" y1="${50 + 22 * Math.sin(a)}" x2="${50 + (i % 2 ? 32 : 40) * Math.cos(a)}" y2="${50 + (i % 2 ? 32 : 40) * Math.sin(a)}" stroke="${i % 2 ? O : T}" stroke-width="4" stroke-linecap="round"/>`; }).join(''),
  'teista-racional': () => `<rect x="12" y="12" width="76" height="76" fill="none" stroke="${T}" stroke-width="3"/><polygon points="50,12 88,88 12,88" fill="none" stroke="${O}" stroke-width="3"/>` + circ(50, 62, 18, `fill="none" stroke="${A}" stroke-width="3"`) + circ(50, 62, 4, `fill="${A}"`),
  'buscador-contemplativo': () => [38, 30, 22, 14, 6].map((r, i) => `<ellipse cx="50" cy="56" rx="${r * 1.2}" ry="${r * .55}" fill="none" stroke="${[T, A, O, T, A][i]}" stroke-width="3" opacity="${1 - i * .12}"/>`).join('') + `<path d="M50 14V40" stroke="${A}" stroke-width="3" stroke-linecap="round"/>` + circ(50, 12, 4, `fill="${A}"`),
  'caminhante-da-libertacao': () => `<polygon points="4,88 34,32 54,66 70,44 96,88" fill="${T}" opacity=".85"/><polygon points="22,88 50,40 78,88" fill="${A}" opacity=".9"/>` + circ(72, 22, 9, `fill="${O}"`),
  'naturalista-espiritual': () => `<rect x="46" y="48" width="8" height="42" fill="${O}"/>` + [[50, 30, 24], [34, 46, 16], [66, 46, 16]].map(([x, y, r], i) => circ(x, y, r, `fill="${[T, A, T][i]}" opacity=".85"`)).join(''),
  'cetico-aberto': () => `<path d="M10 70H90" stroke="${T}" stroke-width="4" stroke-linecap="round"/><path d="M26 70A24 24 0 0 1 74 70" fill="${O}" opacity=".9"/>` + [78, 86].map(y => `<path d="M${20 + (y - 78)} ${y}H${80 - (y - 78)}" stroke="${A}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`).join('') + `<path d="M50 16A12 12 0 1 1 58 38C52 42 50 44 50 52" fill="none" stroke="${A}" stroke-width="4" stroke-linecap="round"/>`,
  'humanista-secular': () => circ(50, 50, 38, `fill="none" stroke="${T}" stroke-width="3"`) + `<polygon points="50,14 58,50 50,86 42,50" fill="${A}"/><polygon points="14,50 50,42 86,50 50,58" fill="${O}" opacity=".8"/>` + circ(50, 50, 5, `fill="#f6efe3"`),
};
export function emblemaPerfil(id, tam = 220) {
  const f = EMBLEMAS[id] || EMBLEMAS['humanista-religioso'];
  return `<svg class="emblema" viewBox="0 0 100 100" width="${tam}" height="${tam}" role="img" aria-label="Ilustração abstrata original do perfil">${f()}</svg>`;
}
export const emblemaComoSVG = id => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">${(EMBLEMAS[id] || EMBLEMAS['humanista-religioso'])()}</svg>`;

const CORES = ['#b4532a', '#1f5f63', '#a56b00', '#6b4c9a', '#2f7d4f', '#8a3b5c', '#44627a'];
export const hash = s => { let x = 2166136261; for (const c of String(s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619); } return x >>> 0; };
export const corDe = s => CORES[hash(s) % CORES.length];
/** Fundo geométrico determinístico (4 famílias) — substitui a fotografia quando não há imagem verificada. */
export function padrao(slug, w = 400, h = 200) {
  const c = corDe(slug), k = hash(slug) % 4, id = 'p' + hash(slug + 'x');
  const tile = [`<circle cx="12" cy="12" r="3" fill="#fff" opacity=".35"/>`, `<path d="M0 12L12 0L24 12L12 24Z" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>`, `<path d="M0 24L24 0" stroke="#fff" stroke-opacity=".28" stroke-width="2"/>`, `<circle cx="12" cy="12" r="9" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>`][k];
  return `<svg class="padrao" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse">${tile}</pattern><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".62"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${id}g)"/><rect width="${w}" height="${h}" fill="url(#${id})"/></svg>`;
}
