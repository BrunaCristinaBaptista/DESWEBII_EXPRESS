# Documentação Aula 14 — Adicionando marca

- Criação de /**Aula14_Adicionando_marca.js (Cópia da aula13_api_completa.js)**
    
    ```jsx
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
```

```json
git branch -M main
git push -u origin main
```

Proximos passo: 

Mudança da documentação da lição disso:

```jsx
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
```

para:

```jsx
// Aula 14 — Adicionando marca
// O produto passa a ter o campo marca
// O req.body em POST e PUT passa a extrair marca, e o objeto persistido inclui marca: marca.trim().
//
// Validação  : O campo marca tem regras (obrigatório, string, não vazio, tamanho entre 2 e 50)
// Filtros    : Busca exata pelo nome da marca (case-insensitive)
// Busca      : search (parcial, case-insensitive, em 'nome' e 'marca')
// Ordenação  : permite ordenar pelo nome da marca
// Paginação  : page (padrão 1), page_size (padrão 10, máximo 100)
// Erros      : {"detail": "..."} ou {"detail": {campo: "mensagem"}}
// Persistência: produtos_14.json (fs/path); GET não grava; POST, PUT e DELETE gravam.
//
// Rodar servidor:
// node Aula14_adicionando_marca.js
```

Mudar tambem a função de validação, o que era: 

```jsx
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
```

passa a ser: 

```jsx
function validarProduto({ nome, preco, marca }) {
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
  return erros;
}

```

Rota get tbm totalmente modificada para ter o campo “marca”

```jsx
// Rota GET (coleção)
app.get('/api/produtos/', (req, res) => {
  const { search, marca, preco_minimo, preco_maximo, ordering, page, page_size } = req.query;

  const erros = {};
  if (preco_minimo !== undefined && preco_minimo !== "" && isNaN(Number(preco_minimo))) {
    erros.preco_minimo = "O valor deve ser numérico.";
  }
  if (preco_maximo !== undefined && preco_maximo !== "" && isNaN(Number(preco_maximo))) {
    erros.preco_maximo = "O valor deve ser numérico.";
  }
  
  const camposOrdenacao = ["nome", "preco", "marca"];
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

  if (search !== undefined && search !== "") {
  const termo = search.toLowerCase();
  resultado = resultado.filter(p =>
    p.nome.toLowerCase().includes(termo) ||
    (p.marca && p.marca.toLowerCase().includes(termo))
    );
  }
  if (marca !== undefined && marca !== "") {
  const termoMarca = marca.toLowerCase();
  resultado = resultado.filter(p => p.marca && p.marca.toLowerCase() === termoMarca);
  }

  // 4. Ordenação
  if (campoOrdenacao) {
    resultado.sort((a, b) => {
      let comparacao;
      if (campoOrdenacao === "preco") {
        comparacao = a.preco - b.preco;
      } else if (campoOrdenacao === "marca") {
        comparacao = a.marca.toLowerCase().localeCompare(b.marca.toLowerCase());
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
```

O mesmo com a parte da Rota POST

```jsx
// Rota POST (criação de recurso)
app.post('/api/produtos/', (req, res) => {
  const { nome, preco, marca } = req.body;

  const erros = validarProduto({ nome, preco, marca });
  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ detail: erros });
  }

  const novoId = produtos.length ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
  
  const novoProduto = {
    id: novoId,
    nome: nome.trim(),
    preco,
    marca: marca.trim(),
  };
  produtos.push(novoProduto);
  
  salvarProdutos(produtos);

  res.status(201).json(novoProduto);
});

```

Atualização tbm na rota put:

```jsx
app.put('/api/produtos/:id/', (req, res) => {
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ detail: "Produto não encontrado." });

  const { nome, preco, marca } = req.body;

  const erros = validarProduto({ nome, preco, marca });
  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ detail: erros });
  }

  // Substitui completamente os dados, mantendo o id
  produtos[index] = {
  id: parseInt(req.params.id),
  nome: nome.trim(),
  preco,
  marca: marca.trim()
};

  salvarProdutos(produtos);

  res.json(produtos[index]);
});
```

Modificação no /produtos_14.json

```jsx
[
  {
    "id": 1,
    "nome": "Pen drive 128 GB Kingston",
    "preco": 64.99
    "marca": "Kinston"
  },
  {
    "id": 2,
    "nome": "Impressora 3D",
    "preco": 5999.99,
    "marca": "Creality"
  },
  {
    "id": 3,
    "nome": "Notebook",
    "preco": 4999.99,
    "marca": "Lenovo"
  },
  {
    "id": 4,
    "nome": "Mouse USB",
    "preco": 39.99,
    "marca": "Logitech"
  },
  {
    "id": 5,
    "nome": "Teclado USB",
    "preco": 89.99,
    "marca": "Multilaser"
  },
  {
    "id": 6,
    "nome": "Monitor Ultra Wide",
    "preco": 899.99,
    "marca": "LG"
  },
  {
    "id": 7,
    "nome": "Mouse com fio",
    "preco": 9.99,
    "marca": "Positivo"
  },
  {
    "id": 8,
    "nome": "Teclado com fio",
    "preco": 30,
    "marca": "Dell"
  },
  {
    "id": 9,
    "nome": "Caneta Bic Azul",
    "preco": 1.99,
    "marca": "Bic"
  },
  {
    "id": 10,
    "nome": "Lápis 2B",
    "preco": 1.99,
    "marca": "Faber-Castell"
  },
  {
    "id": 11,
    "nome": "Caderno Universitário 200 folhas",
    "preco": 19.9,
    "marca": "Tilibra"
  },
  {
    "id": 12,
    "nome": "Apontador Duplo",
    "preco": 2.5,
    "marca": "Faber-Castell"
  },
  {
    "id": 13,
    "nome": "Borracha branca",
    "preco": 1.2,
    "marca": "Mercur"
  },
  {
    "id": 14,
    "nome": "Régua 30 cm",
    "preco": 3.9,
    "marca": "Acrimet"
  },
  {
    "id": 15,
    "nome": "Mochila Escolar",
    "preco": 129.9,
    "marca": "Jansport"
  },
  {
    "id": 16,
    "nome": "Tablet Android 10”",
    "preco": 1599.99,
    "marca": "Samsung"
  },
  {
    "id": 17,
    "nome": "Smartphone Android",
    "preco": 2399.99,
    "marca": "Motorola"
  },
  {
    "id": 18,
    "nome": "Carregador USB-C",
    "preco": 59.9,
    "marca": "Baseus"
  },
  {
    "id": 19,
    "nome": "Caixa de Som Bluetooth",
    "preco": 299.9,
    "marca": "JBL"
  },
  {
    "id": 20,
    "nome": "Fone de Ouvido Sem Fio",
    "preco": 499.9,
    "marca": "Sony"
  },
  {
    "id": 21,
    "nome": "Headset Gamer",
    "preco": 249.9,
    "marca": "HyperX"
  },
  {
    "id": 22,
    "nome": "HD Externo 1TB",
    "preco": 399.99,
    "marca": "Seagate"
  },
  {
    "id": 23,
    "nome": "SSD 512GB",
    "preco": 499.99,
    "marca": "Western Digital"
  },
  {
    "id": 24,
    "nome": "Placa de Vídeo RTX 4060",
    "preco": 2499.99,
    "marca": "NVIDIA"
  },
  {
    "id": 25,
    "nome": "Processador Ryzen 7",
    "preco": 1599.99,
    "marca": "AMD"
  },
  {
    "id": 26,
    "nome": "Memória RAM 16GB",
    "preco": 299.9,
    "marca": "Corsair"
  },
  {
    "id": 27,
    "nome": "Placa-mãe ASUS",
    "preco": 899.99,
    "marca": "ASUS"
  },
  {
    "id": 28,
    "nome": "Fonte 650W",
    "preco": 429.9,
    "marca": "Corsair"
  },
  {
    "id": 29,
    "nome": "Gabinete Gamer",
    "preco": 349.9,
    "marca": "NZXT"
  },
  {
    "id": 30,
    "nome": "Cooler para CPU",
    "preco": 599.9,
    "marca": "Cooler Master"
  },
  {
    "id": 31,
    "nome": "Smart TV 50”",
    "preco": 2799.9,
    "marca": "Samsung"
  },
  {
    "id": 32,
    "nome": "Controle Remoto Universal",
    "preco": 49.9,
    "marca": "Philips"
  },
  {
    "id": 33,
    "nome": "Impressora Multifuncional",
    "preco": 699.99,
    "marca": "Epson"
  },
  {
    "id": 34,
    "nome": "Scanner Portátil",
    "preco": 899.99,
    "marca": "Canon"
  },
  {
    "id": 35,
    "nome": "Projetor Full HD",
    "preco": 1999.99,
    "marca": "BenQ"
  },
  {
    "id": 36,
    "nome": "Lousa Branca 1x1m",
    "preco": 149.9,
    "marca": "Cortiarte"
  },
  {
    "id": 37,
    "nome": "Marcador de Quadro Branco",
    "preco": 19.9,
    "marca": "Pilot"
  },
  {
    "id": 38,
    "nome": "Post-it Amarelo",
    "preco": 12.9,
    "marca": "3M"
  },
  {
    "id": 39,
    "nome": "Clips de Papel",
    "preco": 5.9,
    "marca": "Tilibra"
  },
  {
    "id": 40,
    "nome": "Grampeador de Mesa",
    "preco": 29.9,
    "marca": "Tris"
  },
  {
    "id": 41,
    "nome": "Estabilizador 500VA",
    "preco": 249.9,
    "marca": "SMS"
  },
  {
    "id": 42,
    "nome": "Nobreak 1200VA",
    "preco": 1199.99,
    "marca": "APC"
  },
  {
    "id": 43,
    "nome": "Webcam Full HD",
    "preco": 349.9,
    "marca": "Logitech"
  },
  {
    "id": 44,
    "nome": "Microfone Condensador USB",
    "preco": 799.9,
    "marca": "Fifine"
  },
  {
    "id": 45,
    "nome": "Tripé Ajustável",
    "preco": 129.9,
    "marca": "Greika"
  },
  {
    "id": 46,
    "nome": "Notebook Gamer",
    "preco": 8999.99,
    "marca": "Acer"
  },
  {
    "id": 47,
    "nome": "Ultrabook Dell XPS",
    "preco": 7499.99,
    "marca": "Dell"
  },
  {
    "id": 48,
    "nome": "Chromebook Lenovo",
    "preco": 2299.9,
    "marca": "Lenovo"
  },
  {
    "id": 49,
    "nome": "MacBook Air M2",
    "preco": 10499.99,
    "marca": "Apple"
  },
  {
    "id": 50,
    "nome": "Servidor Torre",
    "preco": 14999.99,
    "marca": "HP"
  },
  {
    "id": 51,
    "nome": "Caixa Organizadora",
    "preco": 24.9,
    "marca": "Sanremo"
  },
  {
    "id": 52,
    "nome": "Estojo Escolar",
    "preco": 39.9,
    "marca": "DAC"
  },
  {
    "id": 53,
    "nome": "Tesoura Escolar",
    "preco": 7.9,
    "marca": "Tramontina"
  },
  {
    "id": 54,
    "nome": "Cola Branca 90g",
    "preco": 4.9,
    "marca": "Tenaz"
  },
  {
    "id": 55,
    "nome": "Agenda 2025",
    "preco": 59.9,
    "marca": "Foroni"
  },
  {
    "id": 56,
    "nome": "Plastificadora A4",
    "preco": 399.9,
    "marca": "Aurora"
  },
  {
    "id": 57,
    "nome": "Calculadora Científica",
    "preco": 129.9,
    "marca": "Casio"
  },
  {
    "id": 58,
    "nome": "Cadeira Gamer",
    "preco": 1199.99,
    "marca": "ThunderX3"
  },
  {
    "id": 59,
    "nome": "Mesa para Computador",
    "preco": 499.9,
    "marca": "Kappesberg"
  },
  {
    "id": 60,
    "nome": "Cadeira de Escritório",
    "preco": 699.9,
    "marca": "Flexform"
  }
]
```

node **Aula14_Adicionando_marca.js**

Feito os testes:

| **Cenário de Teste** | **Método** | **URL** | **Corpo (JSON)** | **Status Esperado** | **O que validar** |
| --- | --- | --- | --- | --- | --- |
| **01. Criar produto com marca válida** | POST | `/api/produtos/` | `{"nome": "Monitor Ultra", "preco": 1200.0, "marca": "Dell"}` | `201 Created` | Retorna produto com `id` gerado e `"marca": "Dell"` |
| **02. Criar com marca ausente** | POST | `/api/produtos/` | `{"nome": "Monitor Ultra", "preco": 1200.0}` | `400 Bad Request` | `detail.marca` indica campo obrigatório |
| **03. Criar com marca vazia/curta** | POST | `/api/produtos/` | `{"nome": "Monitor", "preco": 1000.0, "marca": " "}` | `400 Bad Request` | `detail.marca` indica erro de validação |
| **04. Atualizar marca via PUT** | PUT | `/api/produtos/1/` | `{"nome": "Notebook Pro", "preco": 3800.0, "marca": "Lenovo"}` | `200 OK` | Produto atualizado com a nova marca |
| **05. Filtrar por marca existente** | GET | `/api/produtos/?marca=Dell` | — | `200 OK` | Apenas produtos com marca Dell na lista |
| **06. Filtrar por marca inexistente** | GET | `/api/produtos/?marca=MarcaFantasma` | — | `200 OK` | `results` vazia (`[]`), `total_pages: 0` |
| **07. Combinar marca e preço** | GET | `/api/produtos/?marca=Dell&preco_minimo=2000` | — | `200 OK` | Produtos Dell com preço >= 2000 |
| **08. Ordenação crescente por marca** | GET | `/api/produtos/?ordering=marca` | — | `200 OK` | Lista em ordem alfabética de marca (A→Z) |
| **09. Ordenação decrescente por marca** | GET | `/api/produtos/?ordering=-marca` | — | `200 OK` | Lista em ordem reversa de marca (Z→A) |
| **10. Busca textual pela marca** | GET | `/api/produtos/?search=dell` | — | `200 OK` | Encontra produtos cuja marca contenha "dell" |
| **11. Busca sem resultados** | GET | `/api/produtos/?search=termoinexistente` | — | `200 OK` | `results` vazia |

# Documentação Aula 15 — Adicionando estoque

Criação de `/aula15_Adicionando_estoque.js` (Cópia da `/aula14_Adicionando_marca.js`)

Mudança nos comentários iniciais:

```jsx
// Aula 15 — Adicionando controle de estoque
// O produto passa a ter o campo 'estoque' (além da 'marca' adicionada na aula anterior).
// O req.body em POST e PUT passa a extrair 'estoque', salvando-o como um número inteiro.
//
// Validação  : O campo estoque é obrigatório, deve ser um número inteiro e não pode ser negativo.
// Filtros    : Adicionados 'estoque_minimo' e 'estoque_maximo' (aceitam apenas inteiros positivos).
// Busca      : search (parcial, case-insensitive, em 'nome' e 'marca').
// Ordenação  : permite ordenar por 'nome', 'preco', 'marca' e agora também por 'estoque'.
// Paginação  : page (padrão 1), page_size (padrão 10, máximo 100).
// Erros      : {"detail": "..."} ou {"detail": {campo: "mensagem"}}.
// Persistência: produtos_15.json (fs/path); GET não grava; POST, PUT e DELETE gravam.
//
// Rodar servidor:
// node Aula15_adicionando_estoque.js
```

criação de `/produtos_15.json`  com a mudança na estrutura:

```jsx
[
  {
    "id": 1,
    "nome": "Notebook Pro",
    "preco": 3800,
    "marca": "Lenovo",
    "estoque": 15
  },
  {
    "id": 2,
    "nome": "Impressora 3D",
    "preco": 5999.99,
    "marca": "Creality",
    "estoque": 5
  },
  {
    "id": 3,
    "nome": "Notebook",
    "preco": 4999.99,
    "marca": "Lenovo",
    "estoque": 12
  },
  {
    "id": 4,
    "nome": "Mouse USB",
    "preco": 39.99,
    "marca": "Logitech",
    "estoque": 150
  },
  {
    "id": 5,
    "nome": "Teclado USB",
    "preco": 89.99,
    "marca": "Multilaser",
    "estoque": 80
  },
  {
    "id": 6,
    "nome": "Monitor Ultra Wide",
    "preco": 899.99,
    "marca": "LG",
    "estoque": 25
  },
  {
    "id": 7,
    "nome": "Mouse com fio",
    "preco": 9.99,
    "marca": "Positivo",
    "estoque": 200
  },
  {
    "id": 8,
    "nome": "Teclado com fio",
    "preco": 30,
    "marca": "Dell",
    "estoque": 100
  },
  {
    "id": 9,
    "nome": "Caneta Bic Azul",
    "preco": 1.99,
    "marca": "Bic",
    "estoque": 500
  },
  {
    "id": 10,
    "nome": "Lápis 2B",
    "preco": 1.99,
    "marca": "Faber-Castell",
    "estoque": 450
  },
  {
    "id": 11,
    "nome": "Caderno Universitário 200 folhas",
    "preco": 19.9,
    "marca": "Tilibra",
    "estoque": 300
  },
  {
    "id": 12,
    "nome": "Apontador Duplo",
    "preco": 2.5,
    "marca": "Faber-Castell",
    "estoque": 120
  },
  {
    "id": 13,
    "nome": "Borracha branca",
    "preco": 1.2,
    "marca": "Mercur",
    "estoque": 600
  },
  {
    "id": 14,
    "nome": "Régua 30 cm",
    "preco": 3.9,
    "marca": "Acrimet",
    "estoque": 180
  },
  {
    "id": 15,
    "nome": "Mochila Escolar",
    "preco": 129.9,
    "marca": "Jansport",
    "estoque": 45
  },
  {
    "id": 16,
    "nome": "Tablet Android 10”",
    "preco": 1599.99,
    "marca": "Samsung",
    "estoque": 30
  },
  {
    "id": 17,
    "nome": "Smartphone Android",
    "preco": 2399.99,
    "marca": "Motorola",
    "estoque": 55
  },
  {
    "id": 18,
    "nome": "Carregador USB-C",
    "preco": 59.9,
    "marca": "Baseus",
    "estoque": 210
  },
  {
    "id": 19,
    "nome": "Caixa de Som Bluetooth",
    "preco": 299.9,
    "marca": "JBL",
    "estoque": 85
  },
  {
    "id": 20,
    "nome": "Fone de Ouvido Sem Fio",
    "preco": 499.9,
    "marca": "Sony",
    "estoque": 140
  },
  {
    "id": 21,
    "nome": "Headset Gamer",
    "preco": 249.9,
    "marca": "HyperX",
    "estoque": 65
  },
  {
    "id": 22,
    "nome": "HD Externo 1TB",
    "preco": 399.99,
    "marca": "Seagate",
    "estoque": 90
  },
  {
    "id": 23,
    "nome": "SSD 512GB",
    "preco": 499.99,
    "marca": "Western Digital",
    "estoque": 110
  },
  {
    "id": 24,
    "nome": "Placa de Vídeo RTX 4060",
    "preco": 2499.99,
    "marca": "NVIDIA",
    "estoque": 18
  },
  {
    "id": 25,
    "nome": "Processador Ryzen 7",
    "preco": 1599.99,
    "marca": "AMD",
    "estoque": 40
  },
  {
    "id": 26,
    "nome": "Memória RAM 16GB",
    "preco": 299.9,
    "marca": "Corsair",
    "estoque": 150
  },
  {
    "id": 27,
    "nome": "Placa-mãe ASUS",
    "preco": 899.99,
    "marca": "ASUS",
    "estoque": 35
  },
  {
    "id": 28,
    "nome": "Fonte 650W",
    "preco": 429.9,
    "marca": "Corsair",
    "estoque": 70
  },
  {
    "id": 29,
    "nome": "Gabinete Gamer",
    "preco": 349.9,
    "marca": "NZXT",
    "estoque": 50
  },
  {
    "id": 30,
    "nome": "Cooler para CPU",
    "preco": 599.9,
    "marca": "Cooler Master",
    "estoque": 60
  },
  {
    "id": 31,
    "nome": "Smart TV 50”",
    "preco": 2799.9,
    "marca": "Samsung",
    "estoque": 15
  },
  {
    "id": 32,
    "nome": "Controle Remoto Universal",
    "preco": 49.9,
    "marca": "Philips",
    "estoque": 130
  },
  {
    "id": 33,
    "nome": "Impressora Multifuncional",
    "preco": 699.99,
    "marca": "Epson",
    "estoque": 25
  },
  {
    "id": 34,
    "nome": "Scanner Portátil",
    "preco": 899.99,
    "marca": "Canon",
    "estoque": 12
  },
  {
    "id": 35,
    "nome": "Projetor Full HD",
    "preco": 1999.99,
    "marca": "BenQ",
    "estoque": 8
  },
  {
    "id": 36,
    "nome": "Lousa Branca 1x1m",
    "preco": 149.9,
    "marca": "Cortiarte",
    "estoque": 20
  },
  {
    "id": 37,
    "nome": "Marcador de Quadro Branco",
    "preco": 19.9,
    "marca": "Pilot",
    "estoque": 250
  },
  {
    "id": 38,
    "nome": "Post-it Amarelo",
    "preco": 12.9,
    "marca": "3M",
    "estoque": 400
  },
  {
    "id": 39,
    "nome": "Clips de Papel",
    "preco": 5.9,
    "marca": "Tilibra",
    "estoque": 350
  },
  {
    "id": 40,
    "nome": "Grampeador de Mesa",
    "preco": 29.9,
    "marca": "Tris",
    "estoque": 85
  },
  {
    "id": 41,
    "nome": "Estabilizador 500VA",
    "preco": 249.9,
    "marca": "SMS",
    "estoque": 60
  },
  {
    "id": 42,
    "nome": "Nobreak 1200VA",
    "preco": 1199.99,
    "marca": "APC",
    "estoque": 10
  },
  {
    "id": 43,
    "nome": "Webcam Full HD",
    "preco": 349.9,
    "marca": "Logitech",
    "estoque": 45
  },
  {
    "id": 44,
    "nome": "Microfone Condensador USB",
    "preco": 799.9,
    "marca": "Fifine",
    "estoque": 30
  },
  {
    "id": 45,
    "nome": "Tripé Ajustável",
    "preco": 129.9,
    "marca": "Greika",
    "estoque": 75
  },
  {
    "id": 46,
    "nome": "Notebook Gamer",
    "preco": 8999.99,
    "marca": "Acer",
    "estoque": 12
  },
  {
    "id": 47,
    "nome": "Ultrabook Dell XPS",
    "preco": 7499.99,
    "marca": "Dell",
    "estoque": 7
  },
  {
    "id": 48,
    "nome": "Chromebook Lenovo",
    "preco": 2299.9,
    "marca": "Lenovo",
    "estoque": 28
  },
  {
    "id": 49,
    "nome": "MacBook Air M2",
    "preco": 10499.99,
    "marca": "Apple",
    "estoque": 14
  },
  {
    "id": 50,
    "nome": "Servidor Torre",
    "preco": 14999.99,
    "marca": "HP",
    "estoque": 4
  },
  {
    "id": 51,
    "nome": "Caixa Organizadora",
    "preco": 24.9,
    "marca": "Sanremo",
    "estoque": 150
  },
  {
    "id": 52,
    "nome": "Estojo Escolar",
    "preco": 39.9,
    "marca": "DAC",
    "estoque": 90
  },
  {
    "id": 53,
    "nome": "Tesoura Escolar",
    "preco": 7.9,
    "marca": "Tramontina",
    "estoque": 180
  },
  {
    "id": 54,
    "nome": "Cola Branca 90g",
    "preco": 4.9,
    "marca": "Tenaz",
    "estoque": 220
  },
  {
    "id": 55,
    "nome": "Agenda 2025",
    "preco": 59.9,
    "marca": "Foroni",
    "estoque": 160
  },
  {
    "id": 56,
    "nome": "Plastificadora A4",
    "preco": 399.9,
    "marca": "Aurora",
    "estoque": 15
  },
  {
    "id": 57,
    "nome": "Calculadora Científica",
    "preco": 129.9,
    "marca": "Casio",
    "estoque": 85
  },
  {
    "id": 58,
    "nome": "Cadeira Gamer",
    "preco": 1199.99,
    "marca": "ThunderX3",
    "estoque": 22
  },
  {
    "id": 59,
    "nome": "Mesa para Computador",
    "preco": 499.9,
    "marca": "Kappesberg",
    "estoque": 18
  },
  {
    "id": 60,
    "nome": "Cadeira de Escritório",
    "preco": 699.9,
    "marca": "Flexform",
    "estoque": 35
  },
  {
    "id": 61,
    "nome": "Monitor Ultra",
    "preco": 1200,
    "marca": "Dell",
    "estoque": 20
  }
]
```

mudança para ligar ao /produtos_15.json e não no /produtos_14.json

```jsx
const ARQUIVO = path.join(__dirname, 'produtos_15.json');
```

mudança na ROTA POST

```jsx
// Rota POST (criação de recurso)
app.post('/api/produtos/', (req, res) => {
  const { nome, preco, marca } = req.body;

  const erros = validarProduto({ nome, preco, marca });
  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ detail: erros });
  }

  const novoId = produtos.length ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
  
  const novoProduto = {
    id: novoId,
    nome: nome.trim(),
    preco,
    marca: marca.trim(),
  };
  produtos.push(novoProduto);
  
  salvarProdutos(produtos);

  res.status(201).json(novoProduto);
});
```

Para:

```jsx
app.post('/api/produtos/', (req, res) => {
  const { nome, preco, marca, estoque } = req.body;

  const erros = validarProduto({ nome, preco, marca, estoque });
  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ detail: erros });
}

  const novoId = produtos.length ? Math.max(...produtos.map(p => p.id)) + 1 : 1;
  
  const novoProduto = {
  id: novoId,
  nome: nome.trim(),
  preco,
  marca: marca.trim(),
  estoque: Number(estoque),
};
	produtos.push(novoProduto);
  
  salvarProdutos(produtos);

  res.status(201).json(novoProduto);
});
```

Mudança na rota PUT:

```jsx
// Rota PUT (atualização completa do recurso)
app.put('/api/produtos/:id/', (req, res) => {
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ detail: "Produto não encontrado." });

  const { nome, preco, marca } = req.body;

  const erros = validarProduto({ nome, preco, marca });
  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ detail: erros });
  }

  // Substitui completamente os dados, mantendo o id
  produtos[index] = {
  id: parseInt(req.params.id),
  nome: nome.trim(),
  preco,
  marca: marca.trim()
};

  salvarProdutos(produtos);

  res.json(produtos[index]);
});
```

Para:

```jsx
// Rota PUT (atualização completa do recurso)
app.put('/api/produtos/:id/', (req, res) => {
  const index = produtos.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ detail: "Produto não encontrado." });

  const { nome, preco, marca, estoque } = req.body;

  const erros = validarProduto({ nome, preco, marca, estoque });
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
};

  salvarProdutos(produtos);

  res.json(produtos[index]);
});

```

arrumar a função ValidarProduto:

```jsx
function validarProduto({ nome, preco, marca, estoque }) {

```

e acrescentar: 

```jsx
// Validação de estoque
if (estoque === undefined) {
  erros.estoque = "O campo é obrigatório.";
} else if (typeof estoque !== "number" || !Number.isInteger(estoque)) {
  erros.estoque = "O campo deve ser um número inteiro.";
} else if (estoque < 0) {
  erros.estoque = "O estoque não pode ser negativo.";
}
```

mudanda na Rota GET e camposOrdenacao

```jsx
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

  const camposOrdenacao = ["nome", "preco", "marca", "estoque"];
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
    resultado = resultado.filter((p) => p.estoque >= parseInt(estoque_minimo, 10));
  }
  if (estoque_maximo !== undefined && estoque_maximo !== "") {
    resultado = resultado.filter((p) => p.estoque <= parseInt(estoque_maximo, 10));
  }

  if (search !== undefined && search !== "") {
    const termo = search.toLowerCase();
    resultado = resultado.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        (p.marca && p.marca.toLowerCase().includes(termo)),
    );
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
```

```bash
node aula15_Adicionando_estoque.js
```

testes:

| **Cenário de Teste** | **Método** | **URL** | **Corpo (JSON)** | **Status Esperado** | **O que validar** |
| --- | --- | --- | --- | --- | --- |
| **01. Criar com estoque válido** | POST | `/api/produtos/` | `{"nome": "Mouse Sem Fio", "preco": 80.0, "marca": "Logitech", "estoque": 25}` | `201 Created` | Retorna produto com `"estoque": 25` |
| **02. Criar com estoque zero** | POST | `/api/produtos/` | `{"nome": "Teclado Mecânico", "preco": 250.0, "marca": "Keychron", "estoque": 0}` | `201 Created` | Sucesso (`estoque: 0` é válido) |
| **03. Criar com estoque negativo** | POST | `/api/produtos/` | `{"nome": "Fone", "preco": 150.0, "marca": "Sony", "estoque": -5}` | `400 Bad Request` | `detail.estoque` avisa que não pode ser negativo |
| **04. Criar com tipo inválido** | POST | `/api/produtos/` | `{"nome": "Fone", "preco": 150.0, "marca": "Sony", "estoque": "muitos"}` | `400 Bad Request` | `detail.estoque` avisa que deve ser inteiro |
| **05. Filtrar por estoque mínimo** | GET | `/api/produtos/?estoque_minimo=10` | — | `200 OK` | Apenas produtos com estoque >= 10 |
| **06. Filtrar por estoque máximo** | GET | `/api/produtos/?estoque_maximo=5` | — | `200 OK` | Apenas produtos com estoque <= 5 (itens acabando) |
| **07. Filtrar por faixa de estoque** | GET | `/api/produtos/?estoque_minimo=10&estoque_maximo=30` | — | `200 OK` | Apenas produtos no intervalo [10, 30] |
| **08. Ordenar crescente por estoque** | GET | `/api/produtos/?ordering=estoque` | — | `200 OK` | Do menor estoque para o maior |
| **09. Ordenar decrescente por estoque** | GET | `/api/produtos/?ordering=-estoque` | — | `200 OK` | Do maior estoque para o menor |
| **10. Combinar marca, preço e estoque** | GET | `/api/produtos/?marca=Dell&preco_minimo=1000&estoque_minimo=1` | — | `200 OK` | Produtos Dell caros que estão disponíveis |

[http://127.0.0.1:3000/api/produtos/](http://127.0.0.1:3000/api/produtos/)