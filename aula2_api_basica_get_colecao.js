const express = require('express');
const app = express();

app.use(express.json());

// Rota GET (coleção)
// Ex.: GET /api/produtos/  (teste Bruno: Aula 02 -> 01 - listar todos)
app.get('/api/produtos/', (req, res) => {
  res.json([
    {id: 1, nome: "Notebook", preco: 3500},
    {id: 2, nome: "Mouse", preco: 80},
    {id: 3, nome: "Teclado", preco: 150},
    {id: 4, nome: "Monitor", preco: 1200},
    {id: 5, nome: "Impressora", preco: 300}
  ]);
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));

// Rodar servidor:
// node aula2_api_basica_get_colecao.js