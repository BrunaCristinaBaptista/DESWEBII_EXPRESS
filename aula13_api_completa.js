// Aula 13 — API completa
// Consolidação final da sequência didática (Aulas 2 a 12).
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