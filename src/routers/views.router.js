// src/routers/views.router.js
const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');
const Product = require('../models/product.model');
const CartManager = require('../managers/CartManager');

const router = Router();
const pm = new ProductManager();
const cm = new CartManager();

// /home (vista original)
router.get('/home', async (req, res) => {
  const products = await pm.getProducts();
  res.render('home', { title: 'Home', products });
});

// /realtimeproducts (vista original)
router.get('/realtimeproducts', async (req, res) => {
  const products = await pm.getProducts();
  res.render('realTimeProducts', { title: 'Real Time', products });
});

// /products (lista paginada con filtros y orden)
router.get('/products', async (req, res) => {
  const { page, limit, sort, query, priceMin, priceMax, stockMin, stockMax } = req.query;

  const internalSort =
    sort === 'asc' ? 'price:asc' :
    sort === 'desc' ? 'price:desc' :
    undefined;

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

  const base = '/products';
  const qs = new URLSearchParams({ ...req.query });
  const link = (p) => {
    qs.set('page', String(p));
    return `${base}?${qs.toString()}`;
  };

  res.render('products', {
    title: 'Productos',
    ...result,
    prevLink: result.hasPrevPage ? link(result.page - 1) : null,
    nextLink: result.hasNextPage ? link(result.page + 1) : null,
    query: query || '',
    sort: sort || '',
    page: result.page,
    limit: result.limit,
  });
});

// /products/:pid (detalle)
router.get('/products/:pid', async (req, res) => {
  const prod = await Product.findById(req.params.pid).lean();
  if (!prod) return res.status(404).send('Producto no encontrado');
  res.render('productDetail', { title: prod.title, product: prod });
});

// /carts/:cid (vista de carrito)
router.get('/carts/:cid', async (req, res) => {
  const cart = await cm.getCartById(req.params.cid);
  if (!cart) return res.status(404).send('Carrito no encontrado');
  // usar _id como respaldo si el virtual id no viene en lean()
  res.render('cart', { title: `Carrito ${cart.id || cart._id}`, cart });
});

module.exports = router;
