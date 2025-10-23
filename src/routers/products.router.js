const express = require('express');
const ProductManager = require('../managers/ProductManager');

const router = express.Router();
const pm = new ProductManager();


router.get('/', async (req, res) => {
  try {
    const products = await pm.getProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer productos', details: err.message });
  }
});


router.get('/:pid', async (req, res) => {
  try {
    const product = await pm.getProductById(req.params.pid);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer producto', details: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      price,
      status = true,
      stock,
      category,
      thumbnails = []
    } = req.body;

    
    if (!title || !description || !code || typeof price === 'undefined' || typeof stock === 'undefined' || !category) {
      return res.status(400).json({ error: 'Faltan campos requeridos (title, description, code, price, stock, category)' });
    }

    const newProd = await pm.addProduct({
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails
    });

    res.status(201).json(newProd);
  } catch (err) {
    res.status(500).json({ error: 'Error al agregar producto', details: err.message });
  }
});


router.put('/:pid', async (req, res) => {
  try {
   
    if (req.body.id) delete req.body.id;
    const updated = await pm.updateProduct(req.params.pid, req.body);
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar producto', details: err.message });
  }
});


router.delete('/:pid', async (req, res) => {
  try {
    const ok = await pm.deleteProduct(req.params.pid);
    if (!ok) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto', details: err.message });
  }
});

module.exports = router;
