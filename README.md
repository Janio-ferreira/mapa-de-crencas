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
Experiência principal da home (`#/perfil`): questionário de 44 perguntas → perfil nos **12 eixos** → comparação com todo o catálogo.
- `server/lib/eixos.js` — definição dos 12 eixos e projeção (0–100) das dimensões doutrinárias; a mesma função projeta tradições e usuário (dado ausente continua ausente; eixos “não se aplica”).
- `server/lib/questionario.js` — perguntas (escolha, escala 1–5, “pular”), efeitos por dimensão, código compartilhável `v1-…` (**só acrescentar perguntas no fim**).
- `server/lib/perfil.js` — perfil descritivo (arquétipos, perfil misto), pontuação explicável (60% doutrinal + 40% eixos − divergências fundamentais), “o que te distingue”, pensadores/escolas, relações históricas, textos.
- `server/seed/dimensoes_eixos.js` + `eixos_extra.js` — dimensões novas (revelação, pluralismo, organização) e dados de curadoria inicial; `aplicar_eixos.js` migra bancos já existentes (idempotente). `pensadores.js` — ~40 figuras e 9 escolas (estimativas de curadoria inicial, afinidade intelectual ≠ identidade religiosa).
- `public/js/perfil.js` — questionário, resultado, cartão compartilhável (PNG + QR Code), exportar JSON, imprimir/PDF; componentes de eixos usados na página da tradição e no comparador (2–5 tradições).
- API: `GET /api/eixos`, `GET /api/perfil/questionario`, `GET|POST /api/perfil/resultado[/:codigo]`; `eixos` em `/api/tradicoes/:slug` e `/api/comparar`.
- Privacidade: o servidor não guarda respostas; o link do resultado as carrega codificadas. O símbolo das tradições é um monograma gerado (não há imagem livre confiável para todas).

## Expansão
1. `POST /api/admin/descoberta/wikidata` ou importe JSON em `POST /api/admin/candidatos`.
2. Revise na aba *Candidatos* (duplicatas detectadas; mesclar vira nome alternativo).
3. Aprove → complete perfil, doutrinas e referências → publique.
Para ampliar o seed, adicione arquivos em `server/seed/` seguindo o formato dos existentes.

## Limites da versão 1
- ~189 tradições; há grandes lacunas (povos indígenas, tradições africanas específicas, subdivisões internas, movimentos recentes).
- Doutrinas e similaridades são modelos simplificados, editáveis no banco; precisam de revisão acadêmica.
- Favoritos ficam no navegador (sem contas de usuário).
- O Wikidata só serve como pista; exige verificação em fonte acadêmica.
