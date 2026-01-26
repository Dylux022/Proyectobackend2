// src/routers/carts.router.js
const express = require('express');
const CartManager = require('../managers/CartManager');
const ProductManager = require('../managers/ProductManager');

const router = express.Router();
const cm = new CartManager();
const pm = new ProductManager();

// Crear carrito
router.post('/', async (req, res) => {
  try {
    const cart = await cm.createCart();
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear carrito', details: err.message });
  }
});

// Ver productos del carrito (populate ya aplicado en el manager)
router.get('/:cid', async (req, res) => {
  try {
    const cart = await cm.getCartById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart.products);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer carrito', details: err.message });
  }
});

// Agregar producto al carrito
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;

    const product = await pm.getProductById(pid);
    if (!product) return res.status(404).json({ error: 'Producto no existe' });

    const updatedCart = await cm.addProductToCart(cid, pid, 1);
    if (!updatedCart) return res.status(404).json({ error: 'Carrito no encontrado' });

    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar producto al carrito', details: err.message });
  }
});

// --- Requeridos por consigna ---

// DELETE api/carts/:cid/products/:pid -> eliminar un producto del carrito
router.delete('/:cid/products/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;
    const updated = await cm.removeProductFromCart(cid, pid);
    if (!updated) return res.status(404).json({ error: 'Carrito o producto no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto del carrito', details: err.message });
  }
});

// PUT api/carts/:cid -> reemplazar TODOS los productos con un arreglo [{ product, quantity }]
router.put('/:cid', async (req, res) => {
  try {
    const { products } = req.body;
    const updated = await cm.replaceCartProducts(req.params.cid, products);
    if (!updated) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al reemplazar productos del carrito', details: err.message });
  }
});

// PUT api/carts/:cid/products/:pid -> actualizar SOLO la cantidad
router.put('/:cid/products/:pid', async (req, res) => {
  try {
    const { quantity } = req.body;
    if (typeof quantity === 'undefined') {
      return res.status(400).json({ error: 'Falta "quantity" en el body' });
    }
    const updated = await cm.updateProductQuantity(req.params.cid, req.params.pid, quantity);
    if (!updated) return res.status(404).json({ error: 'Carrito o producto no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cantidad del producto', details: err.message });
  }
});

// DELETE api/carts/:cid -> vaciar carrito
router.delete('/:cid', async (req, res) => {
  try {
    const cleared = await cm.clearCart(req.params.cid);
    if (!cleared) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cleared);
  } catch (err) {
    res.status(500).json({ error: 'Error al vaciar carrito', details: err.message });
  }
});

module.exports = router;
