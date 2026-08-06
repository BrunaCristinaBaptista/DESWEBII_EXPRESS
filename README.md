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