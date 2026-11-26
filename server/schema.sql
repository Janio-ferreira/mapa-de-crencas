-- =====================================================================
-- MAPA DE CRENÇAS — esquema relacional (SQLite)
-- Convenções: ids inteiros; slugs estáveis para URLs; anos negativos = a.C.
-- Tudo que for incerto fica NULL ou em campos *_nota (nunca inventado).
-- =====================================================================
PRAGMA foreign_keys = ON;

-- ---------- Tabelas de apoio: geografia e tempo ----------
CREATE TABLE IF NOT EXISTS regioes (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'regiao',          -- continente | regiao | pais | localidade
  parent_id INTEGER REFERENCES regioes(id),
  lat REAL, lng REAL
);

CREATE TABLE IF NOT EXISTS periodos (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  inicio INTEGER,                                -- ano (negativo = a.C.)
  fim INTEGER,
  ordem INTEGER NOT NULL
);

-- ---------- Núcleo: tradições (todas as categorias) ----------
CREATE TABLE IF NOT EXISTS tradicoes (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'religiao','familia_religiosa','denominacao','vertente','escola',
    'movimento','tradicao_espiritual','culto_historico','sistema_filosofico_religioso')),
  parent_id INTEGER REFERENCES tradicoes(id) ON DELETE SET NULL,   -- hierarquia fundamentada
  situacao TEXT NOT NULL CHECK (situacao IN ('praticada','extinta','historica','reconstruida')),
  resumo TEXT NOT NULL,

  origem_regiao_id INTEGER REFERENCES regioes(id),
  origem_texto TEXT,
  origem_lat REAL, origem_lng REAL,
  inicio_ano INTEGER,                            -- NULL = desconhecido
  inicio_aprox INTEGER NOT NULL DEFAULT 1,       -- 1 = data aproximada/convencional
  fim_ano INTEGER,                               -- NULL = sem fim (praticada) ou desconhecido
  periodo_texto TEXT,
  periodo_id INTEGER REFERENCES periodos(id),

  contexto_historico TEXT,
  historia TEXT,
  crencas_fundamentais TEXT,
  divindade TEXT,
  humanidade TEXT,
  alma_espirito TEXT,
  pos_morte TEXT,
  praticas_rituais TEXT,
  organizacao TEXT,
  relacao_outras TEXT,
  distribuicao TEXT,
  situacao_atual TEXT,
  controversias TEXT,                            -- pontos disputados, de forma explícita
  adeptos_estimativa TEXT,                       -- texto com ressalvas; nunca número "mágico"

  verificacao TEXT NOT NULL DEFAULT 'curadoria_inicial'
    CHECK (verificacao IN ('curadoria_inicial','revisado_academicamente')),
  status_publicacao TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status_publicacao IN ('rascunho','em_revisao','publicado','arquivado')),
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS ix_trad_parent ON tradicoes(parent_id);
CREATE INDEX IF NOT EXISTS ix_trad_cat ON tradicoes(categoria);
CREATE INDEX IF NOT EXISTS ix_trad_sit ON tradicoes(situacao);
CREATE INDEX IF NOT EXISTS ix_trad_status ON tradicoes(status_publicacao);

CREATE TABLE IF NOT EXISTS nomes_alternativos (
  id INTEGER PRIMARY KEY,
  tradicao_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  idioma TEXT,
  tipo TEXT NOT NULL DEFAULT 'alternativo',      -- alternativo | autodenominacao | exonimo | historico | transliteracao
  UNIQUE (tradicao_id, nome)
);

-- Regiões de distribuição (muitos-para-muitos)
CREATE TABLE IF NOT EXISTS tradicao_regioes (
  tradicao_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  regiao_id INTEGER NOT NULL REFERENCES regioes(id),
  papel TEXT NOT NULL DEFAULT 'distribuicao',    -- origem | distribuicao | historica
  PRIMARY KEY (tradicao_id, regiao_id, papel)
);

-- Relações não hierárquicas entre tradições (sem agrupá-las indevidamente)
CREATE TABLE IF NOT EXISTS relacoes (
  id INTEGER PRIMARY KEY,
  origem_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  destino_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'originou','influenciou','sincretismo_com','reacao_a','reconstrucao_de','contemporanea_de','sucedeu')),
  descricao TEXT,
  fundamentacao_ref_id INTEGER REFERENCES referencias(id),
  UNIQUE (origem_id, destino_id, tipo)
);

-- ---------- Conteúdo estruturado ----------
CREATE TABLE IF NOT EXISTS figuras (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  historicidade TEXT NOT NULL DEFAULT 'historica' -- historica | tradicional | debatida | lendaria
);
CREATE TABLE IF NOT EXISTS tradicao_figuras (
  tradicao_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  figura_id INTEGER NOT NULL REFERENCES figuras(id),
  papel TEXT NOT NULL DEFAULT 'fundador',        -- fundador | figura_central | reformador | profeta | codificador
  nota TEXT,
  PRIMARY KEY (tradicao_id, figura_id, papel)
);

CREATE TABLE IF NOT EXISTS textos_sagrados (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'escritura',        -- escritura | tradicao_oral | compilacao | texto_funerario | hino ...
  descricao TEXT
);
CREATE TABLE IF NOT EXISTS tradicao_textos (
  tradicao_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  texto_id INTEGER NOT NULL REFERENCES textos_sagrados(id),
  autoridade TEXT,                               -- como a tradição o considera (nota)
  PRIMARY KEY (tradicao_id, texto_id)
);

CREATE TABLE IF NOT EXISTS crencas (
  id INTEGER PRIMARY KEY,
  tradicao_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  centralidade INTEGER NOT NULL DEFAULT 2        -- 1 = periférica, 2 = importante, 3 = central
);
CREATE TABLE IF NOT EXISTS praticas (
  id INTEGER PRIMARY KEY,
  tradicao_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'ritual',           -- ritual | oracao | meditacao | peregrinacao | festival | etica | outra
  descricao TEXT NOT NULL
);

-- ---------- Fontes e referências ----------
CREATE TABLE IF NOT EXISTS referencias (
  id INTEGER PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,                    -- ex.: "smart1998"
  tipo_fonte TEXT NOT NULL CHECK (tipo_fonte IN ('academica','fonte_primaria','enciclopedia','institucional','outra')),
  autores TEXT,
  titulo TEXT NOT NULL,
  ano INTEGER,
  editora TEXT,
  local TEXT,
  url TEXT, doi TEXT, isbn TEXT,
  nota TEXT
);
CREATE TABLE IF NOT EXISTS tradicao_referencias (
  tradicao_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  referencia_id INTEGER NOT NULL REFERENCES referencias(id),
  escopo TEXT,                                   -- o que esta fonte sustenta
  PRIMARY KEY (tradicao_id, referencia_id)
);

-- Fontes de DESCOBERTA (onde o mecanismo procura candidatos)
CREATE TABLE IF NOT EXISTS fontes_consultadas (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,                            -- base_de_conhecimento | enciclopedia | catalogo_academico | importacao_manual
  url TEXT,
  confiabilidade TEXT NOT NULL DEFAULT 'baixa',  -- baixa = exige verificação humana contra fonte acadêmica
  ativa INTEGER NOT NULL DEFAULT 1,
  ultima_execucao TEXT
);

-- ---------- Doutrinas: base do algoritmo de compatibilidade ----------
CREATE TABLE IF NOT EXISTS dimensoes (
  id INTEGER PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  peso_base REAL NOT NULL DEFAULT 1.0
);
CREATE TABLE IF NOT EXISTS opcoes (
  id INTEGER PRIMARY KEY,
  dimensao_id INTEGER NOT NULL REFERENCES dimensoes(id) ON DELETE CASCADE,
  chave TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  UNIQUE (dimensao_id, chave)
);
-- similaridade parcial entre opções da mesma dimensão (simétrica; diagonal = 1; ausente = 0)
CREATE TABLE IF NOT EXISTS similaridade_opcoes (
  opcao_a INTEGER NOT NULL REFERENCES opcoes(id) ON DELETE CASCADE,
  opcao_b INTEGER NOT NULL REFERENCES opcoes(id) ON DELETE CASCADE,
  valor REAL NOT NULL CHECK (valor >= 0 AND valor <= 1),
  justificativa TEXT,
  PRIMARY KEY (opcao_a, opcao_b)
);
-- Posição doutrinária de uma tradição numa dimensão: distribuição sobre opções.
-- Várias linhas na mesma (tradição, dimensão) = divergência interna (pesos somam ~1).
-- Ausência de linhas = informação não documentada (NÃO é tratada como "0").
CREATE TABLE IF NOT EXISTS doutrinas (
  id INTEGER PRIMARY KEY,
  tradicao_id INTEGER NOT NULL REFERENCES tradicoes(id) ON DELETE CASCADE,
  dimensao_id INTEGER NOT NULL REFERENCES dimensoes(id),
  opcao_id INTEGER NOT NULL REFERENCES opcoes(id),
  peso REAL NOT NULL DEFAULT 1.0 CHECK (peso > 0 AND peso <= 1),
  confianca REAL NOT NULL DEFAULT 0.8 CHECK (confianca >= 0 AND confianca <= 1),
  nota TEXT,
  UNIQUE (tradicao_id, dimensao_id, opcao_id)
);
CREATE INDEX IF NOT EXISTS ix_doutrinas_trad ON doutrinas(tradicao_id);

-- ---------- Fila de descoberta / revisão ----------
CREATE TABLE IF NOT EXISTS candidatos (
  id INTEGER PRIMARY KEY,
  nome TEXT NOT NULL,
  nomes_alternativos TEXT,                       -- JSON array
  categoria_sugerida TEXT,
  descricao_bruta TEXT,
  fonte_id INTEGER REFERENCES fontes_consultadas(id),
  fonte_url TEXT,
  id_externo TEXT,                               -- ex.: QID do Wikidata
  possiveis_duplicatas TEXT,                     -- JSON [{tradicao_id,nome,score,motivo}]
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','aprovado','rejeitado','duplicata','mesclado')),
  tradicao_id INTEGER REFERENCES tradicoes(id),  -- registro criado/associado após revisão
  notas_revisao TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  revisado_em TEXT,
  UNIQUE (fonte_id, id_externo)
);

CREATE TABLE IF NOT EXISTS auditoria (
  id INTEGER PRIMARY KEY,
  quando TEXT NOT NULL DEFAULT (datetime('now')),
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id INTEGER,
  detalhe TEXT
);

-- ---------- Busca de texto completo (sem acentos) ----------
CREATE VIRTUAL TABLE IF NOT EXISTS busca USING fts5(
  nome, alternativos, resumo, conteudo,
  tradicao_id UNINDEXED,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- Pensadores e escolas (afinidade intelectual; NÃO é identidade religiosa) e suas posições estimadas nos 12 eixos
CREATE TABLE IF NOT EXISTS pensadores (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pensador','escola_filosofica')),
  vida TEXT,
  tradicao_texto TEXT,
  tradicao_id INTEGER REFERENCES tradicoes(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  obras TEXT,
  nota TEXT,
  verificacao TEXT NOT NULL DEFAULT 'curadoria_inicial'
);
CREATE TABLE IF NOT EXISTS pensador_eixos (
  pensador_id INTEGER NOT NULL REFERENCES pensadores(id) ON DELETE CASCADE,
  eixo TEXT NOT NULL,
  valor REAL NOT NULL CHECK (valor BETWEEN 0 AND 100),
  nota TEXT,
  confianca REAL NOT NULL DEFAULT 0.6,
  PRIMARY KEY (pensador_id, eixo)
);

-- Imagens com origem e licença registradas. Só imagens verificadas=1 são exibidas; sem imagem, a interface usa símbolo/ilustração tipográfica.
CREATE TABLE IF NOT EXISTS imagens (
  id INTEGER PRIMARY KEY,
  entidade_tipo TEXT NOT NULL CHECK (entidade_tipo IN ('tradicao','pensador','figura','texto','regiao')),
  entidade_slug TEXT NOT NULL,
  papel TEXT NOT NULL CHECK (papel IN ('foto','monumento','retrato','capa','simbolo','mapa','bandeira')),
  arquivo_url TEXT NOT NULL,
  miniatura_url TEXT,
  titulo TEXT,
  alt TEXT NOT NULL,
  autor TEXT NOT NULL,
  licenca TEXT NOT NULL,
  licenca_url TEXT,
  fonte_nome TEXT NOT NULL,
  fonte_url TEXT NOT NULL,
  data_acesso TEXT,
  verificada INTEGER NOT NULL DEFAULT 0,
  nota TEXT,
  UNIQUE (entidade_tipo, entidade_slug, arquivo_url)
);
CREATE INDEX IF NOT EXISTS ix_imagens_ent ON imagens(entidade_tipo, entidade_slug);
