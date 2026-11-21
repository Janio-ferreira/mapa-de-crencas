'use strict';
/**
 * QUESTIONÁRIO "MEU PERFIL RELIGIOSO"
 *
 * Princípios: perguntas descritivas (sem pressupor que existe Deus, alma ou religião certa); respostas de escolha com
 * alternativas intermediárias, escalas de concordância (1–5; 3 = "em parte/sem posição") e sempre "prefiro pular".
 * Pular ou ficar em 3 NÃO gera evidência (dado ausente ≠ dado neutro).
 *
 * Efeitos: texto 'dim:opcao[:massa]' separados por espaço. A massa é a força da evidência (padrão 1). Para cada dimensão,
 * as massas de todas as perguntas se somam e são normalizadas, formando a distribuição do usuário sobre as opções
 * (a mesma forma usada nas doutrinas das tradições). As perguntas de "traço" (livre-arbítrio, destino, experiência
 * mística, agnosticismo) são exibidas no perfil, mas NÃO entram na comparação com tradições (não há dado equivalente).
 *
 * ATENÇÃO: a ordem deste array é parte do código de compartilhamento (v1). Só acrescente perguntas no FIM.
 */
const TEMAS = [
  { id: 'deus', nome: 'Deus, deuses e o divino', dims: ['teismo', 'natureza_divina'] },
  { id: 'origem', nome: 'Origem do mundo', dims: ['origem'] },
  { id: 'alma_morte', nome: 'Alma, morte e vida futura', dims: ['alma', 'pos_morte', 'reencarnacao', 'ressurreicao'] },
  { id: 'salvacao', nome: 'Salvação, libertação e natureza humana', dims: ['salvacao', 'natureza_humana'] },
  { id: 'revelacao', nome: 'Revelação, escrituras e autoridade', dims: ['revelacao', 'autoridade'] },
  { id: 'pratica', nome: 'Rituais, oração e meditação', dims: ['praticas'] },
  { id: 'etica', nome: 'Moral e ética', dims: ['etica'] },
  { id: 'ciencia', nome: 'Ciência e religião', dims: ['ciencia'] },
  { id: 'pluralismo', nome: 'Verdade em outras religiões', dims: ['pluralismo'] },
  { id: 'comunidade', nome: 'Comunidade e instituições', dims: ['organizacao', 'sociedade'] },
];
const TEMA_DE_DIM = {}; TEMAS.forEach(t => t.dims.forEach(d => { TEMA_DE_DIM[d] = t.id; }));

const E = s => String(s || '').trim().split(/\s+/).filter(Boolean).map(x => { const [dim, opcao, m] = x.split(':'); return { dim, opcao, massa: m === undefined ? 1 : parseFloat(m) }; });
/** Escala: S(v1, v2, v4, v5) — v3 não gera efeito. */
const S = (a, b, c, d) => [a, b, '', c, d];
const esc = (id, tema, texto, efeitos, extra = {}) => ({ id, tema, tipo: 'escala', texto, efeitos: efeitos.map(E), ...extra });
const esl = (id, tema, texto, opcoes, extra = {}) => ({ id, tema, tipo: 'escolha', texto, opcoes: opcoes.map(([t, e, x]) => ({ t, e: E(e), ...(x || {}) })), ...extra });

const PERGUNTAS = [
  esl('q1', 'deus', 'Sobre deuses ou realidades divinas, qual afirmação se aproxima mais do que você pensa?', [
    ['Existe um único Deus.', 'teismo:monoteismo'],
    ['Existem vários deuses ou divindades.', 'teismo:politeismo'],
    ['O divino é a própria natureza ou o universo.', 'teismo:panteismo'],
    ['Existem espíritos, ancestrais ou forças em tudo o que existe.', 'teismo:animismo'],
    ['Há dois princípios opostos (bem e mal) em conflito cósmico.', 'teismo:dualismo'],
    ['Há deuses diferentes, mas um deles merece minha devoção especial.', 'teismo:henoteismo'],
    ['Não creio em deuses.', 'teismo:nao_teismo'],
    ['Não sei, e acho que não dá para saber.', 'teismo:nao_teismo:.4', { tr: 'agnosticismo' }],
  ], { ajuda: 'Escolha a que mais se aproxima, mesmo que não seja perfeita.' }),
  esl('q2', 'deus', 'Se existe algo divino, onde ele está em relação ao mundo?', [
    ['Acima e fora do mundo: criador distinto da criação.', 'natureza_divina:pessoal_transcendente'],
    ['Dentro do mundo e de cada ser, como presença íntima.', 'natureza_divina:pessoal_imanente'],
    ['É um princípio impessoal (como lei, ordem, energia ou o Absoluto).', 'natureza_divina:impessoal'],
    ['Entre as duas coisas: transcende o mundo e também está nele.', 'natureza_divina:pessoal_transcendente:.5 natureza_divina:pessoal_imanente:.5'],
    ['Não há realidade divina ou suprema.', 'natureza_divina:sem_realidade_suprema'],
  ]),
  esc('q3', 'deus', 'O divino é alguém com quem posso ter uma relação pessoal (falar, ouvir, confiar).',
    S('natureza_divina:impessoal:.5 natureza_divina:sem_realidade_suprema:.5', 'natureza_divina:impessoal', 'natureza_divina:pessoal_transcendente:.4 natureza_divina:pessoal_imanente:.4', 'natureza_divina:pessoal_transcendente:.5 natureza_divina:pessoal_imanente:.5')),
  esc('q4', 'deus', 'A pluralidade de deuses ou espíritos é uma forma mais verdadeira de entender o sagrado do que um único Deus.',
    S('teismo:monoteismo:.6', 'teismo:monoteismo:.3', 'teismo:politeismo:.3 teismo:animismo:.2', 'teismo:politeismo:.5 teismo:animismo:.4'), { p: 0.6 }),
  esc('q5', 'deus', 'A natureza (rios, montanhas, animais, o céu) é sagrada em si mesma.',
    S('', '', 'teismo:animismo:.3 teismo:panteismo:.3 natureza_divina:pessoal_imanente:.2', 'teismo:animismo:.4 teismo:panteismo:.4 natureza_divina:pessoal_imanente:.3 natureza_humana:parte_da_natureza:.3'), { p: 0.6 }),
  esc('q6', 'deus', 'Existe uma luta cósmica entre forças do bem e do mal.',
    S('', '', 'teismo:dualismo:.4', 'teismo:dualismo:.8'), { p: 0.5 }),
  esl('q7', 'origem', 'Como você entende a origem do universo e da vida?', [
    ['Foi criado por Deus ou por um criador, a partir do nada.', 'origem:criacao_do_nada'],
    ['Não teve começo: existe em ciclos eternos de formação e dissolução.', 'origem:ciclico_sem_inicio'],
    ['Foi formado por deuses, ancestrais ou seres primordiais (como contam os mitos).', 'origem:cosmogonia_mitica'],
    ['Emanou ou se desdobrou de um princípio absoluto.', 'origem:emanacao'],
    ['É explicado por processos naturais; a religião não responde a isso.', 'origem:indefinida'],
    ['Não sei e não tenho posição.', 'origem:indefinida:.4'],
  ]),
  esl('q8', 'alma_morte', 'O que é, no fundo, uma pessoa?', [
    ['Tem uma alma individual criada, única e eterna.', 'alma:alma_unica_eterna'],
    ['Tem uma alma que existia antes do corpo e passa por vários corpos.', 'alma:alma_preexistente'],
    ['É composta de várias partes ou almas (corpo, sombra, espírito, nome...).', 'alma:alma_multipla'],
    ['Não há um "eu" permanente: é um fluxo de processos que se transforma.', 'alma:sem_eu'],
    ['É só corpo e mente; ao morrer, a pessoa deixa de existir.', 'alma:mortal'],
  ]),
  esl('q9', 'alma_morte', 'O que você acha que acontece depois da morte?', [
    ['Há um julgamento e um destino final (céu, inferno, paraíso, purgatório).', 'pos_morte:julgamento'],
    ['Renasce-se em outra vida, repetidamente.', 'pos_morte:renascimento'],
    ['A pessoa vai para o mundo dos ancestrais e dos espíritos, e segue ligada à família.', 'pos_morte:mundo_ancestral'],
    ['A pessoa se dissolve ou se une ao absoluto/ao todo.', 'pos_morte:uniao_absorcao'],
    ['Segue-se para um reino sombrio ou neutro dos mortos.', 'pos_morte:reino_sombrio'],
    ['Nada: a consciência termina.', 'pos_morte:nada_ou_incerto'],
    ['Ninguém pode saber o que acontece.', 'pos_morte:nada_ou_incerto:.5', { tr: 'agnosticismo' }],
  ]),
  esc('q10', 'alma_morte', 'Já vivemos outras vidas e poderemos viver novamente em outros corpos.',
    S('reencarnacao:rejeitada', 'reencarnacao:rejeitada:.7 reencarnacao:admitida:.3', 'reencarnacao:admitida', 'reencarnacao:central')),
  esc('q11', 'alma_morte', 'No fim dos tempos, os mortos ressuscitarão com seus corpos.',
    S('ressurreicao:rejeitada', 'ressurreicao:rejeitada:.7 ressurreicao:admitida:.3', 'ressurreicao:admitida', 'ressurreicao:central')),
  esc('q12', 'alma_morte', 'Nossas ações têm consequências morais automáticas, nesta vida ou nas seguintes (como o karma).',
    S('', '', 'etica:ordem_cosmica:.4 pos_morte:renascimento:.2', 'etica:ordem_cosmica:.6 pos_morte:renascimento:.4'), { p: 0.5 }),
  esl('q13', 'salvacao', 'Qual meta espiritual faz mais sentido para você?', [
    ['Ser salvo(a) pela graça e pela fé.', 'salvacao:graca_fe'],
    ['Merecer o destino final por boas obras e retidão.', 'salvacao:merito_obras'],
    ['Libertar-se ou despertar pelo conhecimento e pela prática (iluminação, moksha, nirvana).', 'salvacao:conhecimento_pratica'],
    ['Manter a ordem do mundo por ritos, deveres e respeito aos ancestrais.', 'salvacao:ordem_ritual'],
    ['Viver em harmonia e equilíbrio com os outros e com a natureza.', 'salvacao:harmonia_equilibrio'],
    ['Não há meta espiritual: o que importa é viver bem esta vida.', 'salvacao:sem_salvacao'],
  ]),
  esc('q14', 'salvacao', 'Um ser humano pode alcançar um estado de despertar ou iluminação por meio de prática espiritual.',
    S('salvacao:sem_salvacao:.3', '', 'salvacao:conhecimento_pratica:.5', 'salvacao:conhecimento_pratica'), { p: 0.7 }),
  esc('q15', 'salvacao', 'Preciso de ajuda de algo maior do que meus próprios esforços para me aperfeiçoar espiritualmente (graça).',
    S('salvacao:merito_obras:.4 salvacao:conhecimento_pratica:.4 salvacao:sem_salvacao:.2', 'salvacao:merito_obras:.3 salvacao:conhecimento_pratica:.3', 'salvacao:graca_fe:.5', 'salvacao:graca_fe'), { p: 0.7 }),
  esl('q16', 'salvacao', 'Como você vê a natureza do ser humano?', [
    ['Nasce marcado por uma falha, queda ou pecado de origem.', 'natureza_humana:decaida'],
    ['É bom ou possui uma centelha divina por natureza.', 'natureza_humana:boa_ou_divina'],
    ['Não é bom nem mau: é moldado pelo meio, pela educação e pelas escolhas.', 'natureza_humana:neutra_moldada'],
    ['É uma parte da natureza, sem juízo moral inato.', 'natureza_humana:parte_da_natureza'],
    ['Há as duas coisas: capacidade de bem e propensão ao erro.', 'natureza_humana:decaida:.4 natureza_humana:boa_ou_divina:.4 natureza_humana:neutra_moldada:.2'],
  ]),
  esc('q17', 'salvacao', 'O ser humano pode se aperfeiçoar moral e espiritualmente por seu próprio esforço.',
    S('natureza_humana:decaida', 'natureza_humana:decaida:.5 natureza_humana:neutra_moldada:.2', 'natureza_humana:neutra_moldada:.4 natureza_humana:boa_ou_divina:.4', 'natureza_humana:boa_ou_divina:.8 natureza_humana:neutra_moldada:.2'), { p: 0.7 }),
  esl('q18', 'revelacao', 'De onde vem o conhecimento religioso ou espiritual mais confiável?', [
    ['De uma revelação de Deus por profetas e escrituras.', 'revelacao:revelacao_escrita_profetica'],
    ['Da tradição dos ancestrais, dos mitos e dos ritos de um povo.', 'revelacao:tradicao_ancestral'],
    ['Da experiência direta (meditação, despertar), guiada por mestres.', 'revelacao:iluminacao_mestre'],
    ['Da razão, da reflexão filosófica e do diálogo.', 'revelacao:razao_filosofia'],
    ['Não existe conhecimento sagrado especial.', 'revelacao:sem_conhecimento_sagrado'],
  ]),
  esc('q19', 'revelacao', 'Deus ou o divino já se comunicou com a humanidade por meio de profetas ou mensageiros.',
    S('revelacao:razao_filosofia:.4 revelacao:sem_conhecimento_sagrado:.4', 'revelacao:razao_filosofia:.3 revelacao:iluminacao_mestre:.3', 'revelacao:revelacao_escrita_profetica:.7 revelacao:iluminacao_mestre:.3', 'revelacao:revelacao_escrita_profetica'), { p: 0.8 }),
  esc('q20', 'revelacao', 'Os textos sagrados de uma tradição são palavra de Deus (ou inspirados) e devem orientar a vida.',
    S('autoridade:sem_autoridade_fixa:.6 autoridade:mestre_experiencia:.4', 'autoridade:sem_autoridade_fixa:.4 autoridade:mestre_experiencia:.3', 'autoridade:escritura_tradicao:.6 autoridade:escritura_unica:.4', 'autoridade:escritura_unica:.5 autoridade:escritura_tradicao:.5'), { p: 0.6 }),
  esl('q21', 'revelacao', 'Em questões religiosas, quem tem a última palavra?', [
    ['O texto sagrado, lido diretamente.', 'autoridade:escritura_unica'],
    ['O texto sagrado interpretado dentro de uma tradição e de uma hierarquia.', 'autoridade:escritura_tradicao'],
    ['Os mais velhos e guardiões da tradição oral.', 'autoridade:tradicao_oral_anciaos'],
    ['Um mestre espiritual ou a experiência direta.', 'autoridade:mestre_experiencia'],
    ['Cada pessoa, segundo sua própria consciência.', 'autoridade:sem_autoridade_fixa'],
  ]),
  esl('q22', 'revelacao', 'Qual é o papel de profetas, mestres e figuras espirituais?', [
    ['São mensageiros de Deus que trazem uma verdade que devemos seguir.', 'revelacao:revelacao_escrita_profetica:.7 autoridade:escritura_tradicao:.3'],
    ['São exemplos de despertar: mostram um caminho que posso percorrer.', 'revelacao:iluminacao_mestre:.7 autoridade:mestre_experiencia:.3'],
    ['São mediadores entre a comunidade e o sagrado, herdeiros da tradição.', 'revelacao:tradicao_ancestral:.7 autoridade:tradicao_oral_anciaos:.3'],
    ['São sábios que inspiram, sem autoridade especial.', 'revelacao:razao_filosofia:.7 autoridade:sem_autoridade_fixa:.3'],
    ['Não creio no papel especial de ninguém.', 'revelacao:sem_conhecimento_sagrado:.7 autoridade:sem_autoridade_fixa:.3'],
  ], { p: 0.6 }),
  esl('q23', 'pratica', 'Que forma de vivência espiritual mais combina com você?', [
    ['Cultos, liturgias e celebrações em comunidade.', 'praticas:liturgia_comunitaria'],
    ['Rituais, oferendas e festas para deuses, espíritos ou ancestrais.', 'praticas:ritual_ofertas'],
    ['Meditação, contemplação ou silêncio interior.', 'praticas:meditacao_contemplacao'],
    ['Transe, possessão, cura ou jornadas xamânicas.', 'praticas:xamanismo_possessao'],
    ['Viver de modo ético e cuidadoso: a vida é a prática.', 'praticas:observancia_etica'],
    ['Nenhuma prática específica.', 'praticas:minima'],
  ]),
  esc('q24', 'pratica', 'Prefiro ritos e cerimônias formais a uma prática simples e pessoal.',
    S('praticas:meditacao_contemplacao:.6 praticas:minima:.4', 'praticas:meditacao_contemplacao:.5 praticas:minima:.2', 'praticas:liturgia_comunitaria:.5 praticas:ritual_ofertas:.3', 'praticas:liturgia_comunitaria:.5 praticas:ritual_ofertas:.5'), { p: 0.7 }),
  esc('q25', 'pratica', 'Já tive experiências espirituais marcantes (presença, unidade, êxtase, comunicação com o invisível).',
    S('', '', 'revelacao:iluminacao_mestre:.3', 'revelacao:iluminacao_mestre:.5 autoridade:mestre_experiencia:.3'), { p: 0.4, traco: 'experiencia' }),
  esl('q26', 'comunidade', 'Que lugar uma comunidade ou instituição ocupa na sua vida espiritual?', [
    ['Preciso de uma instituição com liderança, doutrina e cargos definidos.', 'organizacao:hierarquia_institucional'],
    ['Preciso de uma comunidade local próxima, com liderança simples.', 'organizacao:comunidade_local'],
    ['Preciso de um mestre ou guia espiritual e de uma linhagem de ensino.', 'organizacao:linhagem_mestre'],
    ['Meu caminho é pessoal, sem depender de instituição ou comunidade.', 'organizacao:individual_autonoma'],
  ]),
  esc('q27', 'comunidade', 'A religião deveria orientar a vida pública e a ordem da sociedade.',
    S('sociedade:escolha_privada:.7', 'sociedade:escolha_privada:.4', 'sociedade:integrada_ordem_social:.4', 'sociedade:integrada_ordem_social:.8'), { p: 0.7 }),
  esc('q28', 'comunidade', 'A religião deve se dedicar à justiça social e à transformação da sociedade.',
    S('', '', 'sociedade:transformacao_social:.4', 'sociedade:transformacao_social:.8'), { p: 0.6 }),
  esc('q29', 'comunidade', 'Afastar-se do mundo (retiro, silêncio, renúncia) ajuda a vida espiritual.',
    S('', '', 'sociedade:retiro_renuncia:.4', 'sociedade:retiro_renuncia:.8'), { p: 0.6 }),
  esc('q30', 'comunidade', 'Pertencer a um povo ou comunidade, com costumes e laços compartilhados, é parte essencial da religião.',
    S('sociedade:escolha_privada:.4', 'sociedade:escolha_privada:.3', 'sociedade:identidade_comunitaria:.4 organizacao:comunidade_local:.2', 'sociedade:identidade_comunitaria:.8 organizacao:comunidade_local:.4'), { p: 0.6 }),
  esl('q31', 'etica', 'O que fundamenta, para você, o certo e o errado?', [
    ['Os mandamentos de Deus.', 'etica:mandamento_divino'],
    ['Uma ordem cósmica ou lei natural da realidade (dharma, tao, ordem do mundo).', 'etica:ordem_cosmica'],
    ['A compaixão e o princípio de não causar dano a nenhum ser vivo.', 'etica:compaixao_nao_dano'],
    ['A reciprocidade, a honra e os deveres com família e comunidade.', 'etica:reciprocidade_comunitaria'],
    ['A razão, a empatia e a experiência humana, independentemente de religião.', 'etica:razao_humanista'],
  ]),
  esc('q32', 'etica', 'Sem Deus ou religião, a moral perderia seu fundamento.',
    S('etica:razao_humanista', 'etica:razao_humanista:.6 etica:compaixao_nao_dano:.2', 'etica:mandamento_divino:.5 etica:ordem_cosmica:.3', 'etica:mandamento_divino'), { p: 0.7 }),
  esc('q33', 'etica', 'Não causar sofrimento a nenhum ser vivo é o centro da vida moral.',
    S('', '', 'etica:compaixao_nao_dano:.4', 'etica:compaixao_nao_dano:.8'), { p: 0.5 }),
  esc('q34', 'etica', 'Temos livre-arbítrio real: nossas escolhas não estão decididas de antemão.',
    ['', '', '', '', ''], { traco: 'livre_arbitrio' }),
  esc('q35', 'etica', 'Nossa vida segue um plano ou destino já traçado (por Deus, pelo karma ou pela ordem do mundo).',
    ['', '', '', '', ''], { traco: 'destino' }),
  esl('q36', 'ciencia', 'Como você vê a relação entre ciência e religião?', [
    ['São complementares: a ciência explica o como e a religião o porquê.', 'ciencia:complementares'],
    ['A religião deve ser compatível com as evidências e o conhecimento científico.', 'ciencia:dialogo_empirico'],
    ['São domínios separados que não devem se misturar.', 'ciencia:dominios_separados'],
    ['Quando entram em conflito, as escrituras prevalecem sobre a ciência.', 'ciencia:tensao_literalista'],
    ['A ciência explica a realidade; a religião não tem autoridade sobre fatos.', 'ciencia:dialogo_empirico:.6 ciencia:dominios_separados:.4'],
    ['Não tenho posição.', 'ciencia:indefinida'],
  ]),
  esc('q37', 'ciencia', 'Os relatos sagrados sobre a origem e a história do mundo devem ser lidos de forma literal.',
    S('ciencia:dialogo_empirico:.5 ciencia:dominios_separados:.3', 'ciencia:dialogo_empirico:.4 ciencia:complementares:.3', 'ciencia:tensao_literalista:.4', 'ciencia:tensao_literalista:.8'), { p: 0.7 }),
  esl('q38', 'pluralismo', 'Qual é a sua visão sobre a verdade entre as religiões?', [
    ['Só uma religião é verdadeira ou leva à salvação.', 'pluralismo:exclusivismo'],
    ['Uma é a mais completa, mas as outras têm verdades parciais.', 'pluralismo:inclusivismo'],
    ['Várias religiões são caminhos igualmente válidos.', 'pluralismo:pluralismo'],
    ['Cada povo tem seu próprio caminho; nenhum é para todos.', 'pluralismo:sem_pretensao_universal'],
    ['Não considero que alguma religião seja verdadeira em sentido especial.', '', { na: 'pluralismo' }],
  ]),
  esc('q39', 'pluralismo', 'Posso aprender algo verdadeiro sobre o sagrado com tradições diferentes da minha.',
    S('pluralismo:exclusivismo', 'pluralismo:exclusivismo:.5 pluralismo:inclusivismo:.5', 'pluralismo:inclusivismo:.5 pluralismo:pluralismo:.5', 'pluralismo:pluralismo'), { p: 0.7 }),
  esc('q40', 'pluralismo', 'Quem não segue o meu caminho espiritual tem mais dificuldade de alcançar a meta espiritual.',
    S('pluralismo:pluralismo', 'pluralismo:pluralismo:.6 pluralismo:inclusivismo:.4', 'pluralismo:inclusivismo:.5 pluralismo:exclusivismo:.5', 'pluralismo:exclusivismo'), { p: 0.7 }),
  esc('q41', 'alma_morte', 'Tudo o que existe é matéria; não há nada além do mundo físico.',
    S('alma:alma_unica_eterna:.3 alma:alma_preexistente:.3 alma:alma_multipla:.3', 'alma:alma_unica_eterna:.2 alma:alma_preexistente:.2 alma:alma_multipla:.2', 'alma:mortal:.3 natureza_divina:sem_realidade_suprema:.3', 'alma:mortal:.6 natureza_divina:sem_realidade_suprema:.5 teismo:nao_teismo:.3 pos_morte:nada_ou_incerto:.3'), { p: 0.8 }),
  esc('q42', 'deus', 'Existem espíritos, ancestrais ou seres invisíveis que interagem com o nosso mundo.',
    S('teismo:nao_teismo:.3 alma:mortal:.2', 'teismo:nao_teismo:.15', 'teismo:animismo:.3 pos_morte:mundo_ancestral:.3', 'teismo:animismo:.5 pos_morte:mundo_ancestral:.5'), { p: 0.5 }),
  esc('q43', 'pratica', 'Certos lugares, objetos ou ritos carregam um poder sagrado real.',
    S('praticas:minima:.4 praticas:meditacao_contemplacao:.2', '', 'praticas:ritual_ofertas:.3 praticas:liturgia_comunitaria:.2', 'praticas:ritual_ofertas:.5 praticas:liturgia_comunitaria:.3'), { p: 0.5 }),
  esc('q44', 'pratica', 'Rezo ou falo com Deus (ou com divindades) esperando ser ouvido(a).',
    S('natureza_divina:impessoal:.3 natureza_divina:sem_realidade_suprema:.3', '', 'natureza_divina:pessoal_transcendente:.3 natureza_divina:pessoal_imanente:.3', 'natureza_divina:pessoal_transcendente:.5 natureza_divina:pessoal_imanente:.5'), { p: 0.6 }),
];

const QMAP = Object.fromEntries(PERGUNTAS.map(q => [q.id, q]));

/** Perguntas para o cliente: sem efeitos (a avaliação é feita no servidor), com as dimensões que cada uma informa. */
function perguntasPublicas() {
  return PERGUNTAS.map((q, i) => {
    const dims = new Set();
    (q.tipo === 'escolha' ? q.opcoes.flatMap(o => o.e) : q.efeitos.flat()).forEach(e => dims.add(e.dim));
    const tema = TEMAS.find(t => t.id === q.tema);
    return {
      id: q.id, n: i + 1, tema: q.tema, tema_nome: tema.nome, tipo: q.tipo, texto: q.texto, ajuda: q.ajuda || null,
      opcoes: q.tipo === 'escolha' ? q.opcoes.map((o, k) => ({ i: k + 1, t: o.t })) : undefined,
      dimensoes: [...dims], traco: q.traco || null,
    };
  });
}

/** respostas: { q1: 3, q2: 0, ... }  (escolha: índice 1..n; escala: 1..5; 0/ausente = pulou) */
function avaliar(respostas) {
  const massas = {};       // dim -> { opcao: massa }
  const tracos = {}; const tracosFlags = {}; const naExplicito = new Set();
  let respondidas = 0, informativas = 0; const porTema = {};
  for (const q of PERGUNTAS) {
    const v = Number(respostas?.[q.id]); if (!Number.isInteger(v) || v <= 0) continue;
    let efeitos = null;
    if (q.tipo === 'escolha') {
      const o = q.opcoes[v - 1]; if (!o) continue;
      efeitos = o.e; respondidas++;
      if (o.tr) tracosFlags[o.tr] = (tracosFlags[o.tr] || 0) + 1;
      if (o.na) naExplicito.add(o.na);
    } else {
      if (v < 1 || v > 5) continue; respondidas++;
      if (q.traco) tracos[q.traco] = (v - 1) * 25;
      efeitos = q.efeitos[v - 1];
    }
    porTema[q.tema] = (porTema[q.tema] || 0) + 1;
    if (!efeitos || !efeitos.length) continue;
    informativas++;
    const p = q.p ?? 1;
    for (const e of efeitos) { ((massas[e.dim] ??= {})[e.opcao] ??= 0); massas[e.dim][e.opcao] += e.massa * p; }
  }
  const respostasCompat = {};
  for (const [dim, m] of Object.entries(massas)) respostasCompat[dim] = { opcoes: m, importancia: 2 };
  return { respostasCompat, massas, tracos, tracosFlags, naExplicito: [...naExplicito], respondidas, informativas, porTema, total: PERGUNTAS.length };
}

/** Código compartilhável v1: 1 caractere base36 por pergunta (0=pulou) + '-' + 1 dígito (1..3) por tema. */
function codificar(respostas, importancias = {}) {
  const r = PERGUNTAS.map(q => { const v = Number(respostas?.[q.id]); return Number.isInteger(v) && v > 0 && v < 36 ? v.toString(36) : '0'; }).join('');
  const im = TEMAS.map(t => Math.min(3, Math.max(1, Math.round(Number(importancias?.[t.id]) || 2)))).join('');
  return `v1-${r}-${im}`;
}
function decodificar(codigo) {
  const m = /^v1-([0-9a-z]+)-([1-3]+)$/.exec(String(codigo || '').toLowerCase());
  if (!m) return null;
  const respostas = {}, importancias = {};
  PERGUNTAS.forEach((q, i) => { const c = m[1][i]; if (c && c !== '0') respostas[q.id] = parseInt(c, 36); });
  TEMAS.forEach((t, i) => { importancias[t.id] = Number(m[2][i]) || 2; });
  return { respostas, importancias };
}
module.exports = { PERGUNTAS, QMAP, TEMAS, TEMA_DE_DIM, perguntasPublicas, avaliar, codificar, decodificar };
