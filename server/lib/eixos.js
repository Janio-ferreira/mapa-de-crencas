'use strict';
/**
 * OS 12 EIXOS RELIGIOSOS
 *
 * Cada eixo é uma projeção (0–100) das dimensões doutrinárias do banco. A MESMA função projeta tradições e o usuário,
 * então todas as tradições do catálogo participam automaticamente e dado ausente continua ausente (nunca é inventado).
 *
 * Convenção: 0 = polo esquerdo, 100 = polo direito. `mapa[opcao] = valor` ou `null` (a opção não é informativa
 * para este eixo: por exemplo, "politeísmo vs monoteísmo" não se aplica a quem não admite divindades).
 *
 * Revisão conceitual das propostas iniciais (documentada no Método):
 *  - Eixo 2 só se aplica a quem admite alguma realidade divina; panteísmo e não-teísmo ficam "não se aplica".
 *  - Eixo 11 (pluralismo) não se aplica a tradições étnicas sem pretensão universal (não são exclusivistas nem pluralistas).
 *  - Eixos 5 e 6 são separados de 1: um budista sem deuses pode ser fortemente espiritual e crer em continuidade.
 *  - Posição intermediária e "não se aplica" são resultados legítimos; nenhum polo é melhor que o outro.
 */
const { carregar, normalizarRespostas } = require('./compat');

const AXES = [
  { id: 'divindade', n: 1, nome: 'Divindade', esq: 'Ateísmo', dir: 'Teísmo',
    descEsq: 'Não há deuses nem realidade divina; o universo se explica sem elas.', descDir: 'Existe ao menos uma realidade divina (um Deus, deuses ou espíritos) que importa para a vida.',
    fontes: [{ dim: 'teismo', w: 1, mapa: { monoteismo: 100, politeismo: 100, henoteismo: 100, animismo: 80, dualismo: 95, panteismo: 55, nao_teismo: 0 } },
             { dim: 'natureza_divina', w: 0.6, mapa: { pessoal_transcendente: 100, pessoal_imanente: 95, impessoal: 50, sem_realidade_suprema: 0 } }] },
  { id: 'unicidade', n: 2, nome: 'Natureza divina', esq: 'Monoteísmo', dir: 'Politeísmo', requer: 'divindade',
    descEsq: 'O divino é um só (um único Deus).', descDir: 'O divino é plural: muitos deuses, espíritos ou potências.',
    fontes: [{ dim: 'teismo', w: 1, mapa: { monoteismo: 0, dualismo: 30, henoteismo: 45, politeismo: 100, animismo: 85, panteismo: null, nao_teismo: null } }] },
  { id: 'revelacao', n: 3, nome: 'Revelação', esq: 'Revelação divina', dir: 'Conhecimento espiritual ou filosófico',
    descEsq: 'A verdade religiosa foi comunicada pelo divino (profetas, escrituras).', descDir: 'O conhecimento vem da experiência, da razão ou do despertar humano.',
    fontes: [{ dim: 'revelacao', w: 1, mapa: { revelacao_escrita_profetica: 0, tradicao_ancestral: 35, iluminacao_mestre: 75, razao_filosofia: 100, sem_conhecimento_sagrado: 90 } }] },
  { id: 'autoridade', n: 4, nome: 'Autoridade religiosa', esq: 'Escrituras e tradição', dir: 'Interpretação individual',
    descEsq: 'A autoridade está nos textos e na tradição transmitida.', descDir: 'Cada pessoa interpreta e decide por si, pela experiência e pela consciência.',
    fontes: [{ dim: 'autoridade', w: 1, mapa: { escritura_unica: 0, escritura_tradicao: 5, tradicao_oral_anciaos: 15, mestre_experiencia: 60, sem_autoridade_fixa: 100 } }] },
  { id: 'espiritualidade', n: 5, nome: 'Espiritualidade', esq: 'Materialismo', dir: 'Espiritualidade',
    descEsq: 'A realidade é só material; não há dimensão espiritual.', descDir: 'Há uma dimensão espiritual real (alma, espírito, sagrado) além da matéria.',
    fontes: [{ dim: 'alma', w: 1, mapa: { alma_unica_eterna: 100, alma_preexistente: 100, alma_multipla: 100, sem_eu: 70, mortal: 0 } },
             { dim: 'natureza_divina', w: 0.5, mapa: { pessoal_transcendente: 100, pessoal_imanente: 100, impessoal: 85, sem_realidade_suprema: 15 } }] },
  { id: 'vida_apos_morte', n: 6, nome: 'Vida após a morte', esq: 'Mortalidade definitiva', dir: 'Continuidade',
    descEsq: 'A morte encerra a existência pessoal.', descDir: 'Algo continua após a morte (alma, renascimento, ressurreição, união com o absoluto, ancestrais).',
    fontes: [{ dim: 'pos_morte', w: 1, mapa: { julgamento: 100, renascimento: 100, mundo_ancestral: 100, uniao_absorcao: 100, reino_sombrio: 75, nada_ou_incerto: 5 } },
             { dim: 'alma', w: 0.6, mapa: { alma_unica_eterna: 100, alma_preexistente: 100, alma_multipla: 100, sem_eu: 70, mortal: 0 } },
             { dim: 'reencarnacao', w: 0.3, mapa: { central: 100, admitida: 100, rejeitada: null } },
             { dim: 'ressurreicao', w: 0.3, mapa: { central: 100, admitida: 100, rejeitada: null } }] },
  { id: 'destino', n: 7, nome: 'Destino espiritual', esq: 'Salvação, libertação ou iluminação', dir: 'Ausência de destino espiritual universal',
    descEsq: 'Há uma meta espiritual a alcançar (salvação, libertação, iluminação, união).', descDir: 'Não há meta espiritual comum a todos; o sentido é local, ético ou pessoal.',
    fontes: [{ dim: 'salvacao', w: 1, mapa: { graca_fe: 0, merito_obras: 0, conhecimento_pratica: 0, ordem_ritual: 15, harmonia_equilibrio: 45, sem_salvacao: 100 } }] },
  { id: 'natureza_humana', n: 8, nome: 'Natureza humana', esq: 'Imperfeição fundamental', dir: 'Potencial de aperfeiçoamento',
    descEsq: 'O ser humano é marcado por uma falha ou queda de fundo, e precisa de ajuda externa.', descDir: 'O ser humano é bom ou capaz de se aperfeiçoar e de se despertar por si.',
    fontes: [{ dim: 'natureza_humana', w: 1, mapa: { decaida: 0, neutra_moldada: 65, parte_da_natureza: 60, boa_ou_divina: 100 } }] },
  { id: 'pratica', n: 9, nome: 'Prática religiosa', esq: 'Ritual e observância', dir: 'Espiritualidade contemplativa e individual',
    descEsq: 'A vida religiosa se vive em ritos, liturgias e observâncias compartilhadas.', descDir: 'A vida religiosa se vive em meditação, contemplação e experiência pessoal.',
    fontes: [{ dim: 'praticas', w: 1, mapa: { liturgia_comunitaria: 0, ritual_ofertas: 5, xamanismo_possessao: 25, observancia_etica: 35, meditacao_contemplacao: 100, minima: null } }] },
  { id: 'etica', n: 10, nome: 'Ética', esq: 'Moral revelada pela religião', dir: 'Ética independente da religião',
    descEsq: 'O certo e o errado vêm do mandamento divino ou da ordem sagrada do mundo.', descDir: 'A moral se fundamenta na razão, na empatia e na experiência humana, sem depender da religião.',
    fontes: [{ dim: 'etica', w: 1, mapa: { mandamento_divino: 0, ordem_cosmica: 25, reciprocidade_comunitaria: 60, compaixao_nao_dano: 70, razao_humanista: 100 } }] },
  { id: 'pluralismo', n: 11, nome: 'Pluralismo', esq: 'Exclusivismo', dir: 'Pluralismo',
    descEsq: 'Uma só religião tem a verdade plena ou o caminho de salvação.', descDir: 'Várias religiões são caminhos válidos; nenhuma tem o monopólio da verdade.',
    fontes: [{ dim: 'pluralismo', w: 1, mapa: { exclusivismo: 0, inclusivismo: 40, pluralismo: 100, sem_pretensao_universal: null } }] },
  { id: 'organizacao', n: 12, nome: 'Organização', esq: 'Autoridade e comunidade institucional', dir: 'Autonomia espiritual individual',
    descEsq: 'A vida espiritual se dá numa instituição ou comunidade com liderança reconhecida.', descDir: 'A vida espiritual é pessoal, sem depender de instituição ou comunidade.',
    fontes: [{ dim: 'organizacao', w: 1, mapa: { hierarquia_institucional: 0, comunidade_local: 30, linhagem_mestre: 55, individual_autonoma: 100 } },
             { dim: 'sociedade', w: 0.3, mapa: { integrada_ordem_social: 20, identidade_comunitaria: 25, escolha_privada: 85, transformacao_social: 35, retiro_renuncia: 70 } }] },
];
const POR_ID = Object.fromEntries(AXES.map(a => [a.id, a]));
const LIMIAR_NA = 0.65;      // fração da massa não informativa a partir da qual o eixo "não se aplica"

/** dist: { dim: { itens:[{chave,peso}], conf } } -> {valor, cobertura, confianca, faixa, status} */
function projetarEixo(ax, dist) {
  let soma = 0, w = 0, confSoma = 0, wTot = 0, naMassa = 0, wInfo = 0, m2 = 0;
  for (const f of ax.fontes) {
    wTot += f.w;
    const d = dist[f.dim]; if (!d) continue;
    let ap = 0, vs = 0, vs2 = 0, na = 0;
    for (const it of d.itens) {
      const v = f.mapa[it.chave];
      if (v === undefined) continue;
      if (v === null) { na += it.peso; continue; }
      ap += it.peso; vs += it.peso * v; vs2 += it.peso * v * v;
    }
    wInfo += f.w * (ap + na);
    naMassa += f.w * na;
    if (ap <= 0) continue;
    const wf = f.w * ap * (d.conf ?? 1);
    soma += wf * (vs / ap); m2 += wf * (vs2 / ap); w += wf; confSoma += (d.conf ?? 1) * f.w * ap;
  }
  const cobertura = Math.min(1, wInfo / wTot);
  if (wInfo === 0) return { status: 'nao_documentado', cobertura: 0 };
  if (naMassa / wInfo >= LIMIAR_NA || w === 0) return { status: 'nao_se_aplica', cobertura: +cobertura.toFixed(2) };
  const valor = soma / w, sd = Math.sqrt(Math.max(0, m2 / w - valor * valor));
  return {
    status: 'ok', valor: +valor.toFixed(1), cobertura: +cobertura.toFixed(2), confianca: +(confSoma / (wInfo - naMassa)).toFixed(2),
    faixa: [+Math.max(0, valor - sd).toFixed(1), +Math.min(100, valor + sd).toFixed(1)], dispersao: +sd.toFixed(1),
  };
}

/** Eixo 2 só se aplica se a divindade (eixo 1) for admitida; e perde sentido em ateísmo. */
function projetarTodos(dist) {
  const out = {};
  for (const ax of AXES) out[ax.id] = projetarEixo(ax, dist);
  const dv = out.divindade;
  if (out.unicidade.status === 'ok' && dv.status === 'ok' && dv.valor < 30) out.unicidade = { status: 'nao_se_aplica', cobertura: out.unicidade.cobertura };
  return out;
}

/** Intensidade da posição (distância do centro). */
function intensidade(valor) {
  const dev = Math.abs(valor - 50) * 2;
  const nivel = dev < 15 ? 'intermediária' : dev < 40 ? 'leve' : dev < 70 ? 'moderada' : 'forte';
  return { nivel, dev: +dev.toFixed(0), lado: valor < 47.5 ? 'esq' : valor > 52.5 ? 'dir' : 'meio' };
}
function rotuloPosicao(ax, valor) {
  const i = intensidade(valor);
  if (i.lado === 'meio' || i.nivel === 'intermediária') return `Posição intermediária entre ${ax.esq} e ${ax.dir}`;
  const polo = i.lado === 'esq' ? ax.esq : ax.dir;
  return `Inclinação ${i.nivel} para ${polo}`;
}

function distDaTradicao(C, tid) {
  const dist = {};
  for (const [dimId, ts] of Object.entries(C.doutr[tid] || {})) {
    const D = C.porId[dimId];
    dist[D.chave] = { itens: ts.map(x => ({ chave: C.opPorId[x.opcao_id].chave, peso: x.peso })), conf: ts.reduce((a, x) => a + x.peso * x.confianca, 0) / ts.reduce((a, x) => a + x.peso, 0) };
  }
  return dist;
}
function eixosDaTradicao(slug) {
  const C = carregar(); const t = C.trads.find(x => x.slug === slug); if (!t) return null;
  return projetarTodos(distDaTradicao(C, t.id));
}
function eixosDeTodas() {
  const C = carregar(); const out = {};
  for (const t of C.trads) out[t.slug] = projetarTodos(distDaTradicao(C, t.id));
  return out;
}
/** Projeta respostas já no formato do compat ({dim:{opcoes,importancia}}). */
function eixosDoUsuario(answers) {
  const C = carregar(); const U = normalizarRespostas(C, answers);
  const dist = {};
  for (const [dim, r] of Object.entries(U)) dist[dim] = { itens: r.itens.map(i => ({ chave: i.chave, peso: i.peso })), conf: 1 };
  return projetarTodos(dist);
}
function definicoes() {
  return AXES.map(a => ({ id: a.id, n: a.n, nome: a.nome, esq: a.esq, dir: a.dir, descEsq: a.descEsq, descDir: a.descDir, dimensoes: a.fontes.map(f => f.dim) }));
}
module.exports = { AXES, POR_ID, projetarEixo, projetarTodos, intensidade, rotuloPosicao, eixosDaTradicao, eixosDeTodas, eixosDoUsuario, definicoes, distDaTradicao };
