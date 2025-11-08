// src/routers/products.router.js
const express = require('express');
const ProductManager = require('../managers/ProductManager');

const router = express.Router();
const pm = new ProductManager();

// GET /api/products  (con filtros/paginación/orden y formato exacto de la consigna)
router.get('/', async (req, res) => {
  try {
    let {
      page,
      limit,
      sort,      // "asc" | "desc" (orden por precio)
      query,     // "category:mates" o "status:true" o texto libre
      priceMin,
      priceMax,
      stockMin,
      stockMax,
    } = req.query;

    // Mapear "asc|desc" al esquema interno "price:asc|price:desc"
    let internalSort = undefined;
    if (sort === 'asc') internalSort = 'price:asc';
    else if (sort === 'desc') internalSort = 'price:desc';

    const result = await pm.getProductsAdvanced({
      page,
      limit,
      sort: internalSort,
      query,
      priceMin,
      priceMax,
      stockMin,
      stockMax,
    });

    // Links/Pages según consigna
    const base = req.baseUrl || '/api/products';
    const q = new URLSearchParams({ ...req.query });
    const mkLink = (p) => {
      q.set('page', String(p));
      return `${base}?${q.toString()}`;
    };

    res.json({
      status: 'success',
      payload: result.payload,
      totalPages: result.totalPages,
      prevPage: result.hasPrevPage ? result.page - 1 : null,
      nextPage: result.hasNextPage ? result.page + 1 : null,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? mkLink(result.page - 1) : null,
      nextLink: result.hasNextPage ? mkLink(result.page + 1) : null,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Error al leer productos', details: err.message });
  }
});

// GET /api/products/:pid
router.get('/:pid', async (req, res) => {
  try {
    const product = await pm.getProductById(req.params.pid);
    if (!product) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Error al leer producto', details: err.message });
  }
});

// POST /api/products
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
      return res.status(400).json({ status: 'error', error: 'Faltan campos requeridos (title, description, code, price, stock, category)' });
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
    res.status(500).json({ status: 'error', error: 'Error al agregar producto', details: err.message });
  }
});

// PUT /api/products/:pid
router.put('/:pid', async (req, res) => {
  try {
    if (req.body.id) delete req.body.id;
    const updated = await pm.updateProduct(req.params.pid, req.body);
    if (!updated) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Error al actualizar producto', details: err.message });
  }
});

// DELETE /api/products/:pid
router.delete('/:pid', async (req, res) => {
  try {
    const ok = await pm.deleteProduct(req.params.pid);
    if (!ok) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    res.json({ status: 'success', message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Error al eliminar producto', details: err.message });
  }
});

module.exports = router;
