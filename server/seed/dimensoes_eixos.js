'use strict';
/**
 * Dimensões acrescentadas para sustentar os 12 eixos religiosos (revelação, pluralismo e organização).
 * Entram no mesmo modelo das demais: opções + similaridade parcial + doutrinas por tradição (com confiança).
 * Quando uma tradição não tem dado para estas dimensões, o eixo correspondente é tratado como "não documentado".
 */
module.exports = [
  {
    chave: 'revelacao', nome: 'Fonte do conhecimento religioso', peso_base: 1.0,
    pergunta: 'De onde vem o conhecimento religioso ou espiritual mais confiável?',
    descricao: 'Revelação divina, tradição herdada, despertar/experiência direta ou razão e investigação.',
    opcoes: [
      ['revelacao_escrita_profetica', 'Revelação divina (profetas e escrituras)', 'Deus ou o divino comunicou verdades por profetas, mensageiros ou escrituras.'],
      ['tradicao_ancestral', 'Tradição ancestral (mitos, ritos, memória)', 'Conhecimento herdado de ancestrais e transmitido por mitos, ritos e prática comunitária.'],
      ['iluminacao_mestre', 'Experiência direta e despertar (com mestres)', 'Conhecimento obtido por prática, contemplação ou despertar, geralmente guiado por mestres.'],
      ['razao_filosofia', 'Razão e investigação filosófica', 'Reflexão, argumento e investigação humana, sem exigir revelação sobrenatural.'],
      ['sem_conhecimento_sagrado', 'Sem conhecimento sagrado especial', 'Não há conhecimento religioso que transcenda o conhecimento humano comum.'],
    ],
    sim: [
      ['revelacao_escrita_profetica', 'tradicao_ancestral', 0.3, 'Ambos reconhecem fonte externa ao indivíduo, mas de naturezas distintas.'],
      ['tradicao_ancestral', 'iluminacao_mestre', 0.3, 'Ambos dependem de transmissão e prática viva.'],
      ['iluminacao_mestre', 'razao_filosofia', 0.4, 'Ambos valorizam investigação e experiência do próprio sujeito.'],
      ['revelacao_escrita_profetica', 'iluminacao_mestre', 0.2, 'Ambos admitem conhecimento além do ordinário, por vias diferentes.'],
      ['razao_filosofia', 'sem_conhecimento_sagrado', 0.4, 'Ambos dispensam revelação sobrenatural.'],
    ],
  },
  {
    chave: 'pluralismo', nome: 'Verdade entre as religiões', peso_base: 1.0,
    pergunta: 'Como você vê a verdade ou a validade das diferentes religiões?',
    descricao: 'Exclusivismo, inclusivismo ou pluralismo religioso.',
    opcoes: [
      ['exclusivismo', 'Exclusivismo', 'Só uma religião contém a verdade plena e/ou o caminho de salvação.'],
      ['inclusivismo', 'Inclusivismo', 'Uma religião é a mais completa, mas as outras contêm verdades parciais ou podem levar à meta.'],
      ['pluralismo', 'Pluralismo', 'Várias religiões são caminhos igualmente válidos para o sagrado.'],
      ['sem_pretensao_universal', 'Sem pretensão universal', 'Tradição ligada a um povo ou lugar, sem afirmar ser o caminho de toda a humanidade.'],
    ],
    sim: [
      ['exclusivismo', 'inclusivismo', 0.5, 'Ambos afirmam uma religião central.'],
      ['inclusivismo', 'pluralismo', 0.5, 'Ambos reconhecem verdade em outras religiões.'],
      ['pluralismo', 'sem_pretensao_universal', 0.5, 'Ambos não reivindicam exclusividade.'],
      ['inclusivismo', 'sem_pretensao_universal', 0.3, 'Ambos reconhecem outras tradições, de formas diferentes.'],
    ],
  },
  {
    chave: 'organizacao', nome: 'Organização e autoridade institucional', peso_base: 0.9,
    pergunta: 'Como você prefere viver a espiritualidade em termos de organização?',
    descricao: 'Hierarquia institucional, comunidade local, linhagens de mestres ou autonomia individual.',
    opcoes: [
      ['hierarquia_institucional', 'Hierarquia institucional', 'Instituição com liderança, doutrina e cargos definidos.'],
      ['comunidade_local', 'Comunidade local', 'Congregação ou comunidade de fiéis, com liderança local e pouca hierarquia central.'],
      ['linhagem_mestre', 'Linhagem de mestres', 'Transmissão de mestre a discípulo, com autoridade pessoal e não institucional.'],
      ['individual_autonoma', 'Autonomia individual', 'Prática pessoal, sem vínculo necessário com instituição ou comunidade.'],
    ],
    sim: [
      ['hierarquia_institucional', 'comunidade_local', 0.5, 'Ambos supõem pertencimento a um grupo organizado.'],
      ['comunidade_local', 'linhagem_mestre', 0.4, 'Ambos têm autoridade local e relacional.'],
      ['hierarquia_institucional', 'linhagem_mestre', 0.3, 'Ambos têm autoridade reconhecida acima do indivíduo.'],
      ['linhagem_mestre', 'individual_autonoma', 0.3, 'Ambos enfatizam o caminho pessoal.'],
      ['comunidade_local', 'individual_autonoma', 0.3, 'Pouca hierarquia formal.'],
    ],
  },
];
