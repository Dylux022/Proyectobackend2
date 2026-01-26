// src/managers/CartManager.js
const Cart = require('../models/cart.model');

class CartManager {
  // Crear carrito vacío
  async createCart() {
    const created = await Cart.create({ products: [] });
    return created.toObject({ virtuals: true });
  }

  // Obtener carrito por ID 
  async getCartById(cid) {
    const cart = await Cart.findById(cid)
      .populate({
        path: 'products.product',
        select: 'title price category id',
      })
      .lean();
    return cart || null;
  }

  // Agregar producto (o incrementar cantidad si ya existe)
  async addProductToCart(cid, pid, quantity = 1) {
    const cart = await Cart.findById(cid);
    if (!cart) return null;

    const idx = cart.products.findIndex(p => String(p.product) === String(pid));
    if (idx === -1) {
      cart.products.push({ product: pid, quantity });
    } else {
      cart.products[idx].quantity += quantity;
    }
    await cart.save();

    const populated = await cart.populate({
      path: 'products.product',
      select: 'title price category id',
    });
    return populated.toObject({ virtuals: true });
  }

 

  // Eliminar un producto puntual del carrito
  async removeProductFromCart(cid, pid) {
    const cart = await Cart.findById(cid);
    if (!cart) return null;

    cart.products = cart.products.filter(p => String(p.product) !== String(pid));
    await cart.save();

    const populated = await cart.populate({
      path: 'products.product',
      select: 'title price category id',
    });
    return populated.toObject({ virtuals: true });
  }

 
  async replaceCartProducts(cid, productsArray = []) {
    const cart = await Cart.findById(cid);
    if (!cart) return null;

    cart.products = (Array.isArray(productsArray) ? productsArray : [])
      .filter(it => it && it.product)
      .map(it => ({
        product: it.product,
        quantity: Math.max(1, Number(it.quantity) || 1),
      }));

    await cart.save();

    const populated = await cart.populate({
      path: 'products.product',
      select: 'title price category id',
    });
    return populated.toObject({ virtuals: true });
  }

  // Actualizar SOLO la cantidad de un producto
  async updateProductQuantity(cid, pid, quantity) {
    const qty = Math.max(1, Number(quantity) || 1);
    const cart = await Cart.findById(cid);
    if (!cart) return null;

    const idx = cart.products.findIndex(p => String(p.product) === String(pid));
    if (idx === -1) return null;

    cart.products[idx].quantity = qty;
    await cart.save();

    const populated = await cart.populate({
      path: 'products.product',
      select: 'title price category id',
    });
    return populated.toObject({ virtuals: true });
  }

  // Vaciar carrito
  async clearCart(cid) {
    const cart = await Cart.findById(cid);
    if (!cart) return null;

    cart.products = [];
    await cart.save();

    const populated = await cart.populate({
      path: 'products.product',
      select: 'title price category id',
    });
    return populated.toObject({ virtuals: true });
  }
}

module.exports = CartManager;
