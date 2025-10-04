const express = require('express');
const path = require('path');


const productsRouter = require('./routers/products.router');
const cartsRouter = require('./routers/carts.router');

const app = express();
const PORT = 8080;


app.use(express.json());


app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);


app.get('/', (req, res) => {
  res.send('API de productos y carritos - puerto 8080');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
