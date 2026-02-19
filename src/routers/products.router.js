// src/routers/products.router.js
const express = require('express');
const passport = require('passport');
const { authorizeRoles } = require('../middlewares/authorization');

const ProductsRepository = require('../repositories/products.repository');

const router = express.Router();
const productsRepo = new ProductsRepository();

router.get('/', async (req, res) => {
  try {
    let {
      page,
      limit,
      sort,
      query,
      priceMin,
      priceMax,
      stockMin,
      stockMax,
    } = req.query;

    let internalSort = undefined;
    if (sort === 'asc') internalSort = 'price:asc';
    else if (sort === 'desc') internalSort = 'price:desc';

    const result = await productsRepo.getProductsAdvanced({
      page,
      limit,
      sort: internalSort,
      query,
      priceMin,
      priceMax,
      stockMin,
      stockMax,
    });

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

router.get('/:pid', async (req, res) => {
  try {
    const product = await productsRepo.getProductById(req.params.pid);
    if (!product) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ status: 'error', error: 'Error al leer producto', details: err.message });
  }
});

// ✅ SOLO ADMIN
router.post(
  '/',
  passport.authenticate('current', { session: false }),
  authorizeRoles('admin'),
  async (req, res) => {
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

      const newProd = await productsRepo.addProduct({
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
  }
);

// ✅ SOLO ADMIN
router.put(
  '/:pid',
  passport.authenticate('current', { session: false }),
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      if (req.body.id) delete req.body.id;
      const updated = await productsRepo.updateProduct(req.params.pid, req.body);
      if (!updated) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ status: 'error', error: 'Error al actualizar producto', details: err.message });
    }
  }
);

// ✅ SOLO ADMIN
router.delete(
  '/:pid',
  passport.authenticate('current', { session: false }),
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const ok = await productsRepo.deleteProduct(req.params.pid);
      if (!ok) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
      res.json({ status: 'success', message: 'Producto eliminado' });
    } catch (err) {
      res.status(500).json({ status: 'error', error: 'Error al eliminar producto', details: err.message });
    }
  }
);

module.exports = router;
