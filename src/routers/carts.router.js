const express = require('express');
const CartManager = require('../managers/CartManager');
const ProductManager = require('../managers/ProductManager');

const router = express.Router();
const cm = new CartManager();
const pm = new ProductManager();

// POST /api/carts/ -> crear carrito
router.post('/', async (req, res) => {
  try {
    const cart = await cm.createCart();
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear carrito', details: err.message });
  }
});

// GET /api/carts/:cid -> listar productos del carrito
router.get('/:cid', async (req, res) => {
  try {
    const cart = await cm.getCartById(req.params.cid);
    if (!cart) return res.status(404).json({ error: 'Carrito no encontrado' });
    res.json(cart.products);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer carrito', details: err.message });
  }
});

// POST /api/carts/:cid/product/:pid -> agregar producto (1 unidad por llamada)
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const { cid, pid } = req.params;

    // verificar que el producto exista en products.json
    const product = await pm.getProductById(pid);
    if (!product) return res.status(404).json({ error: 'Producto no existe' });

    // Agregar 1 unidad (se puede extender para aceptar quantity en body si se quiere)
    const updatedCart = await cm.addProductToCart(cid, pid, 1);
    if (!updatedCart) return res.status(404).json({ error: 'Carrito no encontrado' });

    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar producto al carrito', details: err.message });
  }
});

module.exports = router;
