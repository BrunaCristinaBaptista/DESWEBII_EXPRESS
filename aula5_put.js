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

// Rota GET (coleção)
app.get('/api/produtos/', (req, res) => {
  res.json(produtos);
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

  // Gera um id incremental com base nos produtos existentes
  const novoId = produtos.length ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
  const novoProduto = { id: novoId, nome, preco };

  produtos.push(novoProduto);

  res.status(201).json(novoProduto);
});

// Rota PUT (atualização completa do recurso)
app.put('/api/produtos/:id/', (req, res) => {
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ detail: "Produto não encontrado." });

  const { nome, preco } = req.body;

  // Substitui completamente os dados, mantendo o id
  produtos[index] = { id: parseInt(req.params.id), nome, preco };

  res.json(produtos[index]);
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));

// Rodar servidor:
// node aula5_put.js
