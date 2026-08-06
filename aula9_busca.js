const express = require('express');
const app = express();

app.use(express.json());

// Coleção de produtos em memória
let produtos = [
  {id: 1, nome: "Notebook", preco: 3500},
  {id: 2, nome: "Mouse", preco: 80},
  {id: 3, nome: "Teclado", preco: 150},
  {id: 4, nome: "Monitor", preco: 1200},
  {id: 5, nome: "Impressora", preco: 300}
];

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

// Rota GET (coleção), com filtros por preço e busca por nome
app.get('/api/produtos/', (req, res) => {
  const { search, preco_minimo, preco_maximo } = req.query;

  const erros = {};
  if (preco_minimo !== undefined && preco_minimo !== "" && isNaN(Number(preco_minimo))) {
    erros.preco_minimo = "O valor deve ser numérico.";
  }
  if (preco_maximo !== undefined && preco_maximo !== "" && isNaN(Number(preco_maximo))) {
    erros.preco_maximo = "O valor deve ser numérico.";
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

  res.json(resultado);
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

  // Gera um id incremental com base nos produtos existentes
  const novoId = produtos.length ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
  const novoProduto = { id: novoId, nome: nome.trim(), preco };

  produtos.push(novoProduto);

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

  res.json(produtos[index]);
});

// Rota DELETE (remoção de recurso)
app.delete('/api/produtos/:id/', (req, res) => {
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ detail: "Produto não encontrado." });

  produtos.splice(index, 1);

  res.status(204).end();
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));

// Rodar servidor:
// node aula9_busca.js