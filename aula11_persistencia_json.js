// Aula 11 — Persistência JSON
// Até aqui os dados estavam em memória (definidos no próprio código).
// Nesta aula eles passam a ser carregados e salvos em um arquivo JSON (produtos.json),
// que contém os 60 produtos-base.
//
//   GET    /api/produtos/          lista array simples (filtros, busca, ordenação)
//   GET    /api/produtos/:id/      produto individual
//   POST   /api/produtos/          cria produto (201) e grava no arquivo
//   PUT    /api/produtos/:id/      atualiza produto por completo (200) e grava
//   DELETE /api/produtos/:id/      remove produto (204 sem corpo) e grava
//
// Ainda não há paginação aqui: a coleção é devolvida como um array simples.
//
// Rodar servidor:
// node aula11_persistencia_json.js

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

// Rota GET (coleção): carrega os produtos e aplica filtros, busca e ordenação,
// devolvendo um array simples. GET não altera nem salva o arquivo.
app.get('/api/produtos/', (req, res) => {
  const { search, preco_minimo, preco_maximo, ordering } = req.query;

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

  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ detail: erros });
  }

  // Opera sobre uma cópia da coleção
  let resultado = [...produtos];

  // Filtros por preço
  if (preco_minimo !== undefined && preco_minimo !== "") {
    resultado = resultado.filter(p => p.preco >= Number(preco_minimo));
  }
  if (preco_maximo !== undefined && preco_maximo !== "") {
    resultado = resultado.filter(p => p.preco <= Number(preco_maximo));
  }

  // Busca por nome (parcial e case-insensitive)
  if (search !== undefined && search !== "") {
    const termo = search.toLowerCase();
    resultado = resultado.filter(p => p.nome.toLowerCase().includes(termo));
  }

  // Ordenação
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

  res.json(resultado);
});

// Rota GET por ID (parâmetro de rota)
app.get('/api/produtos/:id/', (req, res) => {
  const produto = produtos.find(p => p.id === parseInt(req.params.id));
  if (!produto) return res.status(404).json({ detail: "Produto não encontrado." });
  res.json(produto);
});

// Rota POST (criação de recurso)
// Ex.: POST /api/produtos/  body {"nome":"Webcam","preco":199.99} -> 201, grava em produtos.json (Aula 11)
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
// Ex.: PUT /api/produtos/61/  body {"nome":"Webcam Pro","preco":299} -> 200, grava em produtos.json (Aula 11)
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
// Ex.: DELETE /api/produtos/61/ -> 204, grava (remove) em produtos.json (Aula 11)
app.delete('/api/produtos/:id/', (req, res) => {
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ detail: "Produto não encontrado." });

  produtos.splice(index, 1);
  salvarProdutos(produtos);

  res.status(204).end();
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));

// Rodar servidor:
// node aula11_persistencia_json.js