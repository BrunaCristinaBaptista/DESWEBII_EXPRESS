# Exemplos de Express das aulas

## Visão geral

Este projeto reúne exemplos usados nas aulas para demonstrar a construção de APIs com Express,
começando com rotas básicas e avançando de forma incremental por filtros, busca, ordenação,
paginação e persistência em JSON.

A sequência é acumulativa: cada aula mantém tudo o que existe na anterior e acrescenta um
novo conceito. A `aula12` é a última aula conceitual e a `aula13` é a consolidação final.

## Requisitos

- Node.js 18 ou superior
- npm

## Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/marrcandre/express-bsi4.git
   cd express-bsi4
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

## Como executar

Cada arquivo representa um exemplo independente. Para executar, escolha um dos arquivos e rode
com Node.js.

Exemplo com a aula básica:

```bash
node aula2_api_basica_get_colecao.js
```

Para executar outro exemplo, substitua o nome do arquivo:

```bash
node aula13_api_completa.js
```

Por padrão, a API será iniciada na porta configurada em cada exemplo.

## Estrutura dos exemplos

Sequência conceitual incremental:

- aula2_api_basica_get_colecao.js   — GET da coleção (5 produtos em memória)
- aula3_get_por_id.js               — GET por ID (5 em memória)
- aula4_post.js                     — POST (criação; 5 em memória)
- aula5_put.js                      — PUT (atualização completa; 5 em memória)
- aula6_delete.js                   — DELETE (remoção; 5 em memória)
- aula7_validacao.js                — validação de nome e preço (5 em memória)
- aula8_filtros.js                  — filtros de preço (5 em memória)
- aula9_busca.js                    — busca por nome (5 em memória)
- aula10_ordenacao.js               — ordenação (5 em memória)
- aula11_persistencia_json.js       — persistência em arquivo JSON (60 produtos)
- aula12_paginacao.js               — paginação (60 produtos persistidos)
- aula13_api_completa.js            — API completa (consolidação final)

## Dados

O arquivo `produtos.json` é a fonte de dados usada a partir da Aula 11 (persistência), contendo o
**dataset-base compartilhado de 60 produtos** (`{id, nome, preco}`, ids 1–60). Esse mesmo arquivo é a base
de testes dos três backends (Express, FastAPI e Django REST). As aulas 2–10 usam os 5 produtos definidos
no próprio código, apenas para fins didáticos.

## Testes HTTP didáticos com Bruno

As coleções de testes ficam em `http/express/` (formato nativo do [Bruno](https://www.usebruno.com/),
versionáveis no repositório). Cada pasta corresponde a uma aula e reúne as requisições HTTP que
exercem os endpoints daquela aula, com asserções de status/campos/estrutura/erros.

- `Aula 02` — GET da coleção (5 em memória)
- `Aula 03` — GET por ID (inclui caso 404)
- `Aula 04` — POST (criação)
- `Aula 05` — PUT (atualização completa)
- `Aula 06` — DELETE (remoção)
- `Aula 07` — validação de `nome` e `preco` (erros 400)
- `Aula 08` — filtros de preço
- `Aula 09` — busca por nome
- `Aula 10` — ordenação
- `Aula 11` — persistência em `produtos.json` (60 produtos)
- `Aula 12` — paginação
- `Aula 13` — integração (API completa)

Como executar:

1. Instale o app [Bruno](https://usebruno.com/) (desktop) — a coleção abre como pasta (`http/express/`).
2. Abra a coleção e **selecione o ambiente `Local`** no seletor de ambientes (escopo da coleção).
   - O ambiente `Local` define `baseUrl = http://localhost:3000`.
   - As requisições usam `{{baseUrl}}/api/produtos/`, então **não é preciso editar cada requisição**.
   - Sem o ambiente selecionado, o Bruno manda literalmente `{{baseUrl}}` como hostname e o erro fica:
     `getaddrinfo ENOTFOUND {{baseurl}}`.
3. Inicie a aula correspondente:
   ```bash
   node aula2_api_basica_get_colecao.js      # ou a aula desejada (2 a 13)
   ```
4. Execute as requisições daquela pasta (o "Collection Runner" executa a pasta inteira).

Observações:
- Cada aula é um servidor independente na porta 3000 — execute uma por vez, usando a pasta que
  corresponde ao arquivo iniciado.
- As aulas 2–10 usam dados em memória (5 produtos definidos no código). As aulas 11–13 leem/gravam
  `produtos.json` (60 produtos); os testes dessas aulas criam e removem o mesmo recurso temporário
  (id 61, seguinte ao dataset-base), de modo que `produtos.json` termina no estado-base (60 produtos,
  ids 1–60) ao final da execução.
- A coleção acompanha a progressão: Aulas 2–10 respondem com array simples; a partir da Aula 12 o GET
  passa a ser paginado ({ page, page_size, total_pages, results }), operando sobre os 60 produtos
  persistidos.