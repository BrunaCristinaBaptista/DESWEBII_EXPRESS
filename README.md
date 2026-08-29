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
  
  
  # Documentação Aula 14 — Adicionando marca

- Criação de /**Aula14_Adicionando_marca.js (Cópia da aula13_api_completa.js)**
    
    ```json
    // Aula 13 — API completa
    // Consolidação final da sequência didática (Aulas 2 a 12), sem conceito novo.
    // Reúne em um único arquivo todos os conceitos trabalhados:
    //
    //   GET    /api/produtos/          lista paginada (filtros, busca, ordenação, paginação)
    //   GET    /api/produtos/:id/      produto individual
    //   POST   /api/produtos/          cria produto (201)
    //   PUT    /api/produtos/:id/      atualiza produto por completo (200)
    //   DELETE /api/produtos/:id/      remove produto (204 sem corpo)
    //
    // Validação  : nome (obrigatório, string, trim, 2–100) e preco (obrigatório, numérico, >0, ≤2 casas)
    // Filtros    : preco_minimo, preco_maximo
    // Busca      : search (parcial, case-insensitive, em 'nome')
    // Ordenação  : ordering (nome, preco; prefixo '-' = decrescente)
    // Paginação  : page (padrão 1), page_size (padrão 10, máximo 100)
    //              resposta { page, page_size, total_pages, results }
    // Erros      : {"detail": "..."} ou {"detail": {campo: "mensagem"}}
    // Persistência: produtos.json (fs/path); GET não grava; POST, PUT e DELETE gravam.
    //
    // Rodar servidor:
    // node aula13_api_completa.js
    
    const express = require('express');
    const fs = require('fs');
    const path = require('path');
    const app = express();
    
    app.use(express.json());
    
    // Caminho do arquivo de persistência
    const ARQUIVO = path.join(__dirname, 'produtos.json');
    
    // Carrega os produtos do arquivo JSON
    function carregarProdutos() {
      // Se o arquivo não existir, cria com coleção vazia
      if (!fs.existsSync(ARQUIVO)) {
        salvarProdutos([]);
        return [];
      }
    
      try {
        const conteudo = fs.readFileSync(ARQUIVO, 'utf-8');
        const dados = JSON.parse(conteudo);
        // JSON inválido ou vazio cai no catch; não-array também vira coleção vazia
        return Array.isArray(dados) ? dados : [];
      } catch (erro) {
        return [];
      }
    }
    
    // Grava a coleção no arquivo JSON (indentado, UTF-8)
    function salvarProdutos(lista) {
      fs.writeFileSync(ARQUIVO, JSON.stringify(lista, null, 2), 'utf-8');
    }
    
    // Coleção de produtos carregada do arquivo
    let produtos = carregarProdutos();
    
    // Função de validação (retorna { campo: mensagem }; vazio = válido)
    function validarProduto({ nome, preco }) {
      const erros = {};
    
      // Nome: obrigatório, string, trim, não vazio, 2 a 100 caracteres
      if (nome === undefined) {
        erros.nome = "O campo é obrigatório.";
      } else if (typeof nome !== "string") {
        erros.nome = "O campo deve ser uma string.";
      } else {
        const nomeLimpo = nome.trim();
        if (nomeLimpo === "") {
          erros.nome = "O campo não pode ser vazio.";
        } else if (nomeLimpo.length < 2 || nomeLimpo.length > 100) {
          erros.nome = "O nome deve possuir entre 2 e 100 caracteres.";
        }
      }
    
      // Preço: obrigatório, numérico, maior que zero, no máximo 2 casas decimais
      if (preco === undefined) {
        erros.preco = "O campo é obrigatório.";
      } else if (typeof preco !== "number" || Number.isNaN(preco)) {
        erros.preco = "O campo deve ser numérico.";
      } else if (preco <= 0) {
        erros.preco = "O preço deve ser maior que zero.";
      } else if (Number(preco.toFixed(2)) !== preco) {
        erros.preco = "O campo deve ter no máximo 2 casas decimais.";
      }
    
      return erros;
    }
    
    // Rota GET (coleção), com filtros, busca, ordenação e paginação
    // GET não altera nem salva o arquivo
    app.get('/api/produtos/', (req, res) => {
      const { search, preco_minimo, preco_maximo, ordering, page, page_size } = req.query;
    
      const erros = {};
      if (preco_minimo !== undefined && preco_minimo !== "" && isNaN(Number(preco_minimo))) {
        erros.preco_minimo = "O valor deve ser numérico.";
      }
      if (preco_maximo !== undefined && preco_maximo !== "" && isNaN(Number(preco_maximo))) {
        erros.preco_maximo = "O valor deve ser numérico.";
      }
    
      // Ordenação: apenas 'nome' e 'preco' são permitidos; '-' indica decrescente
      const camposOrdenacao = ["nome", "preco"];
      let campoOrdenacao = null;
      let ordemDesc = false;
      if (ordering !== undefined && ordering !== "") {
        const valor = ordering.startsWith("-") ? ordering.slice(1) : ordering;
        const desc = ordering.startsWith("-");
        if (!camposOrdenacao.includes(valor)) {
          erros.ordering = "Campo de ordenação inválido.";
        } else {
          campoOrdenacao = valor;
          ordemDesc = desc;
        }
      }
    
      // Paginação: page (padrão 1) e page_size (padrão 10, máximo 100)
      let pagina = 1;
      let tamanhoPagina = 10;
      if (page !== undefined && page !== "") {
        if (!/^[1-9][0-9]*$/.test(page)) {
          erros.page = "O campo page deve ser um inteiro positivo.";
        } else {
          pagina = parseInt(page, 10);
        }
      }
      if (page_size !== undefined && page_size !== "") {
        if (!/^[1-9][0-9]*$/.test(page_size)) {
          erros.page_size = "O campo page_size deve ser um inteiro positivo.";
        } else {
          tamanhoPagina = parseInt(page_size, 10);
          if (tamanhoPagina > 100) {
            erros.page_size = "O campo page_size não pode passar de 100.";
          }
        }
      }
    
      if (Object.keys(erros).length > 0) {
        return res.status(400).json({ detail: erros });
      }
    
      // 1. Copia a coleção
      let resultado = [...produtos];
    
      // 2. Filtros por preço
      if (preco_minimo !== undefined && preco_minimo !== "") {
        resultado = resultado.filter(p => p.preco >= Number(preco_minimo));
      }
      if (preco_maximo !== undefined && preco_maximo !== "") {
        resultado = resultado.filter(p => p.preco <= Number(preco_maximo));
      }
    
      // 3. Busca por nome (parcial e case-insensitive)
      if (search !== undefined && search !== "") {
        const termo = search.toLowerCase();
        resultado = resultado.filter(p => p.nome.toLowerCase().includes(termo));
      }
    
      // 4. Ordenação
      if (campoOrdenacao) {
        resultado.sort((a, b) => {
          let comparacao;
          if (campoOrdenacao === "preco") {
            comparacao = a.preco - b.preco;
          } else {
            comparacao = a.nome.toLowerCase().localeCompare(b.nome.toLowerCase());
          }
          return ordemDesc ? -comparacao : comparacao;
        });
      }
    
      // 5. total_pages calculado sobre o total já filtrado/pesquisado/ordenado
      const totalParaPaginacao = resultado.length;
      const totalPages = Math.ceil(totalParaPaginacao / tamanhoPagina);
    
      // 6. Aplica o corte da página (slice)
      const inicio = (pagina - 1) * tamanhoPagina;
      const itensDaPagina = resultado.slice(inicio, inicio + tamanhoPagina);
    
      res.json({ page: pagina, page_size: tamanhoPagina, total_pages: totalPages, results: itensDaPagina });
    });
    
    // Rota GET por ID (parâmetro de rota)
    app.get('/api/produtos/:id/', (req, res) => {
      const produto = produtos.find(p => p.id === parseInt(req.params.id));
      if (!produto) return res.status(404).json({ detail: "Produto não encontrado." });
      res.json(produto);
    });
    
    // Rota POST (criação de recurso)
    app.post('/api/produtos/', (req, res) => {
      const { nome, preco } = req.body;
    
      const erros = validarProduto({ nome, preco });
      if (Object.keys(erros).length > 0) {
        return res.status(400).json({ detail: erros });
      }
    
      // Gera um id incremental com base nos produtos atuais (persistidos)
      const novoId = produtos.length ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
      const novoProduto = { id: novoId, nome: nome.trim(), preco };
    
      produtos.push(novoProduto);
      salvarProdutos(produtos);
    
      res.status(201).json(novoProduto);
    });
    
    // Rota PUT (atualização completa do recurso)
    app.put('/api/produtos/:id/', (req, res) => {
      const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
      if (index === -1) return res.status(404).json({ detail: "Produto não encontrado." });
    
      const { nome, preco } = req.body;
    
      const erros = validarProduto({ nome, preco });
      if (Object.keys(erros).length > 0) {
        return res.status(400).json({ detail: erros });
      }
    
      // Substitui completamente os dados, mantendo o id
      produtos[index] = { id: parseInt(req.params.id), nome: nome.trim(), preco };
      salvarProdutos(produtos);
    
      res.json(produtos[index]);
    });
    
    // Rota DELETE (remoção de recurso)
    app.delete('/api/produtos/:id/', (req, res) => {
      const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
      if (index === -1) return res.status(404).json({ detail: "Produto não encontrado." });
    
      produtos.splice(index, 1);
      salvarProdutos(produtos);
    
      res.status(204).end();
    });
    
    app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
    ```
    

No terminal digitar o seguinte código: 

```bash
cp produtos.json produtos_14.json
```

Fazer mudando no primeiro código, na parte :

```json
const ARQUIVO = path.join(__dirname, 'produtos.json');
```

Substitui por:

```json
const ARQUIVO = path.join(__dirname, 'produtos_14.json');
```

Adicionando no GIT:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "feat: preparação para os exercicios (aula 14 em diante)”
```

```bash
git remote set-url origin https://github.com/BrunaCristinaBaptista/DESWEBII_EXPRESS.git
git branch -M main
git push -u origin main
```
