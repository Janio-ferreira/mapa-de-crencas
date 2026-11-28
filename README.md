# Mapa de Crenças

Plataforma web para estudar, explorar, comparar e relacionar religiões e sistemas de crenças de toda a história humana.

## Executar
```bash
npm install
npm start          # http://localhost:3000  (requer Node >= 22.5)
npm test           # testes do algoritmo
```
No primeiro start o banco (`data/mapa.db`, SQLite) é criado e carregado com o catálogo inicial.
O **token administrativo** é impresso no console e salvo em `data/admin-token.txt` (ou defina `ADMIN_TOKEN`). Acesse `#/admin`.
Variáveis: `PORT`, `DATA_DIR`, `DB_FILE`, `ADMIN_TOKEN`, `WIKIDATA_CLASSES`.

## Arquitetura
```
server/
  schema.sql          esquema relacional (tradições, hierarquia, relações, doutrinas, referências, candidatos, auditoria, FTS5)
  app.js              API REST + painel admin + estáticos
  lib/db.js           SQLite nativo (node:sqlite), slugs, índice de busca
  lib/compat.js       algoritmo de compatibilidade (explicado no cabeçalho do arquivo)
  lib/descoberta.js   fila de candidatos, detecção de duplicatas, consulta ao Wikidata
  seed/               catálogo inicial (t1…t5), dimensões doutrinárias, referências
public/               SPA em JavaScript puro (catálogo, perfil, comparador, teste, mapa, linha do tempo, referências, favoritos, admin)
test/                 testes
```

## Princípios de dados
- Categorias distintas (religião, denominação, vertente, escola, movimento…) e situação (praticada/extinta/histórica/reconstruída).
- Hierarquia só quando fundamentada; influências entre tradições ficam em `relacoes`, sem agrupá-las indevidamente.
- Dado desconhecido = ausente (nunca inventado). Na compatibilidade, ausência amplia o intervalo e reduz a confiança.
- Publicação exige revisão: candidatos → rascunho → em revisão → publicado (mínimo 1 referência).
- Perfis nascem como "curadoria inicial"; marque "revisado academicamente" apenas após revisão por especialista.

## API (principais)
`GET /api/tradicoes?q=&categoria=&situacao=&regiao=&de=&ate=&ordem=` · `GET /api/tradicoes/:slug` · `GET /api/arvore` · `GET /api/mapa` · `GET /api/linha-do-tempo` · `GET /api/referencias` · `GET /api/comparar?slugs=a,b` · `GET /api/dimensoes` · `POST /api/compatibilidade` · `/api/admin/*` (Bearer token)

## Meu Perfil Religioso (12 eixos)
Experiência principal da home (`#/perfil`): questionário em **3 versões (Rápido 44, Completo 128 e Acadêmico 244 perguntas)** → perfil nos **12 eixos** → comparação com todo o catálogo.

**Versões do questionário** (cada uma tem perguntas próprias; a escolha é feita na página `#/perfil`; as respostas são salvas separadamente por versão):

| Versão | Perguntas | Mínimo / recomendado | Foco |
|---|---|---|---|
| `v1` Padrão | 44 | 8 / 20 | visão geral dos 10 temas |
| `v128` Completo | 128 | 24 / 62 | todos os temas, com textos sagrados, filosofia, práticas, ética e pluralismo; 15 dilemas de escolha |
| `v244` Acadêmico | 244 | 40 / 120 | nuances: dilemas e cenários, mal e sofrimento, mistério e experiência, cuidado com os mortos, carisma e profecia, magia e cura, vida familiar, justiça social, religião e Estado, religiões antigas e modernas |

- Código: `server/lib/questionarios/` (`dsl.js` helpers, `v128.js`, `v244.js`; a de 44 continua em `server/lib/questionario.js`). Cada pergunta declara efeitos (`dimensão:opção:massa`) sobre as mesmas dimensões doutrinárias, então **todas as versões comparam com o mesmo catálogo e a mesma fórmula** (0,6 doutrina + 0,4 eixos − penalidade). Mais perguntas = mais evidência por dimensão, não outra métrica.
- **A ordem das perguntas faz parte do código de compartilhamento** (`v128-…`, `v244-…`; `v1-…` continua válido). Só acrescente perguntas no fim de cada arquivo.
- Perguntas escala (concordar reforça A, discordar reforça B) e de escolha; alternativas equilibradas entre famílias religiosas, sem nomear tradições. Itens "neutros" ou pulados não geram evidência.
- Resultado: 12 eixos, ranking por categoria, **leitura por dimensão** (distribuição das respostas, firme/moderada/dividida, nº de perguntas) e cobertura por tema; v128/v244 acrescentam **traços complementares** (misticismo, milagres, apego à tradição, ascetismo, missão, fim dos tempos, destino, livre-arbítrio, experiência), que não entram na comparação porque o banco não tem dado equivalente.
- API: `GET /api/perfil/versoes`, `GET /api/perfil/questionario?versao=v128`, `POST /api/perfil/resultado { respostas, versao }` (ou `{ codigo }`).
- Testes (`test/questionarios.test.js`): contagem, ausência de perguntas repetidas, validade de todos os efeitos, equilíbrio de cobertura por opção, código de compartilhamento, mínimo por versão, API e **respondentes simulados**: para cada uma das ~297 tradições com dados doutrinários, simula-se quem responde como ela e verifica-se que ela aparece a ≤4 pontos do topo (v44: 89%; v128: 100%; v244: 99%).
- `server/lib/eixos.js` — definição dos 12 eixos e projeção (0–100) das dimensões doutrinárias; a mesma função projeta tradições e usuário (dado ausente continua ausente; eixos “não se aplica”).
- `server/lib/questionario.js` — perguntas (escolha, escala 1–5, “pular”), efeitos por dimensão, código compartilhável `v1-…` (**só acrescentar perguntas no fim**).
- `server/lib/perfil.js` — perfil descritivo (arquétipos, perfil misto), pontuação explicável (60% doutrinal + 40% eixos − divergências fundamentais), “o que te distingue”, pensadores/escolas, relações históricas, textos.
- `server/seed/dimensoes_eixos.js` + `eixos_extra.js` — dimensões novas (revelação, pluralismo, organização) e dados de curadoria inicial; `aplicar_eixos.js` migra bancos já existentes (idempotente). `pensadores.js` — ~40 figuras e 9 escolas (estimativas de curadoria inicial, afinidade intelectual ≠ identidade religiosa).
- `public/js/perfil.js` — questionário, resultado, cartão compartilhável (PNG + QR Code), exportar JSON, imprimir/PDF; componentes de eixos usados na página da tradição e no comparador (2–5 tradições).
- API: `GET /api/eixos`, `GET /api/perfil/questionario`, `GET|POST /api/perfil/resultado[/:codigo]`; `eixos` em `/api/tradicoes/:slug` e `/api/comparar`.
- Privacidade: o servidor não guarda respostas; o link do resultado as carrega codificadas. O símbolo das tradições é um monograma gerado (não há imagem livre confiável para todas).

### Imagens
Tabela `imagens` (autor, licença, fonte e URL de origem obrigatórios; só licenças livres; só `verificada=1` aparece). Sem imagem verificada, a interface usa símbolo geométrico original (`public/js/simbolos.js`, com nota de cautela, herdado pela família religiosa) e fundo gerado — nunca imagem de preenchimento nem retrato imaginado.
- Cadastrar em lote: `node --no-warnings scripts/importar-imagens.js imagens.json` (modelo em `scripts/imagens-exemplo.json`; entra como não verificada — confira a página de origem e use `--verificada` ou `PATCH /api/admin/imagens/:id/verificar`).
- API: `GET /api/imagens?tipo=tradicao&slug=…`; admin (aba "Imagens" do painel ou API): `GET|POST /api/admin/imagens`, `PATCH …/:id/verificar`, `DELETE …/:id`.
- Arquivos locais vão em `public/img/`; remotos só de `upload.wikimedia.org`/`commons.wikimedia.org`.
- O resultado mostra cartões com imagem/símbolo, anéis de porcentagem, menu lateral, mapa de origens (Leaflet) e cartão de compartilhamento vertical ou quadrado.

#### Retratos das personalidades
Sem iniciais nem avatares: retrato verificado (pintura, gravura, escultura, fotografia…) ou círculo vazio “retrato confirmado indisponível”. Campos: `imagens_campos` (visão com `image_url, image_type, image_author, image_source, image_license, image_attribution, image_verified, image_source_page`) + `foco` do recorte circular. Fotografia é recusada para quem morreu antes de 1839.
Busca verificada (rode numa máquina com internet): `node --no-warnings scripts/retratos.js buscar` → só aceita item do Wikidata humano com mesmos anos de nascimento/morte, usa a imagem principal (P18), exige licença livre e gera `retratos-candidatos.json` para conferência humana (`"conferido": true`) antes de `scripts/importar-imagens.js`. `retratos.js status` mostra a cobertura.

## Expansão
1. `POST /api/admin/descoberta/wikidata` ou importe JSON em `POST /api/admin/candidatos`.
2. Revise na aba *Candidatos* (duplicatas detectadas; mesclar vira nome alternativo).
3. Aprove → complete perfil, doutrinas e referências → publique.
Para ampliar o seed, adicione arquivos em `server/seed/` seguindo o formato dos existentes.

## Limites da versão 1
- ~336 tradições; há grandes lacunas (povos indígenas, tradições africanas específicas, subdivisões internas, movimentos recentes).
- Doutrinas e similaridades são modelos simplificados, editáveis no banco; precisam de revisão acadêmica.
- Favoritos ficam no navegador (sem contas de usuário).
- O Wikidata só serve como pista; exige verificação em fonte acadêmica.

### Retratos: sincronização automática e armazenamento local
- `npm start` já tenta sincronizar sozinho (3 s após subir e a cada 6 h; desligue com `MAPA_IMAGENS_AUTO=0`). Com internet, para cada personalidade com datas precisas: encontra o item no Wikidata (humano, mesmos anos de nascimento/morte), usa só a imagem principal (P18), confere a licença livre no Commons, **baixa** a imagem e a miniatura para `public/images/personalidades/<slug>/`, evita duplicatas (SHA-256), valida o conteúdo e registra autor, instituição, licença e página de origem no banco e em `public/images/personalidades/manifest.json`. O site passa a servir só o arquivo local.
- Manual: `npm run retratos` (ou `node --no-warnings scripts/retratos.js sincronizar [slug…] [--atualizar]`), `… verificar` (arquivos inválidos), `… status`.
- O manifesto recria o banco após `npm run seed` ou em outra máquina. Sem internet, a rotina não faz nada e os cartões mostram o marcador "retrato confirmado indisponível".
- Personalidades com datas imprecisas (ex.: "séc. VIII") não são casadas automaticamente; use `scripts/importar-imagens.js`.
- Fundadores/figuras das páginas das tradições também recebem retrato (cadastro próprio ou o da personalidade de mesmo nome); sem imagem, mostram o marcador honesto.

### Regra permanente: toda pessoa do catálogo passa pelo processo de retrato
- "Pessoa" = qualquer personalidade (`pensadores`) ou fundador/figura (`figuras`), atual ou futura. A lista é derivada do banco (`server/lib/pessoas.js`), então quem for adicionado entra automaticamente na busca, sem editar mais nada.
- Fluxo por pessoa: busca no Wikidata → confirmação de identidade (humano, mesmos anos de nascimento e morte) → imagem principal → licença livre no Commons → download local → créditos em banco e manifesto → exibição em perfis, resultado e páginas das tradições.
- Resultados possíveis, sempre explícitos: `com_retrato`, `nao_tentado`, `manual` (datas imprecisas: informe o item do Wikidata em `scripts/retratos-curados.json`), `sem_registro_autentico` (figuras tradicionais, lendárias ou debatidas: não há retrato autêntico), `aniconismo` (tradições que restringem imagens da pessoa: nada é buscado), `sem_imagem`, `sem_correspondencia`, `recusado`, `erro`.
- Auditoria: `node --no-warnings scripts/retratos.js relatorio` (ou `GET /admin/retratos/relatorio`). `test/retratos.test.js` falha se alguma pessoa ficar fora do relatório.
- Curadoria: `scripts/retratos-curados.json` aceita `[{"slug": "...", "wikidata": "Q123", "arquivo": "opcional.jpg"}]` para pessoas sem datas precisas; a identidade é confirmada por quem preenche e a licença continua sendo conferida.

## Imagens: coleta externa e importação
O ambiente de desenvolvimento não alcança fontes de imagem. O fluxo para importar imagens reais baixadas em outro computador (validação automática,
metadados completos, aprovação humana obrigatória) está em [`docs/IMAGENS-COLETA-EXTERNA.md`](docs/IMAGENS-COLETA-EXTERNA.md).
Comandos: `npm run imagens:validar -- <pasta>`, `npm run imagens:importar -- <pasta>`, `npm run imagens:auditar`, `node --no-warnings scripts/imagens-pendencias.js`.
Os scripts `colecionar-imagens.js` e `retratos.js` continuam disponíveis para máquinas com internet.
