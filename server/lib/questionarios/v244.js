'use strict';
/**
 * QUESTIONÁRIO ACADÊMICO — 244 perguntas próprias (nenhuma repete a versão de 44 nem a de 128).
 * Em vez de ampliar a mesma lista, explora nuances: dilemas e cenários, mal e sofrimento, mistério e experiência, cuidado com os mortos,
 * meios de transformação, carisma e profecia, magia e cura, vida familiar, justiça social, religião e Estado, religiões antigas e modernas.
 * Distribuição: Deus 28 · Origem 15 · Alma e morte 32 · Salvação 22 · Revelação 28 · Prática 28 · Ética 28 · Ciência 14 · Pluralismo 19 · Comunidade 26.
 * Traços complementares (não entram na comparação): misticismo, milagres, apego à tradição, ascetismo, missão, fim dos tempos, destino, livre-arbítrio, experiência.
 * ATENÇÃO: a ordem deste array faz parte do código de compartilhamento (v244). Só acrescente no FIM.
 */
const { esl, ES, blk } = require('./dsl');
let n = 0; const id = () => 'p' + (++n);
const L = (tema, texto, ops, x) => esl(id(), tema, texto, ops, x);
const A = (tema, texto, a, b, x) => ES(id(), tema, texto, a, b, x);
const P = [];

// ============ DEUS, DEUSES E O DIVINO (28) ============
P.push(...blk('Concepções do divino', [
  L('deus', 'Imagine que o divino existe. Qual destas descrições lhe parece a menos inadequada?', [
    ['Um ser pessoal, criador e distinto do mundo.', 'natureza_divina:pessoal_transcendente:.8 teismo:monoteismo:.8'],
    ['Um espírito que habita cada coisa viva.', 'natureza_divina:pessoal_imanente:.5 teismo:animismo:.4'],
    ['Uma consciência universal da qual tudo faz parte.', 'teismo:panteismo:.5 natureza_divina:impessoal:.3 natureza_divina:pessoal_imanente:.2'],
    ['Uma pluralidade de poderes, cada um com seu domínio.', 'teismo:politeismo:.7'],
    ['Um deus principal entre vários, a quem presto culto especial.', 'teismo:henoteismo:.8'],
    ['Um princípio abstrato: lei, razão ou vazio.', 'natureza_divina:impessoal:.8'],
    ['Um par de forças opostas em tensão permanente.', 'teismo:dualismo:.7'],
    ['Nenhuma serve: não creio que o divino exista.', 'natureza_divina:sem_realidade_suprema:.6 teismo:nao_teismo:.4'],
  ]),
  A('deus', 'O divino precisa de nós (de nossas oferendas, orações e atos) tanto quanto nós dele.', 'teismo:politeismo:.3 teismo:henoteismo:.2 teismo:animismo:.2 praticas:ritual_ofertas:.2', 'natureza_divina:pessoal_transcendente:.3'),
  A('deus', 'O divino é totalmente outro: nada no mundo se compara a ele.', 'natureza_divina:pessoal_transcendente:.5 teismo:monoteismo:.3', 'natureza_divina:pessoal_imanente:.3 teismo:panteismo:.3'),
  A('deus', 'Cada elemento da natureza (rio, montanha, vento, árvore) tem um espírito próprio, com quem se pode dialogar.', 'teismo:animismo:.6', 'teismo:nao_teismo:.2 natureza_divina:pessoal_transcendente:.1'),
  A('deus', 'Os deuses têm domínios distintos: um para o amor, outro para a guerra, outro para a colheita.', 'teismo:politeismo:.6', 'teismo:monoteismo:.3'),
  A('deus', 'O divino é a percepção de que todas as coisas são uma só, e não um ser que me escuta.', 'natureza_divina:impessoal:.5 teismo:panteismo:.3', 'natureza_divina:pessoal_transcendente:.2 natureza_divina:pessoal_imanente:.2'),
  A('deus', 'Os deuses nascem, envelhecem ou morrem, como tudo no cosmos.', 'teismo:politeismo:.4 origem:cosmogonia_mitica:.3', 'natureza_divina:pessoal_transcendente:.3'),
  A('deus', 'O sagrado tem polaridades que se complementam: feminino e masculino, luz e sombra, céu e terra.', 'teismo:politeismo:.3 teismo:dualismo:.2 natureza_divina:impessoal:.1', 'teismo:monoteismo:.2'),
]));
P.push(...blk('Presença e relação', [
  L('deus', 'Num momento muito difícil, a quem ou a que você costuma recorrer (ou recorreria)?', [
    ['A Deus, em oração pessoal.', 'natureza_divina:pessoal_transcendente:.4 natureza_divina:pessoal_imanente:.3'],
    ['A espíritos, santos ou ancestrais protetores.', 'teismo:animismo:.4 teismo:politeismo:.2 pos_morte:mundo_ancestral:.3'],
    ['A uma força interior ou a um estado de calma.', 'natureza_divina:impessoal:.3 praticas:meditacao_contemplacao:.3'],
    ['À família e à comunidade.', 'organizacao:comunidade_local:.4 sociedade:identidade_comunitaria:.3'],
    ['A mim mesmo(a), à razão ou a profissionais.', 'natureza_divina:sem_realidade_suprema:.3 etica:razao_humanista:.2'],
    ['A um mestre ou guia espiritual.', 'organizacao:linhagem_mestre:.5 autoridade:mestre_experiencia:.2'],
  ]),
  A('deus', 'Deus (ou o divino) responde a orações específicas.', 'natureza_divina:pessoal_transcendente:.4 natureza_divina:pessoal_imanente:.3 teismo:monoteismo:.2', 'natureza_divina:impessoal:.3 natureza_divina:sem_realidade_suprema:.3', { traco: 'milagres' }),
  A('deus', 'É possível sentir a presença do divino em lugares específicos (templos, montanhas, árvores, ruínas).', 'teismo:animismo:.2 praticas:ritual_ofertas:.3 natureza_divina:pessoal_imanente:.2', 'natureza_divina:sem_realidade_suprema:.2'),
  A('deus', 'O divino fala comigo por meio da minha consciência.', 'natureza_divina:pessoal_imanente:.5', 'natureza_divina:sem_realidade_suprema:.2 natureza_divina:pessoal_transcendente:.1'),
  A('deus', 'Minha relação com o divino é de intimidade, quase de amizade.', 'natureza_divina:pessoal_imanente:.5', 'natureza_divina:pessoal_transcendente:.3 natureza_divina:impessoal:.2'),
  A('deus', 'Diante do divino, o sentimento mais adequado é a reverência e o temor.', 'natureza_divina:pessoal_transcendente:.4 etica:mandamento_divino:.2 teismo:monoteismo:.2', 'natureza_divina:pessoal_imanente:.3 natureza_divina:impessoal:.1'),
]));
P.push(...blk('Mal, sofrimento e justiça cósmica', [
  L('deus', 'Quando uma pessoa boa sofre uma injustiça, qual explicação lhe parece mais razoável?', [
    ['Há um plano divino que não conseguimos compreender.', 'natureza_divina:pessoal_transcendente:.5'],
    ['É consequência de ações de vidas anteriores.', 'reencarnacao:central:.4 etica:ordem_cosmica:.4'],
    ['É uma provação que fortalece a fé e a alma.', 'salvacao:merito_obras:.3 natureza_divina:pessoal_transcendente:.3'],
    ['Forças negativas, espíritos ou desequilíbrio na comunidade.', 'teismo:animismo:.3 teismo:dualismo:.3 salvacao:harmonia_equilibrio:.3'],
    ['Acaso e imperfeição do mundo, sem sentido por trás.', 'natureza_divina:sem_realidade_suprema:.5 teismo:nao_teismo:.3'],
    ['Uma ordem natural ou social foi rompida e precisa ser restaurada.', 'salvacao:harmonia_equilibrio:.4 etica:reciprocidade_comunitaria:.3'],
  ]),
  A('deus', 'Um Deus bom e todo-poderoso não permitiria tanto sofrimento no mundo.', 'natureza_divina:sem_realidade_suprema:.4 teismo:nao_teismo:.3', 'natureza_divina:pessoal_transcendente:.3'),
  A('deus', 'O universo tende à justiça: quem faz o mal acaba colhendo as consequências.', 'etica:ordem_cosmica:.5', 'natureza_divina:sem_realidade_suprema:.2'),
  A('deus', 'Existem forças espirituais malignas que procuram prejudicar as pessoas.', 'teismo:dualismo:.4 teismo:animismo:.3', 'natureza_humana:neutra_moldada:.2'),
  A('deus', 'O mal moral nasce da liberdade humana, e não de forças externas.', 'natureza_humana:neutra_moldada:.3 natureza_humana:decaida:.2', 'teismo:dualismo:.3', { traco: 'livre_arbitrio' }),
  A('deus', 'Maldições, mau-olhado e inveja podem causar danos reais.', 'teismo:animismo:.3 praticas:xamanismo_possessao:.3', 'ciencia:dialogo_empirico:.1 teismo:nao_teismo:.1', { traco: 'misticismo' }),
]));
P.push(...blk('Mistério e experiência', [
  A('deus', 'A realidade última só se conhece pela experiência direta, e nunca por meio de palavras.', 'revelacao:iluminacao_mestre:.4 natureza_divina:impessoal:.3', 'revelacao:razao_filosofia:.3', { traco: 'misticismo' }),
  A('deus', 'Posso viver bem sem resolver a questão da existência do divino.', 'teismo:nao_teismo:.2 natureza_divina:sem_realidade_suprema:.1', 'natureza_divina:pessoal_transcendente:.2'),
  A('deus', 'Já tive a sensação de que o tempo parou e de me dissolver em algo maior.', 'revelacao:iluminacao_mestre:.3 pos_morte:uniao_absorcao:.2', '', { traco: 'experiencia', p: 0.5 }),
  A('deus', 'Já vivi uma experiência que mudou o rumo da minha vida e que atribuo ao sagrado.', 'revelacao:iluminacao_mestre:.2', '', { traco: 'experiencia', p: 0.5 }),
  A('deus', 'Os sonhos podem trazer mensagens importantes.', 'teismo:animismo:.2 praticas:xamanismo_possessao:.2', 'ciencia:dialogo_empirico:.1', { traco: 'misticismo' }),
  A('deus', 'As coincidências significativas revelam um sentido oculto na vida.', 'natureza_divina:impessoal:.3 origem:emanacao:.2', 'natureza_divina:sem_realidade_suprema:.2', { traco: 'destino' }),
  A('deus', 'A natureza selvagem (florestas, oceanos, desertos) me aproxima mais do sagrado do que qualquer edifício.', 'teismo:panteismo:.4 teismo:animismo:.2 praticas:meditacao_contemplacao:.2', 'praticas:liturgia_comunitaria:.2'),
]));
P.push(...blk('Mal, sofrimento e justiça cósmica', [
  A('deus', 'A injustiça sofrida nesta vida será compensada de alguma forma depois.', 'pos_morte:julgamento:.3 etica:ordem_cosmica:.2', 'natureza_divina:sem_realidade_suprema:.2 pos_morte:nada_ou_incerto:.2'),
]));

// ============ ORIGEM DO MUNDO (15) ============
P.push(...blk('Cosmos e tempo', [
  L('origem', 'Se o universo teve um começo, o que o antecedeu?', [
    ['Um criador que existe fora do tempo.', 'origem:criacao_do_nada:.8'],
    ['Um estado anterior de caos ou de águas primordiais.', 'origem:cosmogonia_mitica:.8'],
    ['Outro universo, em um ciclo de nascimentos e mortes.', 'origem:ciclico_sem_inicio:.8'],
    ['Um princípio absoluto, do qual tudo se desdobra.', 'origem:emanacao:.8'],
    ['Nada que possamos saber.', 'origem:indefinida:.7'],
    ['O universo nunca teve começo.', 'origem:ciclico_sem_inicio:.7'],
  ]),
  A('origem', 'O tempo é circular: tudo o que acontece volta a acontecer de alguma forma.', 'origem:ciclico_sem_inicio:.5', 'origem:criacao_do_nada:.2'),
  A('origem', 'A história tem um sentido linear, do início a um fim definido.', 'origem:criacao_do_nada:.3', 'origem:ciclico_sem_inicio:.4', { traco: 'escatologia' }),
  A('origem', 'Os primeiros seres (humanos ou deuses) fundaram a ordem do mundo num tempo mítico, ao qual os ritos nos reconduzem.', 'origem:cosmogonia_mitica:.5 praticas:ritual_ofertas:.2', 'ciencia:dialogo_empirico:.1'),
  A('origem', 'Todo ser vivo é uma expressão do mesmo princípio original.', 'origem:emanacao:.5 teismo:panteismo:.2', 'origem:criacao_do_nada:.2'),
  A('origem', 'O mundo nasceu da ordenação do caos, e essa ordem precisa ser mantida contra o caos.', 'origem:cosmogonia_mitica:.4 teismo:dualismo:.2 salvacao:ordem_ritual:.2', ''),
  A('origem', 'A ciência pode, em princípio, explicar toda a origem do universo sem recorrer a nada além da natureza.', 'origem:indefinida:.5 ciencia:dialogo_empirico:.1 natureza_divina:sem_realidade_suprema:.2', 'origem:criacao_do_nada:.2 origem:emanacao:.2'),
  A('origem', 'A origem do universo é um mistério que a razão não alcança.', 'origem:indefinida:.4', 'ciencia:dialogo_empirico:.1'),
]));
P.push(...blk('Origem da humanidade', [
  L('origem', 'Como surgiu a humanidade?', [
    ['Foi criada por Deus de modo direto.', 'origem:criacao_do_nada:.6 ciencia:tensao_literalista:.2'],
    ['Foi criada por deuses ou seres primordiais, como contam os mitos.', 'origem:cosmogonia_mitica:.6'],
    ['Surgiu por evolução, e o divino pode agir por meio dela.', 'ciencia:complementares:.5 ciencia:dialogo_empirico:.1'],
    ['Surgiu por evolução natural, sem desígnio.', 'origem:indefinida:.4 ciencia:dialogo_empirico:.1 natureza_divina:sem_realidade_suprema:.2'],
    ['Emanou da consciência cósmica em fases sucessivas.', 'origem:emanacao:.6'],
    ['Existe desde sempre, em ciclos.', 'origem:ciclico_sem_inicio:.5'],
  ]),
  A('origem', 'Os seres humanos vieram de um povo, lugar ou ancestral sagrado específico.', 'origem:cosmogonia_mitica:.4 sociedade:identidade_comunitaria:.3', 'natureza_humana:parte_da_natureza:.1'),
  A('origem', 'Já existiram humanidades em eras anteriores, e podem existir outras no futuro.', 'origem:ciclico_sem_inicio:.4', 'origem:criacao_do_nada:.2'),
  A('origem', 'A alma humana existia antes do nascimento, em outro estado ou mundo.', 'alma:alma_preexistente:.5 origem:emanacao:.2', 'alma:alma_unica_eterna:.2 alma:mortal:.2'),
  A('origem', 'O ser humano é um microcosmo: reflete em si a estrutura do universo.', 'origem:emanacao:.3 teismo:panteismo:.3', '', { traco: 'misticismo' }),
  A('origem', 'A diversidade e a complexidade da vida revelam uma inteligência por trás da natureza.', 'origem:criacao_do_nada:.3 origem:emanacao:.2 natureza_divina:pessoal_transcendente:.2', 'ciencia:dialogo_empirico:.1 origem:indefinida:.2'),
  A('origem', 'A criação é contínua: o mundo é recriado a cada instante.', 'origem:emanacao:.4 natureza_divina:pessoal_imanente:.2', 'origem:indefinida:.1'),
]));

// ============ ALMA, MORTE E VIDA FUTURA (32) ============
P.push(...blk('Natureza da pessoa', [
  L('alma_morte', 'O que acontece com a mente (pensamentos, memórias, personalidade) depois da morte do corpo?', [
    ['Continua intacta, em outro plano.', 'alma:alma_unica_eterna:.5 pos_morte:julgamento:.3'],
    ['Passa para outro corpo, mas as memórias se perdem.', 'pos_morte:renascimento:.5 alma:alma_preexistente:.3'],
    ['Dissolve-se na consciência universal.', 'pos_morte:uniao_absorcao:.6'],
    ['Permanece como espírito próximo dos vivos.', 'pos_morte:mundo_ancestral:.6'],
    ['Cessa junto com o cérebro.', 'alma:mortal:.6 pos_morte:nada_ou_incerto:.4 ressurreicao:rejeitada:.2 reencarnacao:rejeitada:.2'],
    ['Não sei dizer.', ''],
  ]),
  A('alma_morte', 'Ser pessoa é, principalmente, ter um corpo: a mente depende dele.', 'alma:mortal:.5', 'alma:alma_unica_eterna:.2 alma:alma_preexistente:.2'),
  A('alma_morte', 'Meu verdadeiro eu é idêntico ao eu de todos os seres.', 'pos_morte:uniao_absorcao:.3 teismo:panteismo:.3 alma:sem_eu:.2', 'alma:alma_unica_eterna:.3'),
  A('alma_morte', 'Cada indivíduo é único e insubstituível aos olhos do divino.', 'alma:alma_unica_eterna:.5 natureza_divina:pessoal_transcendente:.2', 'alma:sem_eu:.3'),
  A('alma_morte', 'Nada em mim é permanente: nem o corpo, nem os sentimentos, nem os pensamentos.', 'alma:sem_eu:.6', 'alma:alma_unica_eterna:.3 alma:alma_preexistente:.3'),
  A('alma_morte', 'O nome, a sombra e a respiração de uma pessoa têm existência própria.', 'alma:alma_multipla:.6', 'alma:mortal:.2'),
  A('alma_morte', 'Sonhar pode ser viajar com o espírito para outros mundos.', 'alma:alma_multipla:.3 teismo:animismo:.2', 'ciencia:dialogo_empirico:.1', { traco: 'misticismo' }),
  A('alma_morte', 'O sofrimento e a alegria dos outros me dizem respeito como se fossem meus.', 'alma:sem_eu:.2 etica:compaixao_nao_dano:.4', ''),
]));
P.push(...blk('Reencarnação e ressurreição', [
  A('alma_morte', 'Cada pessoa renasce muitas vezes, até se purificar ou despertar.', 'reencarnacao:central:.7 pos_morte:renascimento:.3', 'reencarnacao:rejeitada:.5'),
  A('alma_morte', 'Uma pessoa pode renascer como animal, planta ou espírito, conforme suas ações.', 'reencarnacao:central:.4 pos_morte:renascimento:.3 etica:ordem_cosmica:.2', 'reencarnacao:rejeitada:.3'),
  A('alma_morte', 'Uma criança que nasce pode ser o retorno de um antepassado.', 'reencarnacao:admitida:.5 pos_morte:mundo_ancestral:.3', 'reencarnacao:rejeitada:.3'),
  A('alma_morte', 'Só vivemos uma vez: o que fazemos nesta vida é decisivo para sempre.', 'reencarnacao:rejeitada:.6 pos_morte:julgamento:.3', 'reencarnacao:central:.4'),
  A('alma_morte', 'No fim dos tempos, haverá uma ressurreição geral dos mortos.', 'ressurreicao:central:.8', 'ressurreicao:rejeitada:.4', { traco: 'escatologia' }),
  A('alma_morte', 'Os mortos podem retornar ao mundo dos vivos como espíritos.', 'pos_morte:mundo_ancestral:.4 ressurreicao:admitida:.1 teismo:animismo:.2', 'pos_morte:nada_ou_incerto:.2'),
  A('alma_morte', '“Vida eterna” pode significar viver plenamente o presente, e não continuar depois da morte.', 'pos_morte:nada_ou_incerto:.3 alma:mortal:.2 salvacao:sem_salvacao:.2', 'pos_morte:julgamento:.2 pos_morte:renascimento:.2'),
]));
P.push(...blk('Destino final', [
  L('alma_morte', 'Se você pudesse escolher o desfecho final da existência, qual lhe parece o mais desejável?', [
    ['Viver para sempre na presença de Deus.', 'pos_morte:julgamento:.5 salvacao:graca_fe:.2 alma:alma_unica_eterna:.3'],
    ['Libertar-me do ciclo de nascimentos e mortes.', 'pos_morte:renascimento:.3 salvacao:conhecimento_pratica:.4 reencarnacao:central:.3'],
    ['Unir-me ao absoluto, dissolvendo a individualidade.', 'pos_morte:uniao_absorcao:.6'],
    ['Fazer parte do mundo dos ancestrais, ao lado da família.', 'pos_morte:mundo_ancestral:.6'],
    ['Reencarnar para continuar aprendendo.', 'pos_morte:renascimento:.5 reencarnacao:central:.3'],
    ['Descansar para sempre em paz.', 'pos_morte:nada_ou_incerto:.5 alma:mortal:.3'],
  ]),
  A('alma_morte', 'Existe um paraíso: um lugar ou estado de felicidade plena.', 'pos_morte:julgamento:.4 ressurreicao:central:.2', 'pos_morte:nada_ou_incerto:.2'),
  A('alma_morte', 'O estado final é a extinção do desejo, e não um lugar.', 'pos_morte:uniao_absorcao:.3 salvacao:conhecimento_pratica:.3 alma:sem_eu:.2', 'pos_morte:julgamento:.2'),
  A('alma_morte', 'Os mortos vão para um lugar sombrio e silencioso, igual para todos, sem prêmio nem castigo.', 'pos_morte:reino_sombrio:.7', 'pos_morte:julgamento:.2'),
  A('alma_morte', 'Depois da morte, a alma atravessa uma jornada com provas e guias.', 'pos_morte:julgamento:.2 pos_morte:renascimento:.2 pos_morte:reino_sombrio:.2', 'pos_morte:nada_ou_incerto:.2'),
  A('alma_morte', 'O intervalo entre a morte e um novo nascimento é um tempo de aprendizado e revisão da vida.', 'pos_morte:renascimento:.5 reencarnacao:admitida:.2', 'reencarnacao:rejeitada:.2'),
  A('alma_morte', 'A morte é o início de uma vida mais verdadeira.', 'pos_morte:julgamento:.2 pos_morte:uniao_absorcao:.2 pos_morte:renascimento:.2', 'pos_morte:nada_ou_incerto:.3 alma:mortal:.2'),
  A('alma_morte', 'A morte é parte natural do ciclo da vida, tão necessária quanto o nascimento.', 'natureza_humana:parte_da_natureza:.4 pos_morte:uniao_absorcao:.2', ''),
  A('alma_morte', 'Os vivos têm o dever de ajudar os mortos a seguirem seu caminho (orações, ritos, doações).', 'pos_morte:mundo_ancestral:.4 praticas:ritual_ofertas:.3', 'pos_morte:nada_ou_incerto:.2'),
]));
P.push(...blk('Cuidado com os mortos', [
  L('alma_morte', 'Qual destas formas de lidar com os restos de uma pessoa querida lhe parece mais significativa?', [
    ['Sepultamento com ritos religiosos.', 'praticas:liturgia_comunitaria:.4 ressurreicao:admitida:.3'],
    ['Cremação com cerimônia, libertando a alma.', 'reencarnacao:admitida:.3 pos_morte:renascimento:.3 pos_morte:uniao_absorcao:.2'],
    ['Rituais de memória e oferendas ao longo dos anos.', 'pos_morte:mundo_ancestral:.5 praticas:ritual_ofertas:.3'],
    ['Devolver o corpo à natureza.', 'natureza_humana:parte_da_natureza:.5'],
    ['Despedida simples e laica.', 'alma:mortal:.2 praticas:minima:.3'],
    ['A forma importa pouco.', ''],
  ]),
  A('alma_morte', 'O luto deve ser vivido em comunidade, com ritos que o orientem.', 'sociedade:identidade_comunitaria:.4 praticas:liturgia_comunitaria:.3', 'sociedade:escolha_privada:.3'),
  A('alma_morte', 'É importante falar com os mortos ou conservar objetos que os representem.', 'pos_morte:mundo_ancestral:.4 praticas:ritual_ofertas:.3', 'pos_morte:nada_ou_incerto:.2'),
  A('alma_morte', 'Os antepassados merecem culto e veneração, e não apenas lembrança.', 'pos_morte:mundo_ancestral:.5 praticas:ritual_ofertas:.3', 'alma:mortal:.2'),
  A('alma_morte', 'Doar o corpo ou órgãos é um ato espiritualmente belo.', 'etica:compaixao_nao_dano:.3 etica:razao_humanista:.2', ''),
  A('alma_morte', 'A esperança de reencontrar entes queridos é central para a forma como encaro o luto.', 'pos_morte:julgamento:.3 pos_morte:mundo_ancestral:.2 alma:alma_unica_eterna:.2', 'pos_morte:nada_ou_incerto:.3'),
  A('alma_morte', 'Pensar regularmente na própria morte é um exercício espiritual valioso.', 'praticas:meditacao_contemplacao:.3 salvacao:conhecimento_pratica:.2', ''),
  A('alma_morte', 'Minha vida é observada por um olhar moral que verá tudo o que faço.', 'pos_morte:julgamento:.4 natureza_divina:pessoal_transcendente:.2 teismo:monoteismo:.2', 'natureza_divina:sem_realidade_suprema:.2'),
]));

// ============ SALVAÇÃO, LIBERTAÇÃO E NATUREZA HUMANA (22) ============
P.push(...blk('Caminhos de libertação', [
  L('salvacao', 'Qual imagem descreve melhor o “problema” da condição humana?', [
    ['Estamos separados de Deus e precisamos ser reconciliados.', 'salvacao:graca_fe:.4 natureza_humana:decaida:.4'],
    ['Estamos presos ao ciclo do desejo e do sofrimento.', 'salvacao:conhecimento_pratica:.5'],
    ['Vivemos desalinhados da ordem do mundo e dos ancestrais.', 'salvacao:ordem_ritual:.4 salvacao:harmonia_equilibrio:.3'],
    ['Somos limitados pela ignorância sobre a nossa verdadeira natureza.', 'salvacao:conhecimento_pratica:.4 natureza_humana:boa_ou_divina:.3'],
    ['Não há problema: a vida é para ser vivida.', 'salvacao:sem_salvacao:.6'],
    ['Enfrentamos injustiças sociais que precisam ser corrigidas.', 'sociedade:transformacao_social:.4 etica:razao_humanista:.2'],
  ]),
  A('salvacao', 'O caminho espiritual é uma longa disciplina, com etapas e provas.', 'salvacao:conhecimento_pratica:.4 salvacao:merito_obras:.2', 'salvacao:graca_fe:.2'),
  A('salvacao', 'Um único momento de conversão, entrega ou revelação pode mudar tudo.', 'salvacao:graca_fe:.4', 'salvacao:conhecimento_pratica:.2 salvacao:merito_obras:.2'),
  A('salvacao', 'Há seres iluminados ou santos que podem ajudar os outros a se libertarem.', 'salvacao:graca_fe:.2 autoridade:mestre_experiencia:.3', 'salvacao:sem_salvacao:.2'),
  A('salvacao', 'Cumprir os deveres da minha posição na família e na sociedade é um caminho espiritual.', 'salvacao:ordem_ritual:.3 etica:ordem_cosmica:.3 sociedade:integrada_ordem_social:.2', ''),
  A('salvacao', 'Ritos corretos, realizados com precisão, têm eficácia por si mesmos.', 'salvacao:ordem_ritual:.6 praticas:ritual_ofertas:.3', 'salvacao:graca_fe:.2 salvacao:conhecimento_pratica:.2'),
  A('salvacao', 'Não existe estado final a alcançar: o caminho é o próprio fim.', 'salvacao:harmonia_equilibrio:.3 salvacao:sem_salvacao:.3', 'salvacao:conhecimento_pratica:.2 salvacao:graca_fe:.2'),
  A('salvacao', 'A espiritualidade consiste, sobretudo, em tornar-se uma pessoa melhor aqui e agora.', 'salvacao:sem_salvacao:.3 salvacao:merito_obras:.2 etica:razao_humanista:.2', ''),
]));
P.push(...blk('Natureza humana e limites', [
  L('salvacao', 'Como você descreve a relação entre “o que sou” e “o que deveria ser”?', [
    ['Sou imperfeito(a) por natureza e dependo de ajuda.', 'natureza_humana:decaida:.6 salvacao:graca_fe:.2'],
    ['Tenho um potencial divino a desenvolver.', 'natureza_humana:boa_ou_divina:.6 salvacao:conhecimento_pratica:.2'],
    ['Sou moldado(a) pelo ambiente e pelas minhas escolhas.', 'natureza_humana:neutra_moldada:.6'],
    ['Faço parte da natureza, e meus instintos fazem parte de mim.', 'natureza_humana:parte_da_natureza:.6'],
    ['Tenho luz e sombra ao mesmo tempo.', 'natureza_humana:decaida:.3 natureza_humana:boa_ou_divina:.3 natureza_humana:neutra_moldada:.2'],
    ['Nunca pensei nisso.', ''],
  ]),
  A('salvacao', 'As crianças nascem inocentes, e é a sociedade que as corrompe.', 'natureza_humana:boa_ou_divina:.5', 'natureza_humana:decaida:.4'),
  A('salvacao', 'É da natureza humana buscar poder e vantagem sobre os outros.', 'natureza_humana:decaida:.4', 'natureza_humana:boa_ou_divina:.2 natureza_humana:neutra_moldada:.2'),
  A('salvacao', 'O corpo é um obstáculo para a vida espiritual.', 'salvacao:conhecimento_pratica:.2 natureza_humana:decaida:.1', 'natureza_humana:parte_da_natureza:.3', { traco: 'ascetismo' }),
  A('salvacao', 'O prazer, o amor e o corpo fazem parte do caminho espiritual, e não são um obstáculo.', 'natureza_humana:parte_da_natureza:.4 natureza_humana:boa_ou_divina:.2', '', { traco: 'ascetismo', inv: true }),
  A('salvacao', 'O arrependimento sincero pode limpar qualquer erro.', 'salvacao:graca_fe:.4 natureza_humana:decaida:.2', 'salvacao:merito_obras:.2 etica:ordem_cosmica:.3'),
  A('salvacao', 'Cada pessoa colhe exatamente o que semeia, sem perdão automático.', 'etica:ordem_cosmica:.4 salvacao:merito_obras:.3', 'salvacao:graca_fe:.3'),
]));
P.push(...blk('Meios de transformação', [
  L('salvacao', 'Qual destas práticas você considera a mais transformadora?', [
    ['Oração e confiança em Deus.', 'salvacao:graca_fe:.4 praticas:meditacao_contemplacao:.1'],
    ['Meditação e estudo para compreender a mente.', 'salvacao:conhecimento_pratica:.5 praticas:meditacao_contemplacao:.3'],
    ['Ritos e oferendas na época certa.', 'salvacao:ordem_ritual:.4 praticas:ritual_ofertas:.3'],
    ['Serviço e caridade.', 'salvacao:merito_obras:.4 praticas:observancia_etica:.3'],
    ['Viver em harmonia com a natureza e a comunidade.', 'salvacao:harmonia_equilibrio:.5'],
    ['Autoconhecimento, estudo e terapia laicos.', 'salvacao:sem_salvacao:.3 etica:razao_humanista:.2'],
  ]),
  A('salvacao', 'Um encontro com um mestre pode transformar uma vida.', 'autoridade:mestre_experiencia:.4 salvacao:conhecimento_pratica:.2', ''),
  A('salvacao', 'Jejuns e abstinências fortalecem o espírito.', 'salvacao:merito_obras:.2 salvacao:ordem_ritual:.1', '', { traco: 'ascetismo' }),
  A('salvacao', 'Servir aos pobres e aos doentes é um caminho direto para o sagrado.', 'salvacao:merito_obras:.3 praticas:observancia_etica:.3 etica:compaixao_nao_dano:.2', ''),
  A('salvacao', 'Sacrifícios (de bens, tempo, alimento ou desejos) devem ser oferecidos para manter a relação com o divino ou com a comunidade.', 'salvacao:ordem_ritual:.4 praticas:ritual_ofertas:.4', ''),
  A('salvacao', 'Precisamos de rituais de limpeza e purificação periódicos para restaurar o equilíbrio.', 'salvacao:ordem_ritual:.3 salvacao:harmonia_equilibrio:.3 praticas:ritual_ofertas:.2', ''),
  A('salvacao', 'Perdoar e pedir perdão estão no centro da vida espiritual.', 'etica:compaixao_nao_dano:.3 salvacao:graca_fe:.2', ''),
]));

// ============ REVELAÇÃO, ESCRITURAS E AUTORIDADE (28) ============
P.push(...blk('Textos sagrados', [
  L('revelacao', 'Para você, o que torna um texto “sagrado”?', [
    ['Ter sido ditado ou inspirado por Deus.', 'revelacao:revelacao_escrita_profetica:.7'],
    ['Transmitir a sabedoria de gerações e de ancestrais.', 'revelacao:tradicao_ancestral:.6'],
    ['Registrar os ensinamentos de um mestre desperto.', 'revelacao:iluminacao_mestre:.6'],
    ['Ter profundidade filosófica e moral, resistindo ao tempo.', 'revelacao:razao_filosofia:.5'],
    ['Nenhum texto é sagrado em si.', 'revelacao:sem_conhecimento_sagrado:.6'],
  ]),
  A('revelacao', 'Ler um texto sagrado em sua língua original muda a experiência.', 'autoridade:escritura_tradicao:.3 revelacao:revelacao_escrita_profetica:.2', 'autoridade:sem_autoridade_fixa:.1'),
  A('revelacao', 'Os escritos sagrados podem conter erros ou limitações, pois foram redigidos por seres humanos.', 'revelacao:razao_filosofia:.3 autoridade:sem_autoridade_fixa:.3 ciencia:dialogo_empirico:.1', 'autoridade:escritura_unica:.4 ciencia:tensao_literalista:.2'),
  A('revelacao', 'Os textos sagrados devem ser memorizados e recitados, e não apenas lidos.', 'autoridade:tradicao_oral_anciaos:.3 praticas:liturgia_comunitaria:.2', '', { traco: 'tradicionalismo' }),
  A('revelacao', 'Mitos e lendas sagradas são mais verdadeiros que a história factual, pois dizem quem somos.', 'revelacao:tradicao_ancestral:.4 origem:cosmogonia_mitica:.3', 'ciencia:dialogo_empirico:.1'),
  A('revelacao', 'Um texto sagrado só é compreendido por quem vive segundo seus ensinamentos.', 'autoridade:mestre_experiencia:.3 praticas:observancia_etica:.2', 'revelacao:razao_filosofia:.2'),
  A('revelacao', 'É melhor seguir um texto sagrado à risca, mesmo quando uma passagem parece contrariar o meu senso moral.', 'autoridade:escritura_unica:.5 etica:mandamento_divino:.3', 'etica:razao_humanista:.4'),
  A('revelacao', 'Os livros sagrados de tradições diferentes podem ser lidos como partes de uma sabedoria comum.', 'pluralismo:pluralismo:.4', 'pluralismo:exclusivismo:.3'),
  A('revelacao', 'A leitura em comunidade (estudo em grupo, debates, comentários) é a melhor forma de acessar um texto sagrado.', 'autoridade:escritura_tradicao:.4 organizacao:comunidade_local:.2', 'organizacao:individual_autonoma:.2'),
  A('revelacao', 'Há ensinamentos que não devem ser escritos, apenas transmitidos de viva voz.', 'autoridade:tradicao_oral_anciaos:.4 organizacao:linhagem_mestre:.3', 'autoridade:escritura_unica:.2'),
]));
P.push(...blk('Profetas, mestres e carisma', [
  L('revelacao', 'Imagine que surge hoje alguém afirmando ter recebido uma mensagem divina. Como você reagiria?', [
    ['Compararia a mensagem com o que as escrituras já dizem.', 'autoridade:escritura_tradicao:.4 autoridade:escritura_unica:.3'],
    ['Observaria se a pessoa vive de modo exemplar e traz sabedoria.', 'autoridade:mestre_experiencia:.4 revelacao:iluminacao_mestre:.3'],
    ['Consultaria os anciãos ou líderes da comunidade.', 'autoridade:tradicao_oral_anciaos:.4 organizacao:hierarquia_institucional:.2'],
    ['Duvidaria e pediria evidências.', 'revelacao:razao_filosofia:.4 ciencia:dialogo_empirico:.1'],
    ['Acolheria com abertura: a revelação não terminou.', 'revelacao:revelacao_escrita_profetica:.3 revelacao:iluminacao_mestre:.3 autoridade:sem_autoridade_fixa:.2'],
    ['Não daria importância.', 'revelacao:sem_conhecimento_sagrado:.4'],
  ]),
  A('revelacao', 'Um líder carismático vivo pode ter acesso especial ao divino.', 'autoridade:mestre_experiencia:.4 organizacao:linhagem_mestre:.3', 'organizacao:individual_autonoma:.2'),
  A('revelacao', 'Religiões recentes podem ser tão legítimas quanto as antigas.', 'revelacao:iluminacao_mestre:.2 pluralismo:pluralismo:.2', 'autoridade:escritura_tradicao:.2', { traco: 'tradicionalismo', inv: true }),
  A('revelacao', 'Uma verdade espiritual é mais confiável quanto mais antiga é a tradição que a transmite.', 'autoridade:escritura_tradicao:.3 revelacao:tradicao_ancestral:.3', 'autoridade:sem_autoridade_fixa:.2', { traco: 'tradicionalismo' }),
  A('revelacao', 'Profetas e mestres falam ao seu tempo: suas mensagens precisam ser atualizadas.', 'autoridade:sem_autoridade_fixa:.3', 'autoridade:escritura_unica:.3'),
  A('revelacao', 'Existem pessoas que alcançaram sabedoria plena, e cujas palavras merecem total confiança.', 'revelacao:iluminacao_mestre:.5 autoridade:mestre_experiencia:.3', 'revelacao:razao_filosofia:.2'),
  A('revelacao', 'Sacerdotes e xamãs formados numa tradição são mediadores indispensáveis entre as pessoas e o sagrado.', 'organizacao:hierarquia_institucional:.2 organizacao:linhagem_mestre:.2 praticas:xamanismo_possessao:.2', 'organizacao:individual_autonoma:.3'),
  A('revelacao', 'Visões e experiências de êxtase devem ser verificadas pela tradição antes de serem aceitas.', 'autoridade:escritura_tradicao:.4 organizacao:hierarquia_institucional:.2', 'autoridade:mestre_experiencia:.2 autoridade:sem_autoridade_fixa:.2'),
  A('revelacao', 'A mensagem de um mestre vale pelo que ensina, e não por quem ele ou ela diz ser.', 'revelacao:razao_filosofia:.3 autoridade:sem_autoridade_fixa:.2', 'autoridade:mestre_experiencia:.2'),
]));
P.push(...blk('Razão, filosofia e dúvida', [
  A('revelacao', 'Argumentos filosóficos podem demonstrar a existência de uma realidade última.', 'revelacao:razao_filosofia:.4 natureza_divina:impessoal:.1 natureza_divina:pessoal_transcendente:.1', 'revelacao:sem_conhecimento_sagrado:.3'),
  A('revelacao', 'Duvidar faz parte de uma vida espiritual saudável.', 'revelacao:razao_filosofia:.3 autoridade:sem_autoridade_fixa:.3', 'autoridade:escritura_unica:.2'),
  A('revelacao', 'Algumas verdades fundamentais não podem ser provadas pela razão, mas é razoável aceitá-las.', 'revelacao:revelacao_escrita_profetica:.3 revelacao:iluminacao_mestre:.2', 'revelacao:razao_filosofia:.3 revelacao:sem_conhecimento_sagrado:.2'),
  A('revelacao', 'Filosofia e religião tratam das mesmas perguntas, por métodos diferentes.', 'revelacao:razao_filosofia:.3 ciencia:complementares:.2', ''),
  A('revelacao', 'O estudo e o debate, como em uma escola ou academia, são práticas espirituais por si mesmos.', 'revelacao:razao_filosofia:.4 praticas:observancia_etica:.1', ''),
  L('revelacao', 'Que papel a razão ocupa na sua vida espiritual?', [
    ['Serve a uma fé que a ultrapassa.', 'revelacao:revelacao_escrita_profetica:.4'],
    ['É um instrumento para esclarecer a experiência e a tradição.', 'autoridade:escritura_tradicao:.3 revelacao:razao_filosofia:.2'],
    ['É o guia principal: o resto precisa passar por ela.', 'revelacao:razao_filosofia:.6'],
    ['É insuficiente: só a experiência direta liberta.', 'revelacao:iluminacao_mestre:.5'],
    ['Tenho pouca vida espiritual, então tanto faz.', 'revelacao:sem_conhecimento_sagrado:.3'],
  ]),
  A('revelacao', 'Há conhecimentos sagrados que não devem ser compartilhados com quem não foi preparado para recebê-los.', 'organizacao:linhagem_mestre:.3 revelacao:iluminacao_mestre:.2', '', { traco: 'misticismo' }),
  A('revelacao', 'Símbolos e imagens sagradas comunicam o que as palavras não alcançam.', 'revelacao:iluminacao_mestre:.2 revelacao:tradicao_ancestral:.2', 'revelacao:razao_filosofia:.2', { traco: 'misticismo' }),
  A('revelacao', 'Todo conhecimento religioso é construído pela cultura em que a pessoa nasce.', 'revelacao:sem_conhecimento_sagrado:.3 revelacao:razao_filosofia:.2', 'revelacao:revelacao_escrita_profetica:.2 revelacao:iluminacao_mestre:.2'),
]));

// ============ RITUAIS, ORAÇÃO E MEDITAÇÃO (28) ============
P.push(...blk('Oração e meditação', [
  L('pratica', 'Quando você ora ou medita (ou imagina fazê-lo), o que costuma buscar?', [
    ['Falar com Deus e ouvir uma resposta.', 'natureza_divina:pessoal_transcendente:.3 praticas:meditacao_contemplacao:.2'],
    ['Acalmar a mente e observar o que surge.', 'praticas:meditacao_contemplacao:.6'],
    ['Pedir ajuda, proteção ou cura.', 'praticas:ritual_ofertas:.3 natureza_divina:pessoal_imanente:.2'],
    ['Agradecer e louvar, junto com outras pessoas.', 'praticas:liturgia_comunitaria:.4'],
    ['Entrar em transe ou em comunicação com espíritos.', 'praticas:xamanismo_possessao:.6'],
    ['Não pratico nem busco isso.', 'praticas:minima:.6'],
  ]),
  A('pratica', 'A oração deve ser espontânea, com palavras próprias.', 'praticas:meditacao_contemplacao:.2 organizacao:individual_autonoma:.2', 'praticas:liturgia_comunitaria:.3', { traco: 'tradicionalismo', inv: true }),
  A('pratica', 'Repetir mantras, nomes divinos ou fórmulas sagradas muda o estado da mente.', 'praticas:meditacao_contemplacao:.4 praticas:ritual_ofertas:.2', 'praticas:minima:.2'),
  A('pratica', 'Cantos e hinos são mais importantes do que sermões ou explicações.', 'praticas:liturgia_comunitaria:.3 praticas:ritual_ofertas:.2', ''),
  A('pratica', 'A meditação sentada, em silêncio, é uma prática suficiente por si só.', 'praticas:meditacao_contemplacao:.6', 'praticas:liturgia_comunitaria:.2 praticas:ritual_ofertas:.2'),
  A('pratica', 'Contemplar uma imagem ou uma paisagem por muito tempo é uma forma de oração.', 'praticas:meditacao_contemplacao:.4 teismo:panteismo:.1', ''),
  A('pratica', 'A oração em grupo tem mais força do que a oração individual.', 'praticas:liturgia_comunitaria:.5', 'praticas:meditacao_contemplacao:.2'),
  A('pratica', 'Práticas de respiração, posturas corporais e movimentos fazem parte da vida espiritual.', 'praticas:meditacao_contemplacao:.4 praticas:observancia_etica:.1', ''),
]));
P.push(...blk('Rito, símbolo e espaço sagrado', [
  L('pratica', 'Que tipo de espaço sagrado lhe diz mais?', [
    ['Um templo, igreja ou mesquita com liturgia estabelecida.', 'praticas:liturgia_comunitaria:.5'],
    ['Um altar doméstico com imagens, flores e oferendas.', 'praticas:ritual_ofertas:.5'],
    ['Um local natural: uma montanha, um bosque ou um rio.', 'teismo:animismo:.3 teismo:panteismo:.2 praticas:ritual_ofertas:.2'],
    ['Um mosteiro ou um retiro de silêncio.', 'praticas:meditacao_contemplacao:.4 sociedade:retiro_renuncia:.3'],
    ['Qualquer lugar pode ser sagrado: o sagrado está na atitude.', 'praticas:observancia_etica:.3 praticas:minima:.1'],
    ['Não tenho espaço sagrado.', 'praticas:minima:.5'],
  ]),
  A('pratica', 'O calendário sagrado (festas, jejuns, estações) organiza o sentido do tempo.', 'praticas:liturgia_comunitaria:.3 praticas:ritual_ofertas:.3 salvacao:ordem_ritual:.2', 'praticas:minima:.2'),
  A('pratica', 'Gestos rituais (reverências, prostrações, sinais) fazem parte da oração.', 'praticas:liturgia_comunitaria:.3 praticas:ritual_ofertas:.3', 'praticas:meditacao_contemplacao:.1'),
  A('pratica', 'O fogo, a água, o incenso e a luz têm poder simbólico real nos ritos.', 'praticas:ritual_ofertas:.5', ''),
  A('pratica', 'Sacrifícios de animais ou colheitas, em contexto ritual, são uma forma legítima de relação com o sagrado.', 'praticas:ritual_ofertas:.5 salvacao:ordem_ritual:.2', 'etica:compaixao_nao_dano:.3'),
  A('pratica', 'A beleza (arte sacra, música, arquitetura) é um caminho para o divino.', 'praticas:liturgia_comunitaria:.3 praticas:ritual_ofertas:.2', ''),
  A('pratica', 'Participar do rito com atenção interior importa mais do que a sua forma exata.', 'praticas:meditacao_contemplacao:.4', 'praticas:liturgia_comunitaria:.2 praticas:ritual_ofertas:.2'),
  A('pratica', 'A repetição de ritos tradicionais cria um laço entre as gerações.', 'praticas:liturgia_comunitaria:.3 sociedade:identidade_comunitaria:.3', '', { traco: 'tradicionalismo' }),
]));
P.push(...blk('Transe, cura e magia', [
  A('pratica', 'Há pessoas que, em ritos, recebem no corpo o espírito de uma divindade ou de um ancestral.', 'praticas:xamanismo_possessao:.7', '', { traco: 'misticismo' }),
  A('pratica', 'Plantas, tambores e danças podem abrir portas para outros planos de consciência.', 'praticas:xamanismo_possessao:.5', 'ciencia:dialogo_empirico:.1', { traco: 'misticismo' }),
  A('pratica', 'A adivinhação (oráculos, cartas, búzios, astrologia) pode revelar aspectos da vida.', 'praticas:xamanismo_possessao:.2 praticas:ritual_ofertas:.2 teismo:animismo:.2', 'ciencia:dialogo_empirico:.1'),
  A('pratica', 'A magia ritual pode influenciar a realidade quando praticada do modo correto.', 'praticas:xamanismo_possessao:.3 praticas:ritual_ofertas:.3', 'ciencia:dialogo_empirico:.1', { traco: 'misticismo' }),
  A('pratica', 'Há pessoas capazes de curar por imposição das mãos, bênçãos ou energia.', 'praticas:xamanismo_possessao:.3 praticas:ritual_ofertas:.2', 'ciencia:dialogo_empirico:.1', { traco: 'milagres' }),
  A('pratica', 'Os espíritos podem ser invocados ou apaziguados com ritos adequados.', 'teismo:animismo:.3 praticas:xamanismo_possessao:.3 praticas:ritual_ofertas:.2', 'ciencia:dialogo_empirico:.1 teismo:nao_teismo:.1'),
]));
P.push(...blk('Disciplina e vida cotidiana', [
  A('pratica', 'Uma rotina diária de práticas espirituais dá estrutura à vida.', 'praticas:liturgia_comunitaria:.2 praticas:meditacao_contemplacao:.2', 'praticas:minima:.4'),
  A('pratica', 'Fazer votos (de silêncio, castidade, pobreza ou jejum) fortalece o caminho espiritual.', 'sociedade:retiro_renuncia:.4', '', { traco: 'ascetismo' }),
  A('pratica', 'Cuidar bem do lar, do trabalho e da família é, em si, uma prática religiosa.', 'praticas:observancia_etica:.4 sociedade:integrada_ordem_social:.2', ''),
  A('pratica', 'Cada refeição pode ser um ato religioso (bênçãos, gratidão, restrições).', 'praticas:ritual_ofertas:.3 praticas:observancia_etica:.3', 'praticas:minima:.2'),
  A('pratica', 'Estudar, discutir e ensinar a tradição é uma prática espiritual.', 'praticas:liturgia_comunitaria:.2 autoridade:escritura_tradicao:.2', ''),
  A('pratica', 'O trabalho manual, a arte ou o esporte podem ser caminhos de meditação em ação.', 'praticas:meditacao_contemplacao:.3 praticas:observancia_etica:.3', ''),
]));

// ============ MORAL E ÉTICA (28) ============
P.push(...blk('Dilemas', [
  L('etica', 'Uma pessoa próxima cometeu um erro grave. O que lhe parece mais importante?', [
    ['Que cumpra a pena ou a penitência prescrita.', 'etica:mandamento_divino:.4'],
    ['Que repare o dano e restaure a relação.', 'etica:reciprocidade_comunitaria:.5'],
    ['Que compreenda as causas e se transforme.', 'etica:compaixao_nao_dano:.3 etica:razao_humanista:.3'],
    ['Que as consequências naturais se cumpram.', 'etica:ordem_cosmica:.5'],
    ['Que a comunidade decida em conselho.', 'etica:reciprocidade_comunitaria:.3 autoridade:tradicao_oral_anciaos:.3'],
    ['Perdoar sem exigir nada em troca.', 'etica:compaixao_nao_dano:.5'],
  ]),
  L('etica', 'Se uma lei do Estado contraria um mandamento da sua consciência religiosa, o que você faz?', [
    ['Sigo o mandamento religioso.', 'etica:mandamento_divino:.5'],
    ['Sigo a lei, pois a ordem social vale mais.', 'sociedade:integrada_ordem_social:.4 etica:reciprocidade_comunitaria:.2'],
    ['Ponderei qual caminho causa menos dano.', 'etica:compaixao_nao_dano:.3 etica:razao_humanista:.3'],
    ['Procuro mudar a lei por meios pacíficos.', 'sociedade:transformacao_social:.5'],
    ['Decido segundo a minha própria razão.', 'etica:razao_humanista:.5'],
    ['Nunca vivi essa situação.', ''],
  ]),
  A('etica', 'É aceitável mentir para evitar um dano grave a alguém.', 'etica:razao_humanista:.4 etica:compaixao_nao_dano:.2', 'etica:mandamento_divino:.3 etica:ordem_cosmica:.2'),
  A('etica', 'A guerra pode ser justa em certas circunstâncias.', 'etica:reciprocidade_comunitaria:.2 etica:razao_humanista:.2 sociedade:integrada_ordem_social:.1', 'etica:compaixao_nao_dano:.5'),
  A('etica', 'A pena de morte pode ser moralmente aceitável.', 'etica:reciprocidade_comunitaria:.2 etica:mandamento_divino:.1', 'etica:compaixao_nao_dano:.4'),
  A('etica', 'Os animais podem ser usados para alimentação e trabalho, desde que bem tratados.', 'etica:razao_humanista:.2 etica:reciprocidade_comunitaria:.2', 'etica:compaixao_nao_dano:.5'),
  A('etica', 'Tenho obrigações morais para com pessoas que nunca conhecerei.', 'etica:compaixao_nao_dano:.3 etica:razao_humanista:.3', 'etica:reciprocidade_comunitaria:.3'),
  A('etica', 'Uma sociedade justa é aquela em que todos obedecem às mesmas leis divinas.', 'etica:mandamento_divino:.4 sociedade:integrada_ordem_social:.3', 'etica:razao_humanista:.3 sociedade:escolha_privada:.2'),
]));
P.push(...blk('Virtudes e vícios', [
  L('etica', 'Qual virtude você considera a mais central?', [
    ['Humildade e obediência.', 'etica:mandamento_divino:.4 natureza_humana:decaida:.2'],
    ['Compaixão.', 'etica:compaixao_nao_dano:.6'],
    ['Equilíbrio e moderação.', 'etica:ordem_cosmica:.4 salvacao:harmonia_equilibrio:.3'],
    ['Lealdade à família e à comunidade.', 'etica:reciprocidade_comunitaria:.6'],
    ['Justiça e razão.', 'etica:razao_humanista:.5'],
    ['Sabedoria e autoconhecimento.', 'etica:ordem_cosmica:.2 salvacao:conhecimento_pratica:.3'],
  ]),
  A('etica', 'A humildade diante do divino é a base de toda virtude.', 'etica:mandamento_divino:.3 natureza_humana:decaida:.2 natureza_divina:pessoal_transcendente:.2', 'etica:razao_humanista:.2'),
  A('etica', 'Servir sem apego aos frutos da ação é o mais elevado.', 'etica:ordem_cosmica:.3 salvacao:conhecimento_pratica:.2', ''),
  A('etica', 'A ambição e o desejo de reconhecimento são obstáculos a uma vida virtuosa.', 'sociedade:retiro_renuncia:.2 etica:compaixao_nao_dano:.1', '', { traco: 'ascetismo' }),
  A('etica', 'A coragem de defender o que é justo vale mais do que a pureza pessoal.', 'sociedade:transformacao_social:.4 etica:razao_humanista:.2', 'praticas:observancia_etica:.2 sociedade:retiro_renuncia:.2'),
  A('etica', 'A honra da família e da comunidade deve ser defendida.', 'etica:reciprocidade_comunitaria:.4 sociedade:identidade_comunitaria:.3', 'etica:razao_humanista:.2'),
]));
P.push(...blk('Vida pessoal e família', [
  A('etica', 'O casamento e a família têm um fundamento sagrado.', 'etica:mandamento_divino:.3 sociedade:integrada_ordem_social:.2 sociedade:identidade_comunitaria:.2', 'sociedade:escolha_privada:.3 etica:razao_humanista:.2'),
  A('etica', 'Cada pessoa deve decidir livremente sobre a própria vida afetiva e familiar, sem interferência religiosa.', 'sociedade:escolha_privada:.4 etica:razao_humanista:.3', 'etica:mandamento_divino:.3'),
  A('etica', 'Os mais velhos merecem obediência e cuidado especiais.', 'etica:reciprocidade_comunitaria:.4 autoridade:tradicao_oral_anciaos:.2', 'etica:razao_humanista:.1'),
  A('etica', 'A castidade ou o celibato pode ser um caminho espiritual elevado.', 'sociedade:retiro_renuncia:.4', 'natureza_humana:parte_da_natureza:.2', { traco: 'ascetismo' }),
  A('etica', 'O corpo é um dom a ser cuidado e respeitado, e não negado.', 'natureza_humana:parte_da_natureza:.3 etica:compaixao_nao_dano:.1', '', { traco: 'ascetismo', inv: true }),
  A('etica', 'Educar os filhos na religião da família é um dever.', 'sociedade:identidade_comunitaria:.4 sociedade:integrada_ordem_social:.2', 'sociedade:escolha_privada:.4'),
  A('etica', 'A vida humana tem um valor sagrado que limita o que se pode decidir sobre ela.', 'etica:mandamento_divino:.4 etica:compaixao_nao_dano:.2', 'etica:razao_humanista:.3'),
]));
P.push(...blk('Justiça e sociedade', [
  A('etica', 'A pobreza e a desigualdade são problemas que a religião tem a obrigação de enfrentar.', 'sociedade:transformacao_social:.5', 'sociedade:escolha_privada:.1'),
  A('etica', 'Quem tem mais deve repartir com quem tem menos por dever religioso, e não apenas por escolha.', 'etica:reciprocidade_comunitaria:.3 etica:mandamento_divino:.3', 'etica:razao_humanista:.2'),
  A('etica', 'A hospitalidade com estrangeiros e necessitados é um dever sagrado.', 'etica:reciprocidade_comunitaria:.3 etica:compaixao_nao_dano:.3', ''),
  A('etica', 'A violência nunca é justificável, nem mesmo em legítima defesa.', 'etica:compaixao_nao_dano:.6', 'etica:razao_humanista:.2 etica:reciprocidade_comunitaria:.2'),
  A('etica', 'A liberdade de consciência e de culto vale mais do que a unidade religiosa de uma sociedade.', 'sociedade:escolha_privada:.4 pluralismo:pluralismo:.2', 'sociedade:integrada_ordem_social:.4'),
  A('etica', 'Os recursos da natureza são um bem comum, que devemos preservar para as futuras gerações.', 'natureza_humana:parte_da_natureza:.3 etica:ordem_cosmica:.2 etica:compaixao_nao_dano:.2', ''),
  A('etica', 'A blasfêmia ou o ultraje ao que é sagrado deve ser punido.', 'etica:mandamento_divino:.4 sociedade:integrada_ordem_social:.2', 'sociedade:escolha_privada:.3 etica:razao_humanista:.2'),
]));

// ============ CIÊNCIA E RELIGIÃO (14) ============
P.push(...blk('Ciência, método e mistério', [
  L('ciencia', 'Quando a ciência e a minha tradição parecem discordar, tendo a...', [
    ['Aceitar a ciência e reinterpretar a tradição.', 'ciencia:dialogo_empirico:.1'],
    ['Buscar a harmonia entre as duas.', 'ciencia:complementares:.6'],
    ['Manter a tradição e duvidar da ciência.', 'ciencia:tensao_literalista:.6'],
    ['Tratá-las como campos separados.', 'ciencia:dominios_separados:.6'],
    ['Aceitar a ciência e dispensar a tradição.', 'ciencia:dialogo_empirico:.1'],
    ['Não vivo esse conflito.', ''],
  ]),
  A('ciencia', 'A religião pode errar sobre fatos do mundo natural sem errar sobre o sentido da vida.', 'ciencia:dominios_separados:.4 ciencia:dialogo_empirico:.2', 'ciencia:tensao_literalista:.4'),
  A('ciencia', 'Há dimensões da realidade (consciência, sentido, valor) que a ciência nunca capturará por completo.', 'ciencia:complementares:.3 ciencia:dominios_separados:.2', 'ciencia:dialogo_empirico:.3'),
  A('ciencia', 'A idade e o tamanho do universo, segundo a ciência, não ameaçam a minha fé ou espiritualidade.', 'ciencia:dialogo_empirico:.2 ciencia:complementares:.3 ciencia:dominios_separados:.1', 'ciencia:tensao_literalista:.3'),
  A('ciencia', 'A consciência é um produto do cérebro e nada mais.', 'alma:mortal:.5 ciencia:dialogo_empirico:.1', 'alma:alma_unica_eterna:.2 alma:alma_preexistente:.2 alma:alma_multipla:.1'),
  A('ciencia', 'Estudos mostram que meditação, oração e rituais fazem bem à saúde, e isso é relevante para a religião.', 'ciencia:complementares:.3 ciencia:dialogo_empirico:.2', ''),
  A('ciencia', 'Milagres, se existem, são exceções às leis da natureza.', 'ciencia:tensao_literalista:.2', 'ciencia:dialogo_empirico:.2', { traco: 'milagres' }),
  A('ciencia', 'Quando uma prática religiosa causa dano comprovado (como recusar um tratamento médico), ela deve ser revista.', 'ciencia:dialogo_empirico:.3 etica:razao_humanista:.2', 'ciencia:tensao_literalista:.3'),
  A('ciencia', 'A fé deve estar aberta a mudar diante de novas evidências.', 'ciencia:dialogo_empirico:.4', 'ciencia:tensao_literalista:.3'),
  A('ciencia', 'Mesmo com todas as influências (genes, criação, cultura), posso escolher agir de outro modo.', '', '', { traco: 'livre_arbitrio' }),
  A('ciencia', 'A inteligência artificial pode um dia ter consciência ou algo parecido com uma alma.', 'alma:mortal:.2 ciencia:dialogo_empirico:.2', 'alma:alma_unica_eterna:.2 alma:alma_preexistente:.1'),
  A('ciencia', 'Existe um plano maior no qual cada vida tem um papel.', 'origem:criacao_do_nada:.1 origem:emanacao:.1', '', { traco: 'destino' }),
  A('ciencia', 'As descobertas da física e da cosmologia nos aproximam de uma visão espiritual do universo.', 'ciencia:complementares:.4 origem:emanacao:.1', 'ciencia:dominios_separados:.3'),
  A('ciencia', 'O ceticismo é uma virtude: nenhuma afirmação religiosa deve ser aceita sem boas razões.', 'ciencia:dialogo_empirico:.3 revelacao:razao_filosofia:.2', 'ciencia:tensao_literalista:.2 revelacao:revelacao_escrita_profetica:.2'),
]));

// ============ VERDADE EM OUTRAS RELIGIÕES (19) ============
P.push(...blk('Verdade e diversidade', [
  L('pluralismo', 'Como você explica o fato de existirem tantas religiões?', [
    ['Há uma só verdade; as demais são desvios ou erros.', 'pluralismo:exclusivismo:.6'],
    ['Todas captam aspectos de uma realidade maior.', 'pluralismo:pluralismo:.6'],
    ['Cada cultura expressa o sagrado na sua própria linguagem.', 'pluralismo:pluralismo:.3 pluralismo:sem_pretensao_universal:.4'],
    ['Uma é mais completa, e as outras contêm luz parcial.', 'pluralismo:inclusivismo:.6'],
    ['Cada povo recebeu uma revelação própria.', 'pluralismo:sem_pretensao_universal:.6'],
    ['São criações humanas: nenhuma é verdadeira em sentido especial.', '', { na: 'pluralismo' }],
  ]),
  A('pluralismo', 'Escolher uma religião é como escolher uma língua: posso falar de muitos modos sobre as mesmas coisas.', 'pluralismo:pluralismo:.5', 'pluralismo:exclusivismo:.3'),
  A('pluralismo', 'Existem verdades religiosas universais, válidas para todos os povos.', 'pluralismo:exclusivismo:.2 pluralismo:inclusivismo:.2 pluralismo:pluralismo:.2', 'pluralismo:sem_pretensao_universal:.4'),
  A('pluralismo', 'Alguém que nunca ouviu falar da minha religião ainda pode alcançar a meta espiritual.', 'pluralismo:inclusivismo:.3 pluralismo:pluralismo:.4', 'pluralismo:exclusivismo:.5'),
  A('pluralismo', 'Uma religião nova não pode ser verdadeira se contradiz as mais antigas.', 'pluralismo:exclusivismo:.3', 'pluralismo:pluralismo:.2', { traco: 'tradicionalismo' }),
  A('pluralismo', 'As religiões são sistemas de metáforas sobre a mesma realidade última.', 'pluralismo:pluralismo:.5', 'pluralismo:exclusivismo:.2'),
  A('pluralismo', 'Algumas religiões têm ensinamentos mais profundos que outras.', 'pluralismo:inclusivismo:.4 pluralismo:exclusivismo:.2', 'pluralismo:pluralismo:.3'),
  A('pluralismo', 'Julgar religiões como verdadeiras ou falsas é um erro de categoria.', 'pluralismo:pluralismo:.2 pluralismo:sem_pretensao_universal:.3', 'pluralismo:exclusivismo:.3'),
]));
P.push(...blk('Diálogo e conversão', [
  A('pluralismo', 'Alguém pode mudar de religião ao longo da vida sem trair seus valores.', 'pluralismo:pluralismo:.4', 'pluralismo:exclusivismo:.2 pluralismo:sem_pretensao_universal:.2'),
  A('pluralismo', 'Casamentos entre pessoas de religiões diferentes enriquecem as famílias.', 'pluralismo:pluralismo:.4 pluralismo:inclusivismo:.1', 'pluralismo:exclusivismo:.3 sociedade:identidade_comunitaria:.2'),
  A('pluralismo', 'É importante divulgar a minha fé a quem queira ouvir.', 'pluralismo:exclusivismo:.2 pluralismo:inclusivismo:.2', 'pluralismo:sem_pretensao_universal:.2', { traco: 'proselitismo' }),
  A('pluralismo', 'As crianças devem conhecer várias religiões antes de escolher a sua.', 'pluralismo:pluralismo:.4 sociedade:escolha_privada:.3', 'sociedade:identidade_comunitaria:.3'),
  A('pluralismo', 'A abertura ao diálogo religioso nunca deve comprometer o núcleo da minha fé.', 'pluralismo:inclusivismo:.3 pluralismo:exclusivismo:.2', 'pluralismo:pluralismo:.3'),
  A('pluralismo', 'Orações em comum entre religiões diferentes são bem-vindas.', 'pluralismo:pluralismo:.5', 'pluralismo:exclusivismo:.3'),
]));
P.push(...blk('Religiões antigas e modernas', [
  A('pluralismo', 'As religiões ancestrais dos povos originários guardam uma sabedoria tão válida quanto a das grandes religiões mundiais.', 'pluralismo:pluralismo:.4 pluralismo:sem_pretensao_universal:.3 revelacao:tradicao_ancestral:.1', 'pluralismo:exclusivismo:.3'),
  A('pluralismo', 'Novos movimentos espirituais (nova era, esoterismo, neopaganismo) respondem a necessidades reais das pessoas.', 'pluralismo:pluralismo:.3 autoridade:sem_autoridade_fixa:.2', 'pluralismo:exclusivismo:.2', { traco: 'tradicionalismo', inv: true }),
  A('pluralismo', 'Misturar crenças (sincretismo) empobrece as tradições.', 'pluralismo:exclusivismo:.3 pluralismo:sem_pretensao_universal:.2', 'pluralismo:pluralismo:.4', { traco: 'tradicionalismo' }),
  A('pluralismo', 'Os grandes fundadores religiosos (profetas, sábios, mestres) de tradições diferentes ensinaram, no essencial, valores semelhantes.', 'pluralismo:pluralismo:.5', 'pluralismo:exclusivismo:.2'),
  A('pluralismo', 'Religiões que desapareceram, como as da Antiguidade, também foram caminhos legítimos para o sagrado.', 'pluralismo:pluralismo:.4 pluralismo:sem_pretensao_universal:.2', 'pluralismo:exclusivismo:.3'),
]));

// ============ COMUNIDADE E INSTITUIÇÕES (26) ============
P.push(...blk('Instituições e autoridade', [
  L('comunidade', 'Qual destes modelos de organização religiosa lhe parece mais saudável?', [
    ['Uma igreja com clero, doutrina e hierarquia claras.', 'organizacao:hierarquia_institucional:.7'],
    ['Congregações locais autônomas.', 'organizacao:comunidade_local:.6'],
    ['Uma linhagem de mestres e discípulos.', 'organizacao:linhagem_mestre:.7'],
    ['Uma comunidade guiada pelos anciãos do povo.', 'organizacao:comunidade_local:.4 autoridade:tradicao_oral_anciaos:.3 sociedade:identidade_comunitaria:.2'],
    ['Nenhuma: prefiro a espiritualidade individual.', 'organizacao:individual_autonoma:.7'],
    ['Redes informais de amigos e grupos de estudo.', 'organizacao:comunidade_local:.3 organizacao:individual_autonoma:.3'],
  ]),
  A('comunidade', 'Líderes religiosos devem prestar contas à comunidade.', 'organizacao:comunidade_local:.4', 'organizacao:hierarquia_institucional:.3'),
  A('comunidade', 'Uma instituição religiosa precisa de um líder supremo para manter a unidade.', 'organizacao:hierarquia_institucional:.5', 'organizacao:comunidade_local:.2 organizacao:individual_autonoma:.2'),
  A('comunidade', 'A autoridade espiritual vem do exemplo de vida, e não do cargo.', 'organizacao:linhagem_mestre:.3 organizacao:individual_autonoma:.2', 'organizacao:hierarquia_institucional:.3'),
  A('comunidade', 'A tradição se mantém fiel por meio de uma sucessão ininterrupta de líderes ou mestres.', 'organizacao:hierarquia_institucional:.3 organizacao:linhagem_mestre:.3', 'organizacao:individual_autonoma:.2', { traco: 'tradicionalismo' }),
  A('comunidade', 'Os leigos devem ter voz ativa nas decisões da comunidade religiosa.', 'organizacao:comunidade_local:.4', 'organizacao:hierarquia_institucional:.3'),
  A('comunidade', 'Dependo de uma comunidade para manter a minha prática espiritual.', 'organizacao:comunidade_local:.4 organizacao:hierarquia_institucional:.1', 'organizacao:individual_autonoma:.4'),
  A('comunidade', 'Uma instituição religiosa deve ter escolas, hospitais e obras sociais para cumprir a sua missão.', 'organizacao:hierarquia_institucional:.3 sociedade:transformacao_social:.2', ''),
  A('comunidade', 'O melhor mestre é aquele que não prende discípulos e orienta cada um a seguir o próprio caminho.', 'organizacao:individual_autonoma:.4', 'organizacao:linhagem_mestre:.3'),
]));
P.push(...blk('Comunidade e pertencimento', [
  L('comunidade', 'Quando você pensa em “minha comunidade espiritual”, o que lhe vem à mente?', [
    ['Minha família e meu povo, com costumes herdados.', 'sociedade:identidade_comunitaria:.6'],
    ['Uma congregação que se reúne regularmente.', 'organizacao:comunidade_local:.6 praticas:liturgia_comunitaria:.1'],
    ['Meus professores e colegas de caminho.', 'organizacao:linhagem_mestre:.5'],
    ['Uma instituição mundial da qual faço parte.', 'organizacao:hierarquia_institucional:.6'],
    ['Quase ninguém: meu caminho é solitário.', 'organizacao:individual_autonoma:.6'],
    ['Todos os seres vivos.', 'natureza_humana:parte_da_natureza:.3 etica:compaixao_nao_dano:.3'],
  ]),
  A('comunidade', 'Participar das festas religiosas da comunidade é um dever, mesmo para quem tem dúvidas.', 'sociedade:identidade_comunitaria:.4 praticas:liturgia_comunitaria:.2', 'sociedade:escolha_privada:.3'),
  A('comunidade', 'A língua, a comida e os costumes do meu povo fazem parte da minha religião.', 'sociedade:identidade_comunitaria:.5', 'sociedade:escolha_privada:.2'),
  A('comunidade', 'É possível manter a fé e a identidade religiosa mesmo longe da comunidade de origem.', 'sociedade:escolha_privada:.3 organizacao:individual_autonoma:.2', 'sociedade:identidade_comunitaria:.3'),
  A('comunidade', 'Entrar numa comunidade religiosa exige um período de preparo e de iniciação.', 'organizacao:hierarquia_institucional:.2 organizacao:linhagem_mestre:.2 sociedade:identidade_comunitaria:.2', 'organizacao:individual_autonoma:.2'),
  A('comunidade', 'Convivo melhor com pessoas que partilham da minha fé.', 'sociedade:identidade_comunitaria:.3 pluralismo:exclusivismo:.1', 'pluralismo:pluralismo:.2'),
  A('comunidade', 'As tradições religiosas pertencem aos seus povos e não devem ser adotadas por outros sem permissão e respeito.', 'pluralismo:sem_pretensao_universal:.3 sociedade:identidade_comunitaria:.3', 'pluralismo:pluralismo:.3 organizacao:individual_autonoma:.1'),
  A('comunidade', 'Uma comunidade espiritual deve cuidar dos seus membros mais frágeis (doentes, idosos, pobres).', 'organizacao:comunidade_local:.3 sociedade:transformacao_social:.2 praticas:observancia_etica:.2', ''),
  A('comunidade', 'Pertenço, ou poderia pertencer, a mais de uma comunidade espiritual ao mesmo tempo.', 'pluralismo:pluralismo:.3 organizacao:individual_autonoma:.2', 'pluralismo:exclusivismo:.2 organizacao:hierarquia_institucional:.1'),
]));
P.push(...blk('Religião, Estado e vida pública', [
  L('comunidade', 'Qual relação entre religião e Estado lhe parece mais adequada?', [
    ['O Estado deve seguir os princípios da religião majoritária.', 'sociedade:integrada_ordem_social:.6'],
    ['O Estado é neutro, mas protege a liberdade de culto.', 'sociedade:escolha_privada:.5 pluralismo:pluralismo:.1'],
    ['A religião deve ser motor de reformas e de justiça social.', 'sociedade:transformacao_social:.6'],
    ['A religião deve ficar na esfera privada e familiar.', 'sociedade:escolha_privada:.6'],
    ['Costumes do povo e leis devem se misturar.', 'sociedade:identidade_comunitaria:.4 sociedade:integrada_ordem_social:.3'],
    ['As comunidades religiosas devem se afastar da política e do mundo.', 'sociedade:retiro_renuncia:.5'],
  ]),
  A('comunidade', 'Líderes religiosos devem ter influência política.', 'sociedade:integrada_ordem_social:.4 sociedade:transformacao_social:.2', 'sociedade:escolha_privada:.3'),
  A('comunidade', 'O ensino religioso deve fazer parte da escola pública.', 'sociedade:integrada_ordem_social:.3 sociedade:identidade_comunitaria:.2', 'sociedade:escolha_privada:.3'),
  A('comunidade', 'Símbolos religiosos podem ser exibidos em espaços públicos.', 'sociedade:identidade_comunitaria:.3 sociedade:integrada_ordem_social:.2', 'sociedade:escolha_privada:.3'),
  A('comunidade', 'As comunidades religiosas devem se organizar para defender os direitos de grupos vulneráveis.', 'sociedade:transformacao_social:.5', ''),
  A('comunidade', 'Uma vida simples, afastada do consumo e da política, é um testemunho espiritual.', 'sociedade:retiro_renuncia:.5', 'sociedade:transformacao_social:.3', { traco: 'ascetismo' }),
  A('comunidade', 'Festas e feriados religiosos devem ser dias de descanso para todos.', 'sociedade:integrada_ordem_social:.3 sociedade:identidade_comunitaria:.2', 'sociedade:escolha_privada:.2'),
  A('comunidade', 'Questões como mudanças climáticas e desigualdade devem entrar nos sermões e ensinamentos.', 'sociedade:transformacao_social:.5', 'sociedade:retiro_renuncia:.1'),
]));

P.push(...blk('Complementos da versão acadêmica', [
  L('pluralismo', 'Um(a) amigo(a) querido(a), de outra religião, vive com retidão e serenidade. O que você pensa sobre o destino espiritual dele(a)?', [
    ['Só a minha tradição oferece o caminho pleno; ele(a) precisa conhecê-lo.', 'pluralismo:exclusivismo:.9'],
    ['Pode ser alcançado(a) por meio de sua própria fé, mas a minha tem a plenitude.', 'pluralismo:inclusivismo:.9'],
    ['Os diferentes caminhos levam, em essência, ao mesmo lugar.', 'pluralismo:pluralismo:.9'],
    ['Minha tradição não se pronuncia sobre isso, e não preciso opinar.', 'pluralismo:sem_pretensao_universal:.9'],
  ]),
  A('alma_morte', 'A lembrança que os vivos guardam dos mortos é a forma mais real de continuidade que existe.', 'pos_morte:nada_ou_incerto:.3 alma:mortal:.3', 'alma:alma_unica_eterna:.2 pos_morte:mundo_ancestral:.2'),
  A('revelacao', 'Uma escritura pode conter mito e símbolo e ainda assim ser sagrada.', 'ciencia:complementares:.2 autoridade:escritura_tradicao:.2', 'autoridade:escritura_unica:.3 ciencia:tensao_literalista:.2'),
  L('pratica', 'Num momento de grande aflição, o que você tende a fazer primeiro?', [
    ['Rezar ou falar com o divino.', 'praticas:liturgia_comunitaria:.4 natureza_divina:pessoal_transcendente:.2'],
    ['Procurar minha comunidade ou meus familiares.', 'praticas:liturgia_comunitaria:.3 sociedade:identidade_comunitaria:.4'],
    ['Ficar em silêncio, meditar ou respirar.', 'praticas:meditacao_contemplacao:.8'],
    ['Fazer um ritual, uma oferenda ou consultar um guia espiritual.', 'praticas:ritual_ofertas:.6 praticas:xamanismo_possessao:.2'],
    ['Ajudar alguém: agir resolve melhor do que rezar.', 'praticas:observancia_etica:.6 etica:razao_humanista:.2'],
    ['Nada de religioso: recorro a amigos, terapia ou à razão.', 'praticas:minima:.7'],
  ]),
]));

module.exports = P;
