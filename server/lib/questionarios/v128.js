'use strict';
/**
 * QUESTIONÁRIO COMPLETO — 128 perguntas próprias (nenhuma repete a versão de 44 nem a de 244).
 * Distribuição: Deus 14 · Origem 8 · Alma e morte 16 · Salvação 12 · Revelação e textos 14 · Prática 14 · Ética 14 · Ciência 8 · Pluralismo 10 · Comunidade 14.
 * Convenções: ver ../questionario.js. Escalas: concordar reforça A, discordar reforça B (metade da massa nos graus "concordo/discordo").
 * ATENÇÃO: a ordem deste array faz parte do código de compartilhamento (v128). Só acrescente no FIM.
 */
const { esl, ES, blk } = require('./dsl');
let n = 0; const id = () => 'm' + (++n);
const L = (tema, texto, ops, x) => esl(id(), tema, texto, ops, x);
const A = (tema, texto, a, b, x) => ES(id(), tema, texto, a, b, x);
const P = [];

// ---------- Deus, deuses e o divino (14) ----------
P.push(...blk('Imagens do sagrado', [
  L('deus', 'Quando você pensa em “o sagrado”, o que lhe vem primeiro à mente?', [
    ['Uma presença pessoal a quem posso me dirigir.', 'natureza_divina:pessoal_transcendente:.5 natureza_divina:pessoal_imanente:.5'],
    ['Uma ordem ou lei profunda que sustenta tudo.', 'natureza_divina:impessoal'],
    ['Seres e forças específicos: deuses, espíritos, ancestrais.', 'teismo:politeismo:.5 teismo:animismo:.5'],
    ['A própria natureza e o universo.', 'teismo:panteismo'],
    ['Experiências de assombro e mistério, sem um “alguém” por trás.', 'natureza_divina:impessoal:.4 natureza_divina:sem_realidade_suprema:.4'],
    ['Uma luta entre forças opostas: luz e trevas, ordem e caos.', 'teismo:dualismo:.6'],
    ['Pouca coisa: a palavra não me diz muito.', 'natureza_divina:sem_realidade_suprema:.5 teismo:nao_teismo:.5'],
  ]),
  L('deus', 'Qual atributo você mais associa ao divino, caso ele exista?', [
    ['Amor e misericórdia.', 'natureza_divina:pessoal_imanente:.4 natureza_divina:pessoal_transcendente:.2'],
    ['Justiça e lei.', 'natureza_divina:pessoal_transcendente:.4 etica:mandamento_divino:.3'],
    ['Sabedoria e ordem do cosmos.', 'natureza_divina:impessoal:.4 etica:ordem_cosmica:.3'],
    ['Poder sobre a vida, a natureza e os destinos.', 'teismo:politeismo:.3 teismo:animismo:.3'],
    ['Silêncio, vazio ou plenitude além de qualquer nome.', 'natureza_divina:impessoal:.5 natureza_divina:sem_realidade_suprema:.2'],
    ['Não associo atributos ao divino.', ''],
  ]),
  A('deus', 'Divindades podem ter personalidade, histórias e relações entre si, como nos mitos.', 'teismo:politeismo:.6', 'teismo:monoteismo:.3'),
  A('deus', 'O divino ultrapassa qualquer descrição humana: só se pode falar dele por símbolos e negações.', 'natureza_divina:impessoal:.4', 'natureza_divina:pessoal_transcendente:.3 natureza_divina:pessoal_imanente:.3'),
  A('deus', 'Um único princípio divino pode se manifestar sob muitas formas, como diferentes deuses ou nomes.', 'teismo:henoteismo:.5 teismo:panteismo:.2 natureza_divina:impessoal:.2', 'teismo:monoteismo:.3'),
  A('deus', 'É possível dedicar devoção especial a uma divindade sem negar que existam outras.', 'teismo:henoteismo:.8', 'teismo:monoteismo:.4'),
  A('deus', 'Deus (ou o divino) intervém nos acontecimentos da história e na vida de cada pessoa.', 'natureza_divina:pessoal_transcendente:.5 natureza_divina:pessoal_imanente:.3', 'natureza_divina:impessoal:.3 natureza_divina:sem_realidade_suprema:.3'),
  A('deus', 'O universo seria igual, mesmo que não houvesse nenhuma divindade.', 'natureza_divina:sem_realidade_suprema:.6 teismo:nao_teismo:.4', 'teismo:monoteismo:.2 natureza_divina:pessoal_transcendente:.3'),
]));
P.push(...blk('Espíritos, forças e mediações', [
  L('deus', 'Que lugar os antepassados ocupam na sua visão de mundo?', [
    ['Continuam presentes e podem proteger ou orientar os vivos.', 'teismo:animismo:.5 pos_morte:mundo_ancestral:.5'],
    ['Merecem respeito e memória, mas não interferem na vida.', 'sociedade:identidade_comunitaria:.4 etica:reciprocidade_comunitaria:.3'],
    ['Estão em outro plano, aguardando julgamento ou novo nascimento.', 'pos_morte:julgamento:.3 pos_morte:renascimento:.3'],
    ['Deixaram de existir; restam as lembranças.', 'alma:mortal:.5 pos_morte:nada_ou_incerto:.5'],
    ['Podem ser contatados por médiuns, sacerdotes ou xamãs.', 'praticas:xamanismo_possessao:.5 teismo:animismo:.3'],
  ]),
  A('deus', 'O bem e o mal são forças reais no universo, e não apenas escolhas humanas.', 'teismo:dualismo:.5', 'natureza_humana:neutra_moldada:.3 etica:razao_humanista:.2'),
  A('deus', 'Existem seres intermediários (anjos, espíritos guardiões, bodhisattvas, orixás) entre o humano e o divino.', 'teismo:politeismo:.3 teismo:animismo:.3 natureza_divina:pessoal_imanente:.2', 'teismo:nao_teismo:.2 natureza_divina:sem_realidade_suprema:.2'),
  A('deus', 'Sinto que sou parte inseparável de um todo maior.', 'teismo:panteismo:.5 natureza_humana:parte_da_natureza:.3 pos_morte:uniao_absorcao:.2', 'natureza_divina:pessoal_transcendente:.2'),
  A('deus', 'O mundo visível e o invisível se comunicam por sinais, sonhos e presságios.', 'teismo:animismo:.4 praticas:xamanismo_possessao:.3', 'natureza_divina:sem_realidade_suprema:.2 teismo:nao_teismo:.2', { traco: 'misticismo' }),
  A('deus', 'Uma divindade pode nascer entre os seres humanos (encarnar, descer à Terra).', 'natureza_divina:pessoal_imanente:.4 teismo:politeismo:.3', 'natureza_divina:pessoal_transcendente:.4'),
]));

// ---------- Origem do mundo (8) ----------
P.push(...blk('Cosmologias', [
  A('origem', 'O universo tem um propósito: não é fruto do acaso.', 'origem:criacao_do_nada:.3 origem:emanacao:.2 origem:cosmogonia_mitica:.2', 'origem:indefinida:.5 natureza_divina:sem_realidade_suprema:.3'),
  A('origem', 'O universo é eterno: sempre existiu e sempre existirá, em ciclos.', 'origem:ciclico_sem_inicio:.8', 'origem:criacao_do_nada:.3'),
  L('origem', 'Qual imagem de origem do mundo lhe parece mais significativa?', [
    ['Uma palavra ou ato criador que faz tudo existir do nada.', 'origem:criacao_do_nada'],
    ['Um oceano, um ovo ou um caos primordial de onde tudo se formou.', 'origem:cosmogonia_mitica'],
    ['Uma luz ou fonte infinita que se desdobra em todas as coisas.', 'origem:emanacao'],
    ['Uma roda sem início que gira para sempre.', 'origem:ciclico_sem_inicio'],
    ['Um processo físico, descrito pela ciência.', 'origem:indefinida:.6'],
    ['Nenhuma delas me convence.', ''],
  ]),
  A('origem', 'Os mitos de criação dos povos carregam verdades profundas, mesmo quando não são literais.', 'origem:cosmogonia_mitica:.5 ciencia:complementares:.3', 'ciencia:tensao_literalista:.2 ciencia:dialogo_empirico:.1'),
  A('origem', 'O mundo material é uma aparência passageira diante de uma realidade mais verdadeira.', 'origem:emanacao:.5 natureza_divina:impessoal:.3', 'natureza_humana:parte_da_natureza:.2 alma:mortal:.2'),
  A('origem', 'A humanidade foi criada de modo especial, distinto dos demais seres vivos.', 'origem:criacao_do_nada:.4 origem:cosmogonia_mitica:.2', 'natureza_humana:parte_da_natureza:.4'),
  A('origem', 'O mundo passa por eras sucessivas de apogeu, decadência e renovação.', 'origem:ciclico_sem_inicio:.5', 'origem:criacao_do_nada:.2'),
  A('origem', 'Nada surge do nada: matéria e espírito existiram sempre, de algum modo.', 'origem:ciclico_sem_inicio:.3 origem:emanacao:.3', 'origem:criacao_do_nada:.5'),
]));

// ---------- Alma, morte e vida futura (16) ----------
P.push(...blk('Eu e consciência', [
  L('alma_morte', 'Ao pensar na própria morte, qual atitude lhe parece mais próxima?', [
    ['Esperança de encontro com Deus ou com entes queridos.', 'pos_morte:julgamento:.4 alma:alma_unica_eterna:.4 ressurreicao:admitida:.2'],
    ['Expectativa de uma nova vida.', 'pos_morte:renascimento:.5 alma:alma_preexistente:.3 reencarnacao:central:.3'],
    ['Serenidade em voltar à natureza e ao todo.', 'pos_morte:uniao_absorcao:.4 natureza_humana:parte_da_natureza:.3'],
    ['Dever de seguir como ancestral, ao lado da família.', 'pos_morte:mundo_ancestral:.6'],
    ['Aceitação do fim da existência.', 'pos_morte:nada_ou_incerto:.5 alma:mortal:.5 ressurreicao:rejeitada:.2'],
    ['Temor ou incerteza: ainda não sei.', ''],
  ]),
  A('alma_morte', 'A consciência pode existir independentemente do cérebro.', 'alma:alma_unica_eterna:.3 alma:alma_preexistente:.3 alma:alma_multipla:.2', 'alma:mortal:.6'),
  A('alma_morte', 'Existe em mim algo que não muda ao longo da vida: uma essência permanente.', 'alma:alma_unica_eterna:.3 alma:alma_preexistente:.3', 'alma:sem_eu:.5'),
  A('alma_morte', 'O “eu” é uma construção: um conjunto de experiências em constante mudança.', 'alma:sem_eu:.7', 'alma:alma_unica_eterna:.3 alma:alma_preexistente:.3'),
  A('alma_morte', 'Cada pessoa tem várias dimensões (corpo, sombra, sopro, nome, espírito) que se separam na morte.', 'alma:alma_multipla:.8', 'alma:alma_unica_eterna:.2'),
  A('alma_morte', 'Animais e outros seres vivos têm uma consciência ou alma comparável à humana.', 'alma:alma_preexistente:.3 natureza_humana:parte_da_natureza:.4 teismo:animismo:.2 etica:compaixao_nao_dano:.2', 'alma:alma_unica_eterna:.2'),
]));
P.push(...blk('Morte e depois', [
  A('alma_morte', 'Há um julgamento após a morte em que cada pessoa presta contas.', 'pos_morte:julgamento:.8 reencarnacao:rejeitada:.2', 'pos_morte:nada_ou_incerto:.2 pos_morte:renascimento:.2'),
  A('alma_morte', 'O que faço hoje afeta o tipo de existência que terei depois da morte.', 'pos_morte:renascimento:.3 pos_morte:julgamento:.3 etica:ordem_cosmica:.2', 'pos_morte:nada_ou_incerto:.3'),
  A('alma_morte', 'Lembrar e cuidar dos mortos (com ritos, oferendas ou orações) ajuda tanto os mortos quanto os vivos.', 'pos_morte:mundo_ancestral:.6 praticas:ritual_ofertas:.3', 'pos_morte:nada_ou_incerto:.2'),
  A('alma_morte', 'Meu corpo será, de algum modo, restaurado ou reconstituído após a morte.', 'ressurreicao:central:.8', 'ressurreicao:rejeitada:.5'),
  A('alma_morte', 'Algumas pessoas parecem trazer talentos ou memórias de vidas anteriores.', 'reencarnacao:central:.6 reencarnacao:admitida:.3 alma:alma_preexistente:.3', 'reencarnacao:rejeitada:.4'),
  A('alma_morte', 'Depois da morte há um estado intermediário (purificação, travessia, descanso).', 'pos_morte:reino_sombrio:.3 pos_morte:julgamento:.2 pos_morte:renascimento:.2', 'pos_morte:nada_ou_incerto:.3'),
  L('alma_morte', 'O que dá sentido à vida diante da morte?', [
    ['Cumprir a vontade de Deus e viver para sempre com Ele.', 'pos_morte:julgamento:.5 salvacao:graca_fe:.3'],
    ['Evoluir espiritualmente ao longo de muitas vidas.', 'pos_morte:renascimento:.5 salvacao:conhecimento_pratica:.3 reencarnacao:central:.3'],
    ['Honrar a família e o povo, tornando-me ancestral.', 'pos_morte:mundo_ancestral:.5 sociedade:identidade_comunitaria:.3'],
    ['Realizar-me, amar e deixar um legado.', 'alma:mortal:.3 pos_morte:nada_ou_incerto:.3 etica:razao_humanista:.3'],
    ['Despertar para a unidade com tudo o que existe.', 'pos_morte:uniao_absorcao:.5 salvacao:conhecimento_pratica:.3'],
  ]),
  A('alma_morte', 'O ideal final é dissolver-se no Todo, sem manter identidade individual.', 'pos_morte:uniao_absorcao:.8 alma:sem_eu:.2', 'alma:alma_unica_eterna:.4 pos_morte:julgamento:.2'),
  A('alma_morte', 'Existem lugares ou estados de sofrimento depois da morte para quem agiu mal.', 'pos_morte:julgamento:.5 pos_morte:reino_sombrio:.2', 'pos_morte:nada_ou_incerto:.2 pos_morte:uniao_absorcao:.2'),
]));

// ---------- Salvação, libertação e natureza humana (12) ----------
P.push(...blk('Salvação e libertação', [
  A('salvacao', 'Nada do que eu faça me torna merecedor(a) por si só: apenas uma graça gratuita pode me salvar.', 'salvacao:graca_fe:.8', 'salvacao:merito_obras:.4 salvacao:conhecimento_pratica:.3'),
  A('salvacao', 'Boas ações e disciplina constroem o meu destino espiritual.', 'salvacao:merito_obras:.6', 'salvacao:graca_fe:.3'),
  A('salvacao', 'O sofrimento nasce do desejo e do apego, e pode ser superado com prática e compreensão.', 'salvacao:conhecimento_pratica:.7 etica:compaixao_nao_dano:.2', 'salvacao:sem_salvacao:.2'),
  A('salvacao', 'Manter ritos e festas no tempo certo preserva a ordem do mundo e protege a comunidade.', 'salvacao:ordem_ritual:.7', 'salvacao:sem_salvacao:.2'),
  A('salvacao', 'O objetivo da vida é viver em equilíbrio e harmonia, e não chegar a um estado final.', 'salvacao:harmonia_equilibrio:.7', 'salvacao:graca_fe:.2 salvacao:conhecimento_pratica:.2'),
  A('salvacao', 'A vida não precisa de salvação: o que importa é viver bem enquanto estamos aqui.', 'salvacao:sem_salvacao:.8', 'salvacao:graca_fe:.15 salvacao:conhecimento_pratica:.15 salvacao:merito_obras:.15'),
  A('salvacao', 'A história humana caminha para um desfecho: um julgamento, uma renovação ou o fim de uma era.', 'pos_morte:julgamento:.2', '', { traco: 'escatologia' }),
  L('salvacao', 'Quando alguém se sente espiritualmente “perdido”, o que mais ajuda?', [
    ['Voltar-se a Deus com confiança e arrependimento.', 'salvacao:graca_fe:.5 natureza_humana:decaida:.3'],
    ['Adotar uma disciplina diária (estudo, meditação, serviço).', 'salvacao:conhecimento_pratica:.5 salvacao:merito_obras:.2'],
    ['Reconectar-se com a família, a comunidade e as tradições.', 'salvacao:ordem_ritual:.3 salvacao:harmonia_equilibrio:.3 sociedade:identidade_comunitaria:.2'],
    ['Procurar sentido por conta própria, pela razão e pelas relações.', 'salvacao:sem_salvacao:.4 etica:razao_humanista:.2'],
    ['Buscar um mestre ou guia espiritual.', 'autoridade:mestre_experiencia:.4 salvacao:conhecimento_pratica:.3'],
  ]),
]));
P.push(...blk('Natureza humana', [
  A('salvacao', 'O ser humano tem uma tendência natural ao egoísmo que precisa ser corrigida.', 'natureza_humana:decaida:.5', 'natureza_humana:boa_ou_divina:.4'),
  A('salvacao', 'Todas as pessoas nascem com a mesma capacidade de despertar espiritual.', 'natureza_humana:boa_ou_divina:.6 salvacao:conhecimento_pratica:.2', 'natureza_humana:decaida:.2'),
  A('salvacao', 'Há faltas que exigem expiação, purificação ou reparação.', 'natureza_humana:decaida:.3 salvacao:merito_obras:.2 salvacao:ordem_ritual:.2', 'natureza_humana:neutra_moldada:.3'),
  A('salvacao', 'Já senti uma presença ou uma realidade maior do que eu em momentos de silêncio, natureza ou dor.', 'revelacao:iluminacao_mestre:.2', '', { traco: 'experiencia', p: 0.4 }),
]));

// ---------- Revelação, escrituras e autoridade (14) ----------
P.push(...blk('Textos sagrados', [
  A('revelacao', 'Um livro sagrado pode conter verdades eternas sobre a vida e a conduta.', 'revelacao:revelacao_escrita_profetica:.5 autoridade:escritura_tradicao:.3', 'revelacao:razao_filosofia:.3'),
  A('revelacao', 'Cada geração deve reinterpretar os textos sagrados à luz de novas experiências.', 'autoridade:sem_autoridade_fixa:.4 ciencia:complementares:.2', 'autoridade:escritura_unica:.4 autoridade:tradicao_oral_anciaos:.2'),
  A('revelacao', 'Os ensinamentos mais importantes são transmitidos oralmente, de pessoa a pessoa, e não por escrito.', 'autoridade:tradicao_oral_anciaos:.6 revelacao:tradicao_ancestral:.3', 'autoridade:escritura_unica:.3'),
  A('revelacao', 'O cânone dos textos sagrados está fechado: não se pode acrescentar nem retirar nada.', 'autoridade:escritura_unica:.5 autoridade:escritura_tradicao:.3', 'autoridade:sem_autoridade_fixa:.3 revelacao:iluminacao_mestre:.2'),
  A('revelacao', 'Tratados filosóficos e éticos antigos podem ser fonte de sabedoria tanto quanto escrituras.', 'revelacao:razao_filosofia:.5', 'revelacao:revelacao_escrita_profetica:.2'),
  L('revelacao', 'Diante de uma passagem difícil de um texto sagrado, o que pesa mais?', [
    ['O sentido literal das palavras.', 'autoridade:escritura_unica:.6 ciencia:tensao_literalista:.2'],
    ['A interpretação oficial da tradição.', 'autoridade:escritura_tradicao'],
    ['A explicação de mestres ou anciãos.', 'autoridade:tradicao_oral_anciaos:.5 autoridade:mestre_experiencia:.3'],
    ['O sentido simbólico ou espiritual.', 'autoridade:mestre_experiencia:.3 revelacao:iluminacao_mestre:.3'],
    ['A razão e a crítica histórica.', 'revelacao:razao_filosofia:.5 ciencia:dialogo_empirico:.1'],
    ['Cada leitor decide por si.', 'autoridade:sem_autoridade_fixa'],
  ]),
  L('revelacao', 'Qual destes tipos de texto lhe parece ter maior autoridade espiritual?', [
    ['Um livro considerado palavra de Deus.', 'revelacao:revelacao_escrita_profetica'],
    ['Hinos, mitos e cantos transmitidos por gerações.', 'revelacao:tradicao_ancestral'],
    ['Sermões e diálogos de um mestre desperto.', 'revelacao:iluminacao_mestre'],
    ['Tratados filosóficos e éticos.', 'revelacao:razao_filosofia'],
    ['Nenhum texto tem autoridade espiritual especial.', 'revelacao:sem_conhecimento_sagrado'],
  ]),
]));
P.push(...blk('Fontes do conhecimento', [
  A('revelacao', 'Visões, sonhos e inspirações pessoais podem trazer revelações legítimas.', 'revelacao:iluminacao_mestre:.4 autoridade:mestre_experiencia:.3', 'autoridade:escritura_unica:.2 autoridade:escritura_tradicao:.2', { traco: 'misticismo' }),
  A('revelacao', 'O melhor caminho para a verdade espiritual é o raciocínio lógico e o debate de ideias.', 'revelacao:razao_filosofia:.6', 'revelacao:iluminacao_mestre:.2 revelacao:revelacao_escrita_profetica:.2'),
  A('revelacao', 'Os ensinamentos de um mestre espiritual vivo têm mais peso do que os textos antigos.', 'autoridade:mestre_experiencia:.6', 'autoridade:escritura_unica:.3 autoridade:escritura_tradicao:.3'),
  A('revelacao', 'Alguns conhecimentos espirituais só podem ser transmitidos a quem passou por uma iniciação.', 'organizacao:linhagem_mestre:.5 revelacao:iluminacao_mestre:.3', 'organizacao:individual_autonoma:.2 revelacao:sem_conhecimento_sagrado:.2', { traco: 'misticismo' }),
  A('revelacao', 'A sabedoria dos mais velhos é uma fonte confiável de orientação religiosa.', 'autoridade:tradicao_oral_anciaos:.5 revelacao:tradicao_ancestral:.4', 'autoridade:sem_autoridade_fixa:.2'),
  A('revelacao', 'Não existe verdade religiosa que se possa provar ou conhecer: tudo é interpretação humana.', 'revelacao:sem_conhecimento_sagrado:.6 autoridade:sem_autoridade_fixa:.3', 'revelacao:revelacao_escrita_profetica:.2 revelacao:iluminacao_mestre:.2'),
]));

// ---------- Rituais, oração e meditação (14) ----------
P.push(...blk('Formas de prática', [
  A('pratica', 'Orar ou meditar com regularidade é parte importante da minha vida (ou da vida que desejo ter).', 'praticas:meditacao_contemplacao:.3 praticas:liturgia_comunitaria:.2', 'praticas:minima:.5'),
  A('pratica', 'Cantar, dançar ou tocar tambores em grupo aproxima as pessoas do sagrado.', 'praticas:ritual_ofertas:.3 praticas:xamanismo_possessao:.3 praticas:liturgia_comunitaria:.2', 'praticas:meditacao_contemplacao:.2'),
  A('pratica', 'O silêncio e a atenção plena são o melhor caminho da espiritualidade.', 'praticas:meditacao_contemplacao:.6', 'praticas:ritual_ofertas:.2 praticas:liturgia_comunitaria:.2'),
  A('pratica', 'Ofertas (comida, flores, incenso, velas) são formas genuínas de relação com o sagrado.', 'praticas:ritual_ofertas:.6', 'praticas:meditacao_contemplacao:.2'),
  A('pratica', 'Estados de transe, êxtase ou possessão podem ser formas de contato com o sagrado.', 'praticas:xamanismo_possessao:.7', 'praticas:meditacao_contemplacao:.2 praticas:minima:.1', { traco: 'misticismo' }),
  A('pratica', 'Jejuns, restrições alimentares e purificações ajudam o desenvolvimento espiritual.', 'praticas:observancia_etica:.3 praticas:ritual_ofertas:.2', '', { traco: 'ascetismo' }),
  A('pratica', 'Ir em peregrinação a lugares sagrados é uma experiência transformadora.', 'praticas:ritual_ofertas:.3 praticas:liturgia_comunitaria:.2', 'praticas:minima:.2'),
  A('pratica', 'Celebrar nascimentos, casamentos e despedidas com cerimônia religiosa é essencial.', 'praticas:liturgia_comunitaria:.4 sociedade:identidade_comunitaria:.3', 'praticas:minima:.3 sociedade:escolha_privada:.2'),
]));
P.push(...blk('Sentido da prática', [
  A('pratica', 'Cuidar da natureza e dos animais já é uma forma de prática espiritual.', 'praticas:observancia_etica:.4 natureza_humana:parte_da_natureza:.3 etica:compaixao_nao_dano:.2', ''),
  A('pratica', 'A prática religiosa deve seguir formas fixas, transmitidas sem alteração.', 'praticas:liturgia_comunitaria:.4 praticas:ritual_ofertas:.3', 'praticas:meditacao_contemplacao:.2 praticas:minima:.2', { traco: 'tradicionalismo' }),
  A('pratica', 'Símbolos e imagens sagradas (ícones, estátuas, mandalas, mantras) ajudam a concentrar a mente e o espírito.', 'praticas:ritual_ofertas:.3 praticas:meditacao_contemplacao:.3', 'praticas:minima:.2'),
  A('pratica', 'A cura espiritual (por oração, energia ou rituais) pode complementar a medicina.', 'praticas:xamanismo_possessao:.3 praticas:ritual_ofertas:.2 ciencia:complementares:.2', 'ciencia:dialogo_empirico:.1'),
  L('pratica', 'Qual destes momentos você sente como mais “sagrado”?', [
    ['Uma celebração religiosa coletiva.', 'praticas:liturgia_comunitaria'],
    ['Um momento de silêncio, sozinho(a).', 'praticas:meditacao_contemplacao'],
    ['Uma festa ou rito em honra de espíritos, deuses ou ancestrais.', 'praticas:ritual_ofertas'],
    ['Ajudar alguém que precisa.', 'praticas:observancia_etica'],
    ['Um transe ou êxtase em um ritual.', 'praticas:xamanismo_possessao'],
    ['Nenhum momento específico.', 'praticas:minima'],
  ]),
  A('pratica', 'Prefiro cultos e festas em comunidade a praticar sozinho(a).', 'praticas:liturgia_comunitaria:.5 organizacao:comunidade_local:.3', 'praticas:meditacao_contemplacao:.3 organizacao:individual_autonoma:.2'),
]));

// ---------- Moral e ética (14) ----------
P.push(...blk('Fundamentos morais', [
  L('etica', 'Diante de um dilema moral difícil, em que você se apoia primeiro?', [
    ['Em mandamentos ou normas sagradas.', 'etica:mandamento_divino'],
    ['Nas consequências para as pessoas afetadas.', 'etica:razao_humanista:.6 etica:compaixao_nao_dano:.2'],
    ['No equilíbrio das relações e nos deveres com a comunidade.', 'etica:reciprocidade_comunitaria'],
    ['No princípio de não causar dano a nenhum ser.', 'etica:compaixao_nao_dano'],
    ['No conselho de anciãos, mestres ou da comunidade.', 'etica:reciprocidade_comunitaria:.4 autoridade:tradicao_oral_anciaos:.3'],
    ['Na ordem do mundo (dharma, tao, lei natural).', 'etica:ordem_cosmica'],
  ]),
  A('etica', 'Sem religião, as pessoas teriam dificuldade de distinguir o certo do errado.', 'etica:mandamento_divino:.5', 'etica:razao_humanista:.5'),
  A('etica', 'Ferir qualquer ser vivo é moralmente grave.', 'etica:compaixao_nao_dano:.7', 'etica:razao_humanista:.2 etica:reciprocidade_comunitaria:.1'),
  A('etica', 'Devemos retribuir o bem e honrar dívidas com a família, a comunidade e os ancestrais.', 'etica:reciprocidade_comunitaria:.6', 'etica:razao_humanista:.2'),
  A('etica', 'Existe uma lei moral natural que vale para todas as pessoas, em todos os tempos.', 'etica:ordem_cosmica:.4 etica:mandamento_divino:.2', 'natureza_humana:neutra_moldada:.2'),
  A('etica', 'O que é certo ou errado depende da cultura e do contexto.', 'etica:razao_humanista:.4 etica:reciprocidade_comunitaria:.3', 'etica:mandamento_divino:.3 etica:ordem_cosmica:.3'),
  A('etica', 'Existem atos que são sempre errados, quaisquer que sejam as consequências.', 'etica:mandamento_divino:.4 etica:ordem_cosmica:.2', 'etica:razao_humanista:.4'),
]));
P.push(...blk('Vida ética', [
  A('etica', 'A compaixão por todos os seres deve guiar a vida inteira, inclusive a alimentação.', 'etica:compaixao_nao_dano:.5 praticas:observancia_etica:.3', ''),
  A('etica', 'O bem feito sem esperar recompensa, nesta vida ou depois, é o que tem valor moral.', 'etica:razao_humanista:.3 etica:compaixao_nao_dano:.3', 'salvacao:merito_obras:.3 etica:ordem_cosmica:.2'),
  A('etica', 'Quem transgride as normas religiosas deve receber alguma sanção da comunidade.', 'etica:mandamento_divino:.4 sociedade:integrada_ordem_social:.3', 'sociedade:escolha_privada:.3'),
  A('etica', 'A riqueza e o consumo excessivos atrapalham a vida espiritual.', 'sociedade:retiro_renuncia:.3 praticas:observancia_etica:.2', '', { traco: 'ascetismo' }),
  A('etica', 'Cuidar do meio ambiente é um dever moral e espiritual.', 'etica:compaixao_nao_dano:.3 natureza_humana:parte_da_natureza:.3 etica:ordem_cosmica:.2', ''),
  A('etica', 'Sou responsável por cada uma das minhas escolhas: nada as determina por mim.', '', '', { traco: 'livre_arbitrio' }),
  A('etica', 'Servir aos outros (voluntariado, caridade, serviço) é a expressão mais elevada da vida espiritual.', 'praticas:observancia_etica:.4 etica:compaixao_nao_dano:.2 sociedade:transformacao_social:.2', ''),
]));

// ---------- Ciência e religião (8) ----------
P.push(...blk('Ciência e fé', [
  A('ciencia', 'A ciência moderna, em última análise, confirma a visão religiosa do mundo.', 'ciencia:complementares:.4 ciencia:tensao_literalista:.1', 'ciencia:dialogo_empirico:.3'),
  A('ciencia', 'A teoria da evolução explica adequadamente a origem das espécies.', 'ciencia:dialogo_empirico:.4 ciencia:complementares:.2', 'ciencia:tensao_literalista:.5'),
  A('ciencia', 'Experiências espirituais podem ser estudadas pela neurociência sem perder o seu valor.', 'ciencia:dialogo_empirico:.3 ciencia:complementares:.3', 'ciencia:dominios_separados:.3'),
  A('ciencia', 'Perguntas sobre sentido e valores estão fora do alcance da ciência.', 'ciencia:dominios_separados:.4 ciencia:complementares:.3', 'ciencia:dialogo_empirico:.3'),
  A('ciencia', 'Curas e eventos que a ciência não explica são sinais de algo sobrenatural.', 'ciencia:tensao_literalista:.2', 'ciencia:dialogo_empirico:.3 natureza_divina:sem_realidade_suprema:.1', { traco: 'milagres' }),
  A('ciencia', 'Quando a ciência muda de opinião, mostra seus limites; as verdades sagradas permanecem.', 'ciencia:tensao_literalista:.4', 'ciencia:dialogo_empirico:.4'),
  A('ciencia', 'Os acontecimentos importantes da minha vida, de algum modo, já estavam previstos.', '', '', { traco: 'destino' }),
  L('ciencia', 'Em que sentido a religião pode ser compatível com a ciência?', [
    ['Ambas buscam a verdade, por métodos diferentes.', 'ciencia:complementares'],
    ['Se a religião aceitar os fatos estabelecidos pela ciência.', 'ciencia:dialogo_empirico'],
    ['Respondem a perguntas de tipos diferentes e não competem.', 'ciencia:dominios_separados'],
    ['Só se a ciência respeitar o que as escrituras afirmam.', 'ciencia:tensao_literalista'],
    ['Não vejo compatibilidade entre as duas.', ''],
  ]),
]));

// ---------- Verdade em outras religiões (10) ----------
P.push(...blk('Pluralidade religiosa', [
  A('pluralismo', 'No fundo, as grandes religiões ensinam a mesma coisa.', 'pluralismo:pluralismo:.6', 'pluralismo:exclusivismo:.3 pluralismo:inclusivismo:.2'),
  A('pluralismo', 'É legítimo tentar convencer outras pessoas de que minha religião é a melhor.', 'pluralismo:exclusivismo:.4 pluralismo:inclusivismo:.2', 'pluralismo:pluralismo:.3', { traco: 'proselitismo' }),
  A('pluralismo', 'Combinar elementos de várias tradições na própria vida espiritual é válido.', 'pluralismo:pluralismo:.5 autoridade:sem_autoridade_fixa:.2', 'pluralismo:exclusivismo:.3'),
  A('pluralismo', 'Cada povo tem a religião adequada à sua história; não faz sentido pedir que todos sigam a mesma.', 'pluralismo:sem_pretensao_universal:.7', 'pluralismo:exclusivismo:.2 pluralismo:inclusivismo:.2'),
  A('pluralismo', 'Minha tradição guarda a verdade em plenitude, mas outras guardam partes dela.', 'pluralismo:inclusivismo:.7', 'pluralismo:pluralismo:.2 pluralismo:exclusivismo:.2'),
  A('pluralismo', 'Pessoas sem religião podem ser moralmente excelentes e espiritualmente maduras.', 'pluralismo:pluralismo:.3 pluralismo:inclusivismo:.3 etica:razao_humanista:.2', 'pluralismo:exclusivismo:.3'),
  A('pluralismo', 'Experiências místicas de unidade ocorrem em todas as religiões, de modo parecido.', 'pluralismo:pluralismo:.5', 'pluralismo:exclusivismo:.2'),
  A('pluralismo', 'Os ritos e práticas de uma tradição só têm pleno sentido dentro dela.', 'pluralismo:sem_pretensao_universal:.3 pluralismo:exclusivismo:.2', 'pluralismo:pluralismo:.3'),
  A('pluralismo', 'O respeito às religiões alheias é um dever, mesmo quando elas contrariam a minha.', 'pluralismo:pluralismo:.3 pluralismo:inclusivismo:.2', 'pluralismo:exclusivismo:.3'),
  L('pluralismo', 'Quando você pensa em pessoas de outras religiões, o que prevalece?', [
    ['Estão em erro, e desejo que conheçam a verdade.', 'pluralismo:exclusivismo'],
    ['Têm parte da verdade; a minha é mais completa.', 'pluralismo:inclusivismo'],
    ['Seguem caminhos diferentes para a mesma meta.', 'pluralismo:pluralismo'],
    ['Pertencem a outro povo e a outro modo de vida, que merece respeito.', 'pluralismo:sem_pretensao_universal'],
    ['Não penso nisso em termos de verdade.', '', { na: 'pluralismo' }],
  ]),
]));

// ---------- Comunidade e instituições (14) ----------
P.push(...blk('Autoridade e comunidade', [
  A('comunidade', 'Um líder religioso deve ter autoridade para decidir questões de fé e conduta.', 'organizacao:hierarquia_institucional:.6', 'organizacao:individual_autonoma:.3'),
  A('comunidade', 'Prefiro grupos pequenos e próximos a grandes instituições.', 'organizacao:comunidade_local:.5', 'organizacao:hierarquia_institucional:.3'),
  A('comunidade', 'Aprender com um mestre por meio de uma relação pessoal e prolongada é o melhor caminho.', 'organizacao:linhagem_mestre:.6', 'organizacao:individual_autonoma:.3'),
  A('comunidade', 'Minha espiritualidade é um assunto pessoal que não precisa de grupos.', 'organizacao:individual_autonoma:.6 sociedade:escolha_privada:.2', 'organizacao:comunidade_local:.3 organizacao:hierarquia_institucional:.2'),
  L('comunidade', 'Como você prefere ser conduzido(a) na vida espiritual?', [
    ['Por clero ou autoridades reconhecidas.', 'organizacao:hierarquia_institucional'],
    ['Por uma comunidade em que todos participam.', 'organizacao:comunidade_local'],
    ['Por um guru, sábio ou mestre pessoal.', 'organizacao:linhagem_mestre'],
    ['Por mim mesmo(a), com livros e experiência.', 'organizacao:individual_autonoma'],
    ['Pelos anciãos e costumes do meu povo.', 'organizacao:comunidade_local:.4 autoridade:tradicao_oral_anciaos:.4 sociedade:identidade_comunitaria:.2'],
  ]),
  A('comunidade', 'Sinto-me mais seguro(a) espiritualmente numa tradição de história longa.', 'organizacao:hierarquia_institucional:.2 autoridade:escritura_tradicao:.3', 'autoridade:sem_autoridade_fixa:.2', { traco: 'tradicionalismo' }),
  A('comunidade', 'Uma pessoa pode ser religiosa sem pertencer a nenhuma religião organizada.', 'organizacao:individual_autonoma:.5', 'organizacao:hierarquia_institucional:.2 organizacao:comunidade_local:.2'),
]));
P.push(...blk('Religião e sociedade', [
  A('comunidade', 'Feriados, escolas e cerimônias públicas devem refletir a religião tradicional do país.', 'sociedade:integrada_ordem_social:.5 sociedade:identidade_comunitaria:.2', 'sociedade:escolha_privada:.3'),
  A('comunidade', 'Líderes religiosos devem se posicionar sobre injustiças e desigualdades.', 'sociedade:transformacao_social:.5', 'sociedade:escolha_privada:.2'),
  A('comunidade', 'Passar um período afastado do mundo (mosteiro, retiro, eremitério) é um bom caminho espiritual.', 'sociedade:retiro_renuncia:.6', 'sociedade:transformacao_social:.2', { traco: 'ascetismo' }),
  A('comunidade', 'A religião é, em grande parte, herança da família e da cultura, e não uma escolha individual.', 'sociedade:identidade_comunitaria:.5', 'sociedade:escolha_privada:.4'),
  A('comunidade', 'Dedicar parte da renda e do tempo à comunidade religiosa é um dever.', 'organizacao:comunidade_local:.3 organizacao:hierarquia_institucional:.2 sociedade:identidade_comunitaria:.2', 'organizacao:individual_autonoma:.2'),
  A('comunidade', 'Grupos religiosos devem ter normas claras sobre quem pertence ou não à comunidade.', 'organizacao:hierarquia_institucional:.3 sociedade:identidade_comunitaria:.3', 'organizacao:individual_autonoma:.2'),
  A('comunidade', 'Participaria de causas coletivas (ajuda humanitária, defesa de direitos) por motivo religioso.', 'sociedade:transformacao_social:.5 praticas:observancia_etica:.2', ''),
]));

// ---------- acréscimos (mantêm a ordem anterior; só no fim) ----------
P.push(...blk('Morte e depois', [
  A('alma_morte', 'Quem morre de forma violenta ou sem os ritos adequados pode permanecer inquieto entre os vivos.', 'pos_morte:mundo_ancestral:.4 teismo:animismo:.3', 'pos_morte:nada_ou_incerto:.2 alma:mortal:.2'),
]));
P.push(...blk('Fontes do conhecimento', [
  A('revelacao', 'Pessoas comuns, sem cargo religioso, podem ter acesso direto ao conhecimento do sagrado.', 'autoridade:sem_autoridade_fixa:.3 revelacao:iluminacao_mestre:.3', 'organizacao:hierarquia_institucional:.2 autoridade:escritura_tradicao:.2'),
]));

P.push(...blk('Complementos da versão completa', [
  A('ciencia', 'Quando uma crença religiosa contradiz uma evidência científica bem estabelecida, devo rever a crença.', 'ciencia:dialogo_empirico:.5', 'ciencia:tensao_literalista:.3 ciencia:dominios_separados:.1'),
  A('origem', 'É possível que o universo não tenha tido um começo absoluto.', 'origem:ciclico_sem_inicio:.4 origem:emanacao:.1', 'origem:criacao_do_nada:.3'),
  A('deus', 'O divino se interessa pelos detalhes da vida de cada pessoa.', 'natureza_divina:pessoal_imanente:.3 natureza_divina:pessoal_transcendente:.3', 'natureza_divina:impessoal:.3 teismo:nao_teismo:.1'),
  A('pratica', 'Rezar ou meditar em grupo me faz bem de um modo que sozinho(a) não faria.', 'praticas:liturgia_comunitaria:.5', 'praticas:meditacao_contemplacao:.2 praticas:minima:.1'),
]));

module.exports = P;
