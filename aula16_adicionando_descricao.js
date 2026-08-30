// Aula 16 — Adicionando descrição do produto
// O produto passa a ter o campo 'descricao' (além de 'marca' e 'estoque').
// O req.body em POST e PUT extrai 'descricao', salvando-o como string (vazia por padrão).
//
// Validação  : O campo descricao, se fornecido, deve ser uma string e ter no máximo 500 caracteres.
// Filtros    : Mantidos os da aula anterior (estoque_minimo, estoque_maximo, preco_minimo, preco_maximo, marca).
// Busca      : search (parcial, case-insensitive, agora busca em 'nome', 'marca' e 'descricao').
// Ordenação  : permite ordenar por 'nome', 'preco', 'marca', 'estoque' e agora por 'descricao'.
// Paginação  : page (padrão 1), page_size (padrão 10, máximo 100).
// Erros      : {"detail": "..."} ou {"detail": {campo: "mensagem"}}.
// Persistência: produtos_16.json (fs/path); GET não grava; POST, PUT e DELETE gravam.
//
// Rodar servidor:
// node aula16_adicionando_descricao.js

const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(express.json());

// Caminho do arquivo de persistência
const ARQUIVO = path.join(__dirname, "produtos_16.json");

// Carrega os produtos do arquivo JSON
function carregarProdutos() {
  // Se o arquivo não existir, cria com coleção vazia
  if (!fs.existsSync(ARQUIVO)) {
    salvarProdutos([]);
    return [];
  }

  try {
    const conteudo = fs.readFileSync(ARQUIVO, "utf-8");
    const dados = JSON.parse(conteudo);
    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    return [];
  }
}

// Grava a coleção no arquivo JSON (indentado, UTF-8)
function salvarProdutos(lista) {
  fs.writeFileSync(ARQUIVO, JSON.stringify(lista, null, 2), "utf-8");
}

// Coleção de produtos carregada do arquivo
let produtos = carregarProdutos();

// Função de validação CORRIGIDA (agora recebe 'marca' como parâmetro)
function validarProduto({ nome, preco, marca, estoque, descricao }) {
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

  // Validação de marca
  if (marca === undefined) {
    erros.marca = "O campo é obrigatório.";
  } else if (typeof marca !== "string") {
    erros.marca = "O campo deve ser uma string.";
  } else {
    const marcaLimpa = marca.trim();
    if (marcaLimpa === "") {
      erros.marca = "O campo não pode ser vazio.";
    } else if (marcaLimpa.length < 2 || marcaLimpa.length > 50) {
      erros.marca = "A marca deve possuir entre 2 e 50 caracteres.";
    }
  }
  // Validação de estoque
  if (estoque === undefined) {
    erros.estoque = "O campo é obrigatório.";
  } else if (typeof estoque !== "number" || !Number.isInteger(estoque)) {
    erros.estoque = "O campo deve ser um número inteiro.";
  } else if (estoque < 0) {
    erros.estoque = "O estoque não pode ser negativo.";
  }
  return erros;
}

// Rota GET (coleção)
app.get("/api/produtos/", (req, res) => {
  const {
    search,
    estoque_minimo,
    estoque_maximo,
    marca,
    preco_minimo,
    preco_maximo,
    ordering,
    page,
    page_size,
    descricao,
  } = req.query;

  const erros = {};
  if (
    preco_minimo !== undefined &&
    preco_minimo !== "" &&
    isNaN(Number(preco_minimo))
  ) {
    erros.preco_minimo = "O valor deve ser numérico.";
  }
  if (
    preco_maximo !== undefined &&
    preco_maximo !== "" &&
    isNaN(Number(preco_maximo))
  ) {
    erros.preco_maximo = "O valor deve ser numérico.";
  }

  if (estoque_minimo !== undefined && estoque_minimo !== "") {
    if (!/^[0-9]+$/.test(estoque_minimo)) {
      erros.estoque_minimo = "O valor deve ser um número inteiro não negativo.";
    }
  }
  if (estoque_maximo !== undefined && estoque_maximo !== "") {
    if (!/^[0-9]+$/.test(estoque_maximo)) {
      erros.estoque_maximo = "O valor deve ser um número inteiro não negativo.";
    }
  }
  if (descricao !== undefined && descricao !== null) {
    if (typeof descricao !== "string") {
      erros.descricao = "O campo deve ser uma string.";
    } else if (descricao.trim().length > 500) {
      erros.descricao = "A descrição não pode ultrapassar 500 caracteres.";
    }
  }

  const camposOrdenacao = ["nome", "preco", "marca", "estoque", "descricao"];
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
    resultado = resultado.filter((p) => p.preco >= Number(preco_minimo));
  }
  if (preco_maximo !== undefined && preco_maximo !== "") {
    resultado = resultado.filter((p) => p.preco <= Number(preco_maximo));
  }
  if (estoque_minimo !== undefined && estoque_minimo !== "") {
    resultado = resultado.filter(
      (p) => p.estoque >= parseInt(estoque_minimo, 10),
    );
  }
  if (estoque_maximo !== undefined && estoque_maximo !== "") {
    resultado = resultado.filter(
      (p) => p.estoque <= parseInt(estoque_maximo, 10),
    );
  }

  if (search !== undefined && search !== "") {
  const termo = search.toLowerCase();
  resultado = resultado.filter(p => {
    const noNome = p.nome.toLowerCase().includes(termo);
    const naMarca = p.marca && p.marca.toLowerCase().includes(termo);
    const naDescricao = p.descricao && p.descricao.toLowerCase().includes(termo);
    return noNome || naMarca || naDescricao;
  });
}
  if (marca !== undefined && marca !== "") {
    const termoMarca = marca.toLowerCase();
    resultado = resultado.filter(
      (p) => p.marca && p.marca.toLowerCase() === termoMarca,
    );
  }

  // 4. Ordenação
  if (campoOrdenacao) {
    resultado.sort((a, b) => {
      let comparacao;
      if (campoOrdenacao === "preco") {
        comparacao = a.preco - b.preco;
      } else if (campoOrdenacao === "estoque") {
        comparacao = a.estoque - b.estoque;
      } else if (campoOrdenacao === "marca") {
        comparacao = a.marca.toLowerCase().localeCompare(b.marca.toLowerCase());
      } else if (campoOrdenacao === "descricao") {
        const descA = (a.descricao || "").toLowerCase();
        const descB = (b.descricao || "").toLowerCase();
        comparacao = descA.localeCompare(descB);
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

  res.json({
    page: pagina,
    page_size: tamanhoPagina,
    total_pages: totalPages,
    results: itensDaPagina,
  });
});

// Rota GET por ID (parâmetro de rota)
app.get("/api/produtos/:id/", (req, res) => {
  const produto = produtos.find((p) => p.id === parseInt(req.params.id));
  if (!produto)
    return res.status(404).json({ detail: "Produto não encontrado." });
  res.json(produto);
});

// Rota POST (criação de recurso)
app.post("/api/produtos/", (req, res) => {
  const { nome, preco, marca, estoque, descricao } = req.body;

  const erros = validarProduto({ nome, preco, marca, estoque, descricao });
  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ detail: erros });
  }

  const novoId = produtos.length
    ? Math.max(...produtos.map((p) => p.id)) + 1
    : 1;

  const novoProduto = {
    id: novoId,
    nome: nome.trim(),
    preco,
    marca: marca.trim(),
    estoque: Number(estoque),
    descricao:
      typeof descricao === "string" ? descricao.trim() : (descricao ?? ""),
  };

  produtos.push(novoProduto);

  salvarProdutos(produtos);

  res.status(201).json(novoProduto);
});

// Rota PUT (atualização completa do recurso)
app.put("/api/produtos/:id/", (req, res) => {
  const index = produtos.findIndex((p) => p.id === parseInt(req.params.id));
  if (index === -1)
    return res.status(404).json({ detail: "Produto não encontrado." });

  const { nome, preco, marca, estoque, descricao } = req.body;

  const erros = validarProduto({ nome, preco, marca, estoque, descricao });
  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ detail: erros });
  }

  // Substitui completamente os dados, mantendo o id
  produtos[index] = {
    id: parseInt(req.params.id),
    nome: nome.trim(),
    preco,
    marca: marca.trim(),
    estoque: Number(estoque),
    descricao:
      typeof descricao === "string" ? descricao.trim() : (descricao ?? ""),
  };

  salvarProdutos(produtos);

  res.json(produtos[index]);
});

// Rota DELETE (remoção de recurso)
app.delete("/api/produtos/:id/", (req, res) => {
  const index = produtos.findIndex((p) => p.id === parseInt(req.params.id));
  if (index === -1)
    return res.status(404).json({ detail: "Produto não encontrado." });

  produtos.splice(index, 1);
  salvarProdutos(produtos);

  res.status(204).end();
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
