# Coleta externa de imagens — como baixar e importar

O ambiente de desenvolvimento não alcança Wikimedia Commons, Wikidata, museus e bibliotecas. As imagens reais precisam ser
baixadas em um computador com internet e depois importadas. Nada é inventado, gerado por IA ou copiado sem crédito: cada imagem
chega com autor, fonte, licença e a religião ou pessoa associada, é validada automaticamente e **só aparece no site depois de uma
pessoa aprová-la**.

## Visão geral

```
1. Gerar as listas        npm run ... / node scripts/imagens-pendencias.js     → importacao/lista-de-tradicoes.csv, lista-de-pessoas.csv
2. Baixar as imagens      (computador com internet)                           → pasta do pacote
3. Preencher manifesto    importacao/manifesto-modelo.csv → manifesto.csv
4. Validar                npm run imagens:validar -- <pasta>                  → não altera nada
5. Importar               npm run imagens:importar -- <pasta>                 → entram como NÃO verificadas
6. Aprovar                painel admin → Imagens → verificar                  → só então aparecem no site
7. Auditar                npm run imagens:auditar                             → arquivos ausentes ou corrompidos
```

## 1. O que procurar

Por tradição, **só o que existir e fizer sentido** (não force categorias): local sagrado (templo, igreja, mesquita, sinagoga),
símbolo ou objeto, manuscrito ou escritura, cerimônia ou festival, arte e arquitetura. Para pessoas: retrato histórico ou fotografia.
`lista-de-tradicoes.csv` traz o slug exato, os nomes alternativos (úteis para a busca) e a situação atual.

Fontes recomendadas: Wikimedia Commons, acervos abertos de museus (Met Open Access, Rijksmuseum, Smithsonian, Wellcome), Biblioteca
do Congresso, Internet Archive, e instituições religiosas oficiais quando a licença permitir.

## 2. Regras de licença (a importação recusa o resto)

Aceitas: **domínio público**, **CC0**, **CC BY** e **CC BY-SA** (qualquer versão). Recusadas: "todos os direitos reservados", CC BY-NC,
CC BY-ND, "uso justo", fotos de banco de imagens e qualquer imagem sem autor identificado.

Em cada página de arquivo do Commons, copie: autor (campo *Author*), licença (*License*, com o link), título, instituição quando houver
(*Credit* / *Source*) e o endereço da página (`fonte_url`). **Confira que a imagem realmente mostra o que o título diz** (o templo certo, a
pessoa certa). Descarte imagens com marca-d'água, logotipos, ilustrações genéricas ou que representem outra tradição.

## 3. Como baixar

Na página do arquivo do Commons, use **Download → Original file** (ou uma largura de 1200–2000 px). Salve em uma pasta nova, por exemplo `pacote-01/`.

- Formatos: `.jpg`, `.jpeg`, `.png`, `.webp`. O tipo é conferido pelo conteúdo: renomear um `.gif` ou uma página HTML não funciona.
- Resolução mínima: **800 px de largura** (retratos: 400 px). Máximo de 12.000 px e **8 MB** por arquivo (reduza antes, se necessário).
- Não envie o mesmo arquivo duas vezes: duplicatas (SHA-256) são detectadas no pacote e no projeto.
- Subpastas são permitidas; no manifesto use o caminho relativo (`catolicismo/sao-pedro.jpg`).

Alternativa automatizada, no computador com internet: `node --no-warnings scripts/colecionar-imagens.js --max 40` e `npm run retratos`.
Esses scripts continuam funcionando e também deixam tudo para verificação humana.

## 4. O manifesto

Copie `importacao/manifesto-modelo.csv` para `pacote-01/manifesto.csv` (ou use `manifesto.json`, uma lista de objetos com as mesmas chaves).
Uma linha por imagem:

| Coluna | Obrigatória | Conteúdo |
|---|---|---|
| `arquivo` | sim | caminho do arquivo dentro do pacote |
| `entidade_tipo` | sim | `tradicao`, `pensador`, `figura`, `texto` ou `regiao` |
| `entidade_slug` | sim | slug exato das listas CSV |
| `papel` | sim (pessoas: `retrato`) | `foto`, `monumento`, `retrato`, `capa`, `simbolo`, `mapa`, `bandeira` |
| `alt` | sim | descrição objetiva do que a imagem mostra |
| `autor` | sim | autor conforme a página de origem |
| `licenca` | sim | ex.: `CC BY-SA 4.0`, `Public domain`, `CC0` |
| `fonte_nome` / `fonte_url` | sim | nome da fonte e página (https) do arquivo |
| `licenca_url`, `titulo`, `data_acesso`, `nota` | não | `data_acesso` padrão = dia da importação |
| `tipo_representacao`, `instituicao` | retratos | `fotografia`, `pintura`, `gravura`, `escultura`…; museu/biblioteca/arquivo |

**Pessoas:** informe se é fotografia ou representação (pintura, gravura, escultura…). Fotografia só para quem viveu depois de 1839 e tem
documentação histórica. Se não existe retrato conhecido, **deixe sem imagem**: o site mostra o aviso de indisponibilidade.

Não há coluna de aprovação. Colunas `verificada` ou `conferido`, se presentes, são ignoradas.

## 5. Validar e importar

```bash
npm run imagens:validar -- pacote-01     # relatório linha a linha; não altera nada (código de saída 1 se houver recusadas)
npm run imagens:importar -- pacote-01    # importa só as linhas válidas
```

A validação confere: manifesto presente; arquivo existente e caminho seguro; formato real (assinatura), extensão coerente e arquivo não truncado;
resolução e proporção; tamanho; duplicatas; entidade existente no catálogo; autor, licença livre, fonte https, regras de retrato e de anacronismo.
Arquivos na pasta que não constam no manifesto aparecem como aviso. O relatório fica em `data/relatorio-importacao.json`.

Destino dos arquivos: tradições, textos e regiões em `public/images/tradicoes/…`; pessoas em `public/images/personalidades/<slug>/`. Os
metadados ficam no banco e em `manifest.json` (nas duas pastas), para reconstruir o banco em outra máquina; reinícios não desfazem aprovações.

## 6. Aprovação humana

As imagens importadas ficam com `verificada=0` e **não aparecem no site**. Abra o painel admin (token em `data/admin-token.txt`), vá em
**Imagens**, compare a imagem com a página de origem (`fonte_url`) e confirme: é a tradição ou pessoa certa, a licença e o autor estão corretos.
Só então marque **verificar**. Para listar o que espera aprovação: `node --no-warnings scripts/importar-pacote.js pendentes`.

## 7. Depois da importação

```bash
npm run imagens:auditar     # arquivos ausentes ou corrompidos (saída 1 se houver)
npm test                    # inclui a suíte de importação
```

Para levar o resultado ao ambiente de desenvolvimento, envie `public/images/` (inclusive os `manifest.json`) ou o pacote original com o manifesto.

## Problemas comuns

| Mensagem | Causa e solução |
|---|---|
| `conteúdo não é JPEG, PNG ou WebP` | o download trouxe uma página de erro ou outro formato; baixe novamente |
| `extensão .jpg não corresponde ao conteúdo real (png)` | renomeie para a extensão correta |
| `largura Npx menor que o mínimo` | baixe a versão maior |
| `já existe no projeto` / `duplicata` | imagem repetida; remova do pacote |
| `licença não aceita` | use só domínio público, CC0, CC BY ou CC BY-SA |
| `tradicao "x" não existe no banco` | slug digitado errado; copie da lista CSV |

## Executando a coleta automática no Windows (PowerShell ou Prompt de Comando)

```powershell
cd C:\caminho\para\mapa-de-crencas       # a pasta que contém package.json
npm install                               # só na primeira vez (Node 22.5 ou superior)

# 1) teste pequeno: 3 tradições
node --no-warnings scripts/colecionar-imagens.js --slugs bahai,hopi,religiao-ryukyu --lote 3

# 2) depois, lotes de 10 (ou 20), quantas vezes quiser; ele retoma de onde parou
node --no-warnings scripts/colecionar-imagens.js
node --no-warnings scripts/colecionar-imagens.js --lote 20 --max 60

node --no-warnings scripts/colecionar-imagens.js --status      # andamento, sem usar a internet
```

O coletor faz uma requisição por vez (intervalo de 1,5 s), lê o `Retry-After` quando recebe HTTP 429 e espera de forma progressiva; se o limite persistir, para e salva o andamento (código de saída 6). Tradições sem imagem vêm primeiro. O andamento fica em `data/coleta-estado.json` e o relatório da execução em `data/relatorio-imagens.json`. Para reprocessar: `--refazer hopi` ou `--refazer todas`. Se o Commons responder muito devagar, aumente `--intervalo 3000`.
Tudo entra como **não verificado**; aprove no painel admin.

| Código de saída | Significado |
|---|---|
| 0 | lote concluído com imagens baixadas |
| 2 | sem acesso ao Wikimedia Commons |
| 3 | catálogo vazio, `--slugs` inexistente ou argumento inválido |
| 5 | lote processado, mas nenhuma imagem passou nos filtros (veja os motivos impressos) |
| 6 | execução interrompida pelo limite de requisições do servidor; rode de novo mais tarde |

## Ao devolver a pasta `public/images/tradicoes/` ao projeto

O pacote do projeto vem **sem** imagens e **sem** `data/`. Ao extrair sobre a sua pasta, mantenha `public/images/` e `data/` (mapa.db, admin-token.txt, coleta-estado.json, relatorio-imagens.json). Depois:

1. `npm run imagens:auditar` — esperado (702 imagens de tradições): `manifesto.tradicoes = 702`, `manifesto.semArquivo = 0`, `orfaosSemRegistro = 0`, `quebradas = 0`, `verificadasSemArquivo = 0`, `tradicoesComImagem = 269`.
2. Ao iniciar o servidor (`npm start`) o log mostra `[imagens] banco … manifesto … arquivos em disco …`. Imagens reconhecidas entram **não verificadas**; só você aprova (painel → Imagens, filtro "Aguardando aprovação").
3. Remover no painel não apaga o arquivo: marca `removida` no manifesto. Aprovações feitas no painel também são gravadas no manifesto (sobrevivem à perda do banco).
4. Manifestos (`manifest.json`) e `coleta-estado.json` são gravados de forma atômica, com cópia `.bak`; se estiverem corrompidos o sistema avisa e **não** sobrescreve.
5. A sincronização automática de retratos pela internet é opt-in (`MAPA_IMAGENS_AUTO=1`) e nunca aprova.
