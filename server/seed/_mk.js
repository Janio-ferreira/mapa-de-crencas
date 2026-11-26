'use strict';
/** Auxiliar de entradas compactas: preenche com valores neutros e explícitos os campos opcionais não informados. */
const SEM = 'Sem dados estruturados nas fontes consultadas.';
const POP = { natureza_divina: 'pessoal_imanente@.5', salvacao: 'harmonia_equilibrio@.6', etica: 'reciprocidade_comunitaria@.6', autoridade: 'tradicao_oral_anciaos:.6|mestre_experiencia:.4@.7', sociedade: 'identidade_comunitaria@.8' };
const CRISTA = { teismo: 'monoteismo', natureza_divina: 'pessoal_transcendente', alma: 'alma_unica_eterna@.95', reencarnacao: 'rejeitada@.95', ressurreicao: 'central@.95', pos_morte: 'julgamento@.95', origem: 'criacao_do_nada@.95', natureza_humana: 'decaida:.75|boa_ou_divina:.25@.8' };
const ISLAM = { teismo: 'monoteismo', natureza_divina: 'pessoal_transcendente', alma: 'alma_unica_eterna@.9', reencarnacao: 'rejeitada@.95', ressurreicao: 'central@.95', pos_morte: 'julgamento@.95', origem: 'criacao_do_nada@.95', natureza_humana: 'neutra_moldada:.6|boa_ou_divina:.4@.7' };
const JUDAICA = { teismo: 'monoteismo', natureza_divina: 'pessoal_transcendente', origem: 'criacao_do_nada@.9', natureza_humana: 'neutra_moldada@.7', autoridade: 'escritura_tradicao@.9', praticas: 'liturgia_comunitaria@.8' };
function E(o) {
  return Object.assign({ alt: [], inicio: null, humanidade: SEM, alma: SEM, posmorte: SEM, organizacao: SEM, relacao: SEM, controversias: 'As fontes são limitadas ou parciais; a reconstrução é tema de debate acadêmico.', fundadores: [], textos: [], crencas: [], praticas: [], refs: [], dist: [], dn: {}, sit: 'praticada' }, o);
}
module.exports = { E, SEM, POP, CRISTA, ISLAM, JUDAICA };
