const express = require('express');
const app = express();

app.use(express.json());

// Coleção de produtos em memória
const produtos = [
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

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));

// Rodar servidor:
// node aula3_get_por_id.js
