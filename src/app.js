
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');

// Routers
const productsRouter = require('./routers/products.router');
const cartsRouter = require('./routers/carts.router');
const viewsRouter = require('./routers/views.router');
const sessionsRouter = require('./routers/sessions.router');

// ProductManager 
const ProductManager = require('./../src/managers/ProductManager');
const pm = new ProductManager();

// -------------------- ENV & DB --------------------
require('dotenv').config();
const mongoose = require('mongoose');

// MongoDB
(async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('Falta MONGO_URI en el archivo .env');

    await mongoose.connect(uri, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ Conectado a MongoDB Atlas en:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
  }
})();

// -------------------- APP & SERVER --------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

// -------------------- PASSPORT --------------------
const passport = require('passport');
const { initializePassport } = require('./config/passport');

initializePassport();
app.use(passport.initialize());

// -------------------- HANDLEBARS --------------------
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// -------------------- STATIC --------------------
app.use(express.static(path.join(__dirname, 'public')));

// -------------------- MIDDLEWARES --------------------
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('io', io);

// -------------------- ROUTERS --------------------
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/', viewsRouter);

// -------------------- ROOT --------------------
app.get('/', (req, res) => {
  res.send('API de productos y carritos - puerto 8080');
});

// -------------------- PING DB --------------------
app.get('/ping-db', async (_req, res) => {
  try {
    const host = mongoose.connection?.host || 'desconocido';
    res.send(`Mongo OK (${host})`);
  } catch (e) {
    res.status(500).send('Mongo FAIL: ' + e.message);
  }
});

// -------------------- SOCKET.IO --------------------
io.on('connection', async (socket) => {
  const products = await pm.getProducts();
  socket.emit('products:update', products);

  socket.on('product:add', async (payload) => {
    try {
      await pm.addProduct(payload);
      io.emit('products:update', await pm.getProducts());
    } catch (e) {
      socket.emit('products:error', e.message);
    }
  });

  socket.on('product:delete', async (id) => {
    try {
      await pm.deleteProduct(id);
      io.emit('products:update', await pm.getProducts());
    } catch (e) {
      socket.emit('products:error', e.message);
    }
  });
});

// -------------------- DEV IMPORT MONGO --------------------
const fs = require('fs').promises;
const Product = require('./models/product.model');

app.post('/dev/import-products-from-json', async (req, res) => {
  try {
    const file = path.join(__dirname, '../data/products.json');
    const raw = await fs.readFile(file, 'utf8');
    const items = JSON.parse(raw);

    const ops = items.map(({ id, ...rest }) => ({
      updateOne: {
        filter: { code: rest.code },
        update: { $setOnInsert: rest },
        upsert: true,
      },
    }));

    const result = await Product.bulkWrite(ops, { ordered: false });

    res.json({
      inserted: result.upsertedCount ?? 0,
      upserts: result.upsertedIds ?? {},
      ok: true,
    });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo importar', details: err.message });
  }
});

// -------------------- START SERVER --------------------
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
