'use strict';
/**
 * Dados doutrinários para as dimensões novas (revelação, pluralismo, organização), por tradição.
 * Formato por linha: slug: [revelação, pluralismo, organização, confiança?] — cada campo 'opc:peso|opc:peso' ou null.
 * Ausência de linha/campo = "não documentado" (o algoritmo NÃO inventa). Confiança padrão 0,55: são generalizações
 * de curadoria inicial sobre tradições internamente diversas; marcadas como tal e sujeitas a revisão acadêmica.
 */
const AB = {
  revelacao: { rev: 'revelacao_escrita_profetica', anc: 'tradicao_ancestral', ilu: 'iluminacao_mestre', raz: 'razao_filosofia', sem: 'sem_conhecimento_sagrado' },
  pluralismo: { exc: 'exclusivismo', inc: 'inclusivismo', plu: 'pluralismo', sem: 'sem_pretensao_universal' },
  organizacao: { hie: 'hierarquia_institucional', com: 'comunidade_local', lin: 'linhagem_mestre', ind: 'individual_autonoma' },
};
const DIMS = ['revelacao', 'pluralismo', 'organizacao'];
const ANTIGA = ['anc:.75|rev:.25', 'sem:1', 'hie:.5|com:.5', .45];
const ETNICA = ['anc:.8|ilu:.2', 'sem:.8|plu:.2', 'com:.7|lin:.3', .5];
const DADOS = {
  // judaísmo
  judaismo: ['rev', 'inc:.6|plu:.4', 'com:.6|lin:.2|hie:.2', .5], 'judaismo-ortodoxo': ['rev', 'inc', 'com:.5|lin:.3|hie:.2'],
  'judaismo-conservador': ['rev:.8|raz:.2', 'inc:.5|plu:.5', 'com'], 'judaismo-reformista': ['rev:.5|raz:.5', 'plu:.7|inc:.3', 'com'],
  hassidismo: ['rev', 'inc', 'lin:.7|com:.3'], caraismo: ['rev', 'inc', 'com'], cabala: ['rev:.5|ilu:.5', 'inc', 'lin', .5], 'judaismo-reconstrucionista': ['raz:.7|rev:.3', 'plu', 'com'], samaritanismo: ['rev', 'exc:.7|inc:.3', 'hie:.5|com:.5'],
  // cristianismo
  cristianismo: ['rev', 'exc:.4|inc:.5|plu:.1', 'hie:.4|com:.6', .45], catolicismo: ['rev', 'inc:.8|exc:.2', 'hie', .7], 'ortodoxia-oriental': ['rev', 'exc:.6|inc:.4', 'hie:.8|com:.2'],
  'ortodoxia-russa': ['rev', 'exc:.6|inc:.4', 'hie:.8|com:.2'], 'ortodoxia-copta': ['rev', 'exc:.6|inc:.4', 'hie:.8|com:.2'], 'ortodoxia-tewahedo-etiope': ['rev', 'exc:.6|inc:.4', 'hie:.8|com:.2'],
  'igreja-assiria-do-oriente': ['rev', 'exc:.6|inc:.4', 'hie:.8|com:.2'], 'igreja-apostolica-armenia': ['rev', 'exc:.6|inc:.4', 'hie:.8|com:.2'], 'igreja-maronita': ['rev', 'inc:.8|exc:.2', 'hie', .65],
  protestantismo: ['rev', 'exc:.5|inc:.4|plu:.1', 'com:.6|hie:.4', .45], luteranismo: ['rev', 'exc:.4|inc:.6', 'hie:.4|com:.6'], 'tradicao-reformada': ['rev', 'exc:.6|inc:.4', 'com:.5|hie:.5'], presbiterianismo: ['rev', 'exc:.6|inc:.4', 'com:.5|hie:.5'],
  anglicanismo: ['rev', 'inc:.7|plu:.3', 'hie:.7|com:.3'], batistas: ['rev', 'exc:.7|inc:.3', 'com', .6], metodismo: ['rev', 'inc:.6|exc:.3|plu:.1', 'hie:.5|com:.5'], pentecostalismo: ['rev', 'exc:.8|inc:.2', 'com:.7|hie:.3'],
  'assembleia-de-deus': ['rev', 'exc:.8|inc:.2', 'com:.5|hie:.5'], 'igreja-universal-reino-de-deus': ['rev', 'exc:.9|inc:.1', 'hie:.9|com:.1'], adventismo: ['rev', 'exc:.6|inc:.4', 'hie:.7|com:.3'],
  'anabatismo-menonitas': ['rev', 'exc:.4|inc:.4|plu:.2', 'com:.9|hie:.1'], quakers: ['rev:.4|ilu:.6', 'plu:.6|inc:.4', 'com', .65], 'testemunhas-de-jeova': ['rev', 'exc', 'hie', .7],
  'santos-dos-ultimos-dias': ['rev', 'exc:.9|inc:.1', 'hie', .65], 'ciencia-crista': ['rev:.7|ilu:.3', 'exc:.6|inc:.4', 'com:.8|hie:.2'], swedenborgianismo: ['rev', 'inc:.7|plu:.3', 'com'],
  'unitarismo-universalista': ['raz:.6|ilu:.4', 'plu', 'com:.6|ind:.4', .6], 'igreja-da-unificacao': ['rev', 'exc:.7|inc:.3', 'hie:.9|com:.1'], 'espiritualismo-moderno': ['ilu:.7|anc:.3', 'plu:.8|inc:.2', 'com:.7|ind:.3', .45],
  antroposofia: ['ilu:.7|raz:.3', 'inc:.5|plu:.5', 'com:.6|lin:.4', .45], teosofia: ['ilu:.6|raz:.4', 'plu', 'com:.6|ind:.4', .5], cientologia: ['ilu:.5|rev:.3|raz:.2', 'exc:.8|inc:.2', 'hie', .4],
  // islamismo
  islamismo: ['rev', 'exc:.5|inc:.5', 'com:.7|lin:.3'], sunismo: ['rev', 'exc:.5|inc:.5', 'com:.7|lin:.3'], xiismo: ['rev', 'exc:.5|inc:.5', 'hie:.5|lin:.5'], ismailismo: ['rev:.7|ilu:.3', 'inc', 'hie:.5|lin:.5'],
  zaidismo: ['rev', 'exc:.6|inc:.4', 'com:.6|lin:.4'], ibadismo: ['rev', 'exc:.5|inc:.5', 'com'], sufismo: ['ilu:.6|rev:.4', 'inc:.5|plu:.5', 'lin:.9|com:.1'], mevlevi: ['ilu:.6|rev:.4', 'inc:.6|plu:.4', 'lin'], chishtiyya: ['ilu:.6|rev:.4', 'inc:.5|plu:.5', 'lin'], tijaniyya: ['ilu:.6|rev:.4', 'inc:.7|exc:.3', 'lin'],
  ahmadiyya: ['rev', 'exc:.5|inc:.3|plu:.2', 'hie'], wahabismo: ['rev', 'exc:.9|inc:.1', 'com:.5|hie:.5'], salvafismo: null, salafismo: ['rev', 'exc:.9|inc:.1', 'com:.6|ind:.2|hie:.2', .4], deobandismo: ['rev', 'exc:.8|inc:.2', 'lin:.5|com:.5'],
  hanafismo: ['rev', 'exc:.5|inc:.5', 'com:.6|lin:.4'], malikismo: ['rev', 'exc:.5|inc:.5', 'com:.6|lin:.4'], xafiismo: ['rev', 'exc:.5|inc:.5', 'com:.6|lin:.4'], hanbalismo: ['rev', 'exc:.6|inc:.4', 'com:.6|lin:.4'],
  'nacao-do-isla': ['rev', 'exc:.9|inc:.1', 'hie'], alevismo: ['ilu:.5|rev:.3|anc:.2', 'plu:.6|inc:.4', 'lin:.6|com:.4', .45], alauitas: ['ilu:.5|rev:.5', 'exc:.8|inc:.2', 'lin:.7|com:.3', .4], drusos: ['ilu:.5|rev:.5', 'exc:.9|inc:.1', 'lin:.6|com:.4', .45],
  yarsan: ['ilu:.5|rev:.5', 'inc', 'lin:.8|com:.2', .4], yazidismo: ['anc:.6|rev:.4', 'exc:.8|sem:.2', 'hie:.6|lin:.4', .5], mandeismo: ['rev', 'exc:.9|inc:.1', 'hie:.4|com:.6'], bahai: ['rev', 'plu', 'hie', .8], zoroastrismo: ['rev', 'exc:.5|inc:.5', 'com:.7|lin:.3'],
  maniqueismo: ['rev:.8|ilu:.2', 'inc:.6|plu:.4', 'hie', .45], gnosticismo: ['ilu', 'inc:.5|exc:.5', 'lin:.7|ind:.3', .4], mitraismo: ['ilu:.5|anc:.5', 'plu:.7|inc:.3', 'com:.8|lin:.2', .35],
  // religiões indianas
  hinduismo: ['rev:.4|ilu:.4|anc:.2', 'plu:.5|inc:.5', 'lin:.6|com:.3|ind:.1', .6], 'religiao-vedica': ['rev:.7|anc:.3', null, 'hie:.5|com:.5', .45], vaishnavismo: ['rev:.5|ilu:.3|anc:.2', 'inc:.7|plu:.3', 'lin:.8|com:.2'], shaivismo: ['ilu:.5|rev:.5', 'inc:.6|plu:.4', 'lin'],
  shaktismo: ['ilu:.6|rev:.4', 'inc:.5|plu:.5', 'lin'], 'advaita-vedanta': ['ilu:.6|rev:.4', 'plu:.6|inc:.4', 'lin'], iskcon: ['rev', 'exc:.6|inc:.4', 'hie:.5|lin:.5'], swaminarayan: ['rev', 'inc:.5|exc:.5', 'lin:.6|hie:.4'],
  'arya-samaj': ['rev', 'exc:.8|inc:.2', 'com:.7|hie:.3'], 'brahmo-samaj': ['raz:.5|ilu:.3|rev:.2', 'plu:.8|inc:.2', 'com:.7|ind:.3'], 'ramakrishna-vedanta': ['ilu:.8|rev:.2', 'plu', 'lin:.7|hie:.3', .6], lingayatismo: ['ilu:.5|rev:.5', 'inc:.5|plu:.5', 'lin:.6|com:.4', .4],
  'sri-vaishnavismo': ['rev:.7|ilu:.3', 'exc:.6|inc:.4', 'lin'], 'gaudiya-vaishnavismo': ['rev:.6|ilu:.4', 'exc:.5|inc:.5', 'lin'], smartismo: ['rev:.6|ilu:.4', 'plu:.6|inc:.4', 'lin'], 'shaiva-siddhanta': ['rev', 'inc', 'lin:.6|hie:.4'],
  'kabir-panth': ['ilu:.8|rev:.2', 'plu:.7|inc:.3', 'lin:.8|com:.2'], 'shaivismo-caxemira': ['ilu:.8|rev:.2', 'inc:.5|plu:.5', 'lin'], tantrismo: ['ilu:.8|rev:.2', 'inc:.6|plu:.4', 'lin', .5],
  sikhismo: ['rev:.6|ilu:.4', 'plu:.6|inc:.4', 'com:.5|hie:.3|lin:.2'], jainismo: ['ilu:.8|rev:.2', 'plu:.6|inc:.4', 'com:.6|lin:.4'], 'jainismo-digambara': ['ilu:.8|rev:.2', 'plu:.6|inc:.4', 'com:.6|lin:.4'], 'jainismo-svetambara': ['ilu:.8|rev:.2', 'plu:.6|inc:.4', 'com:.6|lin:.4'],
  // budismo
  budismo: ['ilu:.9|raz:.1', 'plu:.6|inc:.4', 'lin:.6|com:.4', .5], theravada: ['ilu', 'inc:.5|plu:.5', 'lin:.6|com:.4', .45], mahayana: ['ilu', 'plu:.5|inc:.5', 'lin:.6|com:.4', .45], vajrayana: ['ilu', 'inc:.6|plu:.4', 'lin', .5], zen: ['ilu', 'plu:.6|inc:.4', 'lin', .5],
  'terra-pura': ['ilu:.7|rev:.3', 'inc:.6|plu:.4', 'com:.6|lin:.4'], nichiren: ['rev:.5|ilu:.5', 'exc:.8|inc:.2', 'hie:.5|lin:.5'], 'soka-gakkai': ['ilu:.6|rev:.4', 'plu:.3|inc:.4|exc:.3', 'hie:.7|com:.3', .45],
  gelug: ['ilu', 'inc:.6|plu:.4', 'lin'], kagyu: ['ilu', 'inc:.6|plu:.4', 'lin'], nyingma: ['ilu', 'inc:.6|plu:.4', 'lin'], sakya: ['ilu', 'inc:.6|plu:.4', 'lin'], 'bon-tibetano': ['ilu:.8|anc:.2', 'inc:.5|plu:.5', 'lin', .45],
  'tradicao-floresta-tailandesa': ['ilu', 'inc:.5|plu:.5', 'lin:.8|com:.2'], 'jodo-shinshu': ['ilu:.7|rev:.3', 'inc:.6|plu:.4', 'com:.6|lin:.4'], 'soto-zen': ['ilu', 'plu:.6|inc:.4', 'lin'], rinzai: ['ilu', 'plu:.6|inc:.4', 'lin'], shingon: ['ilu', 'inc', 'lin'], tendai: ['ilu:.8|rev:.2', 'inc', 'lin'], 'hoa-hao': ['ilu:.5|rev:.5', 'inc', 'com:.7|lin:.3', .4],
  // Ásia Oriental
  confucionismo: ['raz:.5|anc:.5', 'plu:.8|inc:.2', 'com:.6|hie:.4', .5], taoismo: ['ilu:.6|rev:.4', 'plu:.7|inc:.3', 'lin:.6|com:.4'], 'zhengyi-mestres-celestes': ['rev:.5|ilu:.5', 'plu:.6|inc:.4', 'lin:.7|hie:.3'], quanzhen: ['ilu:.8|rev:.2', 'plu:.7|inc:.3', 'hie:.4|lin:.6'],
  xintoismo: ['anc:.9|rev:.1', 'plu:.8|inc:.2', 'com:.6|hie:.4', .5], 'religiao-popular-chinesa': ['anc:.8|rev:.2', 'plu', 'com:.8|ind:.2', .5], caodaismo: ['rev', 'plu:.9|inc:.1', 'hie'], tenrikyo: ['rev', 'inc:.6|exc:.4', 'hie:.7|com:.3'], cheondogyo: ['rev:.8|ilu:.2', 'inc:.6|exc:.4', 'hie:.5|com:.5', .45],
  'muismo-coreano': ['anc:.7|ilu:.3', 'plu', 'lin:.5|ind:.5', .5], shugendo: ['ilu:.7|anc:.3', 'plu:.8|inc:.2', 'lin'], 'falun-gong': ['rev:.5|ilu:.5', 'exc:.7|inc:.3', 'hie:.7|lin:.3', .45],
  // neopaganismos e reconstruções
  wicca: ['anc:.4|ilu:.6', 'plu', 'com:.5|ind:.5', .6], 'asatru-heathenry': ['anc:.7|raz:.3', 'plu:.7|inc:.3', 'com:.8|ind:.2', .5], neodruidismo: ['anc:.4|ilu:.4|raz:.2', 'plu', 'com:.5|ind:.5', .5], hellenismos: ['anc:.5|raz:.5', 'plu', 'com:.6|ind:.4', .5], romuva: ['anc:.9|rev:.1', 'plu:.8|sem:.2', 'com:.8|lin:.2', .5],
  orfismo: ['ilu:.5|rev:.5', 'plu', 'lin:.6|ind:.4', .35],
  // África, diáspora e Américas
  'religiao-ioruba': ETNICA, 'vodun-africano': ETNICA, 'religiao-akan': ETNICA, 'religiao-zulu': ETNICA, 'religiao-igbo': ETNICA, 'religiao-bakongo': ETNICA, 'religiao-dogon': ETNICA, 'religiao-kikuyu': ETNICA, 'religiao-san': ETNICA, 'religiao-shona': ETNICA, 'religiao-nuer': ETNICA,
  candomble: ['anc:.7|rev:.3', 'plu:.5|sem:.3|inc:.2', 'com:.5|lin:.5', .5], umbanda: ['anc:.4|ilu:.4|rev:.2', 'plu:.8|inc:.2', 'com:.6|lin:.4', .5], 'tambor-de-mina': ['anc:.7|rev:.3', 'plu:.5|sem:.3|inc:.2', 'com:.5|lin:.5', .45],
  santeria: ['anc:.7|rev:.3', 'plu:.6|sem:.2|inc:.2', 'lin:.6|com:.4', .5], 'vodou-haitiano': ['anc:.7|rev:.3', 'plu:.6|sem:.2|inc:.2', 'lin:.6|com:.4', .5], 'espiritismo-kardecista': ['ilu:.4|raz:.3|rev:.3', 'plu:.7|inc:.3', 'com:.7|hie:.3', .6],
  'santo-daime': ['ilu:.6|rev:.4', 'inc:.5|plu:.5', 'lin:.6|hie:.4', .5], 'uniao-do-vegetal': ['ilu:.6|rev:.4', 'inc:.6|plu:.4', 'hie:.6|lin:.4', .5], barquinha: ['ilu:.6|rev:.4', 'inc:.5|plu:.5', 'lin:.6|com:.4', .4],
  rastafari: ['rev:.5|anc:.3|ilu:.2', 'inc:.6|exc:.4', 'com:.8|ind:.2', .45], 'native-american-church': ['ilu:.5|rev:.3|anc:.2', 'plu:.6|inc:.4', 'com', .5],
  'religiao-haudenosaunee': ETNICA, 'cosmologia-yanomami': ETNICA, 'religiao-tupinamba': ETNICA, 'religiao-sami-tradicional': ETNICA, 'espiritualidade-inuit': ETNICA, 'religiao-lakota': ETNICA, 'religiao-cherokee': ETNICA, 'midewiwin-anishinaabe': ETNICA,
  'xamanismo-evenki': ETNICA, 'xamanismo-mongol-daur': ETNICA, 'religiao-ainu': ETNICA, 'religiosidade-andina': ETNICA, 'religiao-guarani-mbya': ETNICA, 'religiao-navajo': ETNICA, 'religiao-maori': ETNICA, 'religiao-mapuche': ETNICA, 'religioes-aborigenes-australianas': ETNICA, 'religiao-havaiana-antiga': ANTIGA,
  // religiões antigas
  'religiao-egipcia-antiga': ANTIGA, 'religiao-mesopotamica': ANTIGA, 'religiao-grega-antiga': ANTIGA, 'religiao-romana-antiga': ANTIGA, 'religiao-nordica-antiga': ANTIGA, 'religiao-asteca': ANTIGA, 'religiao-maia': ANTIGA, 'religiao-inca': ANTIGA,
  'religiao-etrusca': ANTIGA, 'religiao-cananeia-ugarit': ANTIGA, 'religiao-hitita': ANTIGA, 'religiao-celta-antiga': ANTIGA, 'religiao-eslava-pre-crista': ANTIGA, 'religiao-punica-fenicia': ANTIGA,
};
delete DADOS.salvafismo;
function expandir(slug) {
  const linha = DADOS[slug]; const d = {};
  if (!linha) return d;
  DIMS.forEach((dim, i) => {
    const campo = linha[i]; if (!campo) return;
    const conf = linha[3] ?? 0.55;
    const itens = campo.split('|').map(s => { const [k, p] = s.split(':'); return { chave: AB[dim][k] ?? (() => { throw new Error(`abreviação ${k} em ${slug}/${dim}`); })(), peso: p === undefined ? 1 : parseFloat(p) }; });
    d[dim] = { itens, conf };
  });
  return d;
}
module.exports = { DADOS, expandir };
