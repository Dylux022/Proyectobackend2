const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');

const router = Router();
const pm = new ProductManager();

// /home 
router.get('/home', async (req, res) => {
  const products = await pm.getProducts();
  res.render('home', { products });
});

//  lista en tiempo real + forms WS
router.get('/realtimeproducts', async (req, res) => {
  const products = await pm.getProducts();
  res.render('realTimeProducts', { products });
});

module.exports = router;
