// src/routers/carts.router.js
const express = require('express');
const passport = require('passport');
const { authorizeRoles } = require('../middlewares/authorization');

const CartsRepository = require('../repositories/carts.repository');
const ProductsRepository = require('../repositories/products.repository');
const TicketsRepository = require('../repositories/tickets.repository');

const router = express.Router();
const cartsRepo = new CartsRepository();
const productsRepo = new ProductsRepository();
const ticketsRepo = new TicketsRepository();


// ✅ Crear carrito (si querés dejarlo público o protegerlo, lo vemos después)
router.post('/', async (req, res) => {
  try {
    const cart = await cartsRepo.createCart();
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear carrito', details: err.message });
  }
});

// Ver productos del carrito
router.get('/:cid', async (req, res) => {
  try {
    const cart = await cartsRepo.getCartById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart.products);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer carrito', details: err.message });
  }
});

// ✅ Agregar producto al carrito (solo USER)
router.post(
  '/:cid/product/:pid',
  passport.authenticate('current', { session: false }),
  authorizeRoles('user'),
  async (req, res) => {
    try {
      const { cid, pid } = req.params;

      const product = await productsRepo.getProductById(pid);
      if (!product) return res.status(404).json({ error: 'Producto no existe' });

      const updatedCart = await cartsRepo.addProductToCart(cid, pid, 1);
      if (!updatedCart) return res.status(404).json({ error: 'Carrito no encontrado' });

      res.json(updatedCart);
    } catch (err) {
      res.status(500).json({ error: 'Error al agregar producto al carrito', details: err.message });
    }
  }
);

// -------------------- PURCHASE (solo USER) --------------------
router.post(
  '/:cid/purchase',
  passport.authenticate('current', { session: false }),
  authorizeRoles('user'),
  async (req, res) => {
    try {
      const { cid } = req.params;

      const result = await cartsRepo.purchaseCart(cid, req.user.email);
      if (!result) return res.status(404).json({ status: 'error', error: 'Carrito no encontrado' });

      // Si no compró nada (todo sin stock), no generamos ticket
      if (result.amount <= 0) {
        return res.status(400).json({
          status: 'error',
          error: 'No se pudo comprar ningún producto (sin stock)',
          notPurchasedProducts: result.notPurchasedProducts,
        });
      }

      // code único simple
      const code = `T-${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const ticket = await ticketsRepo.createTicket({
        code,
        amount: result.amount,
        purchaser: req.user.email,
      });

      return res.json({
        status: 'success',
        ticket,
        notPurchasedProducts: result.notPurchasedProducts,
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', error: 'Error en purchase', details: err.message });
    }
  }
);


// eliminar un producto del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const updated = await cartsRepo.removeProductFromCart(cid, pid);
    if (!updated) return res.status(404).json({ error: 'Carrito o producto no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto del carrito', details: err.message });
  }
});

// Reemplazar el carrito completo
router.put('/:cid', async (req, res) => {
  try {
    const { products } = req.body;
    const updated = await cartsRepo.replaceCartProducts(req.params.cid, products);
    if (!updated) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al reemplazar productos del carrito', details: err.message });
  }
});

// actualizar SOLO la cantidad
router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (typeof quantity === 'undefined') {
      return res.status(400).json({ error: 'Falta "quantity" en el body' });
    }
    const updated = await cartsRepo.updateProductQuantity(req.params.cid, req.params.pid, quantity);
    if (!updated) return res.status(404).json({ error: 'Carrito o producto no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cantidad del producto', details: err.message });
  }
});

// vaciar carrito
router.delete('/:cid', async (req, res) => {
  try {
    const cleared = await cartsRepo.clearCart(req.params.cid);
    if (!cleared) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cleared);
  } catch (err) {
    res.status(500).json({ error: 'Error al vaciar carrito', details: err.message });
  }
});

module.exports = router;
