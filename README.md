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

- aula2_api_basica_get_colecao.js   — GET da coleção
- aula3_get_por_id.js               — GET por ID
- aula4_post.js                     — POST (criação)
- aula5_put.js                      — PUT (atualização completa)
- aula6_delete.js                   — DELETE (remoção)
- aula7_validacao.js                — validação de nome e preço
- aula8_filtros.js                  — filtros de preço
- aula9_busca.js                    — busca por nome
- aula10_ordenacao.js               — ordenação
- aula11_paginacao.js               — paginação
- aula12_persistencia_json.js       — persistência em arquivo JSON
- aula13_api_completa.js            — API completa (consolidação final)

## Dados

O arquivo `produtos.json` é usado pelas aulas de persistência (12 e 13) como fonte dos dados.

## Testes HTTP didáticos com Bruno

As coleções de testes ficam em `http/express/` (formato nativo do [Bruno](https://www.usebruno.com/),
versionáveis no repositório). Cada pasta corresponde a uma aula e reúne as requisições HTTP que
exercem os endpoints daquela aula, com asserções de status/campos/estrutura/erros.

- `Aula 02` — GET da coleção
- `Aula 03` — GET por ID (inclui caso 404)
- `Aula 04` — POST (criação)
- `Aula 05` — PUT (atualização completa)
- `Aula 06` — DELETE (remoção)
- `Aula 07` — validação de `nome` e `preco` (erros 400)
- `Aula 08` — filtros de preço
- `Aula 09` — busca por nome
- `Aula 10` — ordenação
- `Aula 11` — paginação
- `Aula 12` — persistência em `produtos.json`
- `Aula 13` — integração (API completa)

Como executar:

1. Instale o app [Bruno](https://usebruno.com/) (desktop) — a coleção abre como pasta (`http/express/`).
2. Abra a coleção e selecione o ambiente `Local` (variável `baseUrl = http://localhost:3000`).
3. Inicie a aula correspondente:
   ```bash
   node aula2_api_basica_get_colecao.js      # ou a aula desejada (2 a 13)
   ```
4. Execute as requisições daquela pasta (o "Collection Runner" executa a pasta inteira).

Observações:
- Cada aula é um servidor independente na porta 3000 — execute uma por vez, usando a pasta que
  corresponde ao arquivo iniciado.
- As aulas 2–11 usam dados em memória. As aulas 12 e 13 leem/gravam `produtos.json`; os testes
  dessas aulas criam e removem o mesmo recurso (id 6), de modo que `produtos.json` termina no
  estado-base (5 produtos, ids 1–5) ao final da execução.