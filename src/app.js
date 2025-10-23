const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');              
const http = require('http');                                   
const { Server } = require('socket.io');                        

const productsRouter = require('./routers/products.router');
const cartsRouter = require('./routers/carts.router');
const viewsRouter = require('./routers/views.router');          

const ProductManager = require('./../src/managers/ProductManager'); 
const pm = new ProductManager();                                 

const app = express();
const server = http.createServer(app);                           
const io = new Server(server);                                   

const PORT = process.env.PORT || 8080;

// ------- Handlebars 
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));


app.use(express.static(path.join(__dirname, 'public')));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.set('io', io);                                             

// ------- Routers
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);                                      


app.get('/', (req, res) => {
  res.send('API de productos y carritos - puerto 8080');
});


io.on('connection', async (socket) => {
  
  const products = await pm.getProducts();
  socket.emit('products:update', products);

  // Crear producto desde WS
  socket.on('product:add', async (payload) => {
    try {
      await pm.addProduct(payload);
      io.emit('products:update', await pm.getProducts());
    } catch (e) {
      socket.emit('products:error', e.message);
    }
  });

  // Eliminar producto desde 
  socket.on('product:delete', async (id) => {
    try {
      await pm.deleteProduct(id);
      io.emit('products:update', await pm.getProducts());
    } catch (e) {
      socket.emit('products:error', e.message);
    }
  });
});

// -- Levantar servidor 
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
