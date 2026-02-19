const CartsDAO = require('../dao/carts.dao');
const ProductsDAO = require('../dao/products.dao');

class CartsRepository {
  constructor() {
    this.dao = new CartsDAO();
    this.productsDao = new ProductsDAO();
  }

  async createCart() {
    return this.dao.createEmpty();
  }

  async getCartById(cid) {
    const cart = await this.dao.findByIdLeanPopulated(cid);
    return cart || null;
  }

  async addProductToCart(cid, pid, quantity = 1) {
    const cart = await this.dao.findByIdDoc(cid);
    if (!cart) return null;

    const idx = cart.products.findIndex(p => String(p.product) === String(pid));
    if (idx === -1) cart.products.push({ product: pid, quantity });
    else cart.products[idx].quantity += quantity;

    return this.dao.save(cart);
  }

  async removeProductFromCart(cid, pid) {
    const cart = await this.dao.findByIdDoc(cid);
    if (!cart) return null;

    cart.products = cart.products.filter(p => String(p.product) !== String(pid));
    return this.dao.save(cart);
  }

  async replaceCartProducts(cid, productsArray = []) {
    const cart = await this.dao.findByIdDoc(cid);
    if (!cart) return null;

    cart.products = (Array.isArray(productsArray) ? productsArray : [])
      .filter(it => it && it.product)
      .map(it => ({
        product: it.product,
        quantity: Math.max(1, Number(it.quantity) || 1),
      }));

    return this.dao.save(cart);
  }

  async updateProductQuantity(cid, pid, quantity) {
    const qty = Math.max(1, Number(quantity) || 1);

    const cart = await this.dao.findByIdDoc(cid);
    if (!cart) return null;

    const idx = cart.products.findIndex(p => String(p.product) === String(pid));
    if (idx === -1) return null;

    cart.products[idx].quantity = qty;
    return this.dao.save(cart);
  }

  async clearCart(cid) {
    const cart = await this.dao.findByIdDoc(cid);
    if (!cart) return null;

    cart.products = [];
    return this.dao.save(cart);
  }

  // -------------------- PURCHASE --------------------
  // Devuelve: { ticket, notPurchasedProducts, totalPurchased }
  async purchaseCart(cid, purchaserEmail) {
    const cart = await this.dao.findByIdDoc(cid);
    if (!cart) return null;

    // Cargar productos actuales (precio/stock) para decidir compra
    // Nota: usamos findById sobre cada product para mantenerlo simple y claro
    let totalAmount = 0;
    const notPurchased = [];
    const purchased = [];

    for (const item of cart.products) {
      const pid = item.product;
      const qty = Number(item.quantity) || 1;

      const product = await this.productsDao.findById(pid);
      if (!product) {
        // si el producto ya no existe, lo dejamos como no comprado
        notPurchased.push({ product: pid, quantity: qty, reason: 'Producto no existe' });
        continue;
      }

      if (product.stock >= qty) {
        // ✅ comprar: descontar stock
        const newStock = product.stock - qty;
        await this.productsDao.updateById(pid, { stock: newStock });

        totalAmount += product.price * qty;
        purchased.push({ product: pid, quantity: qty });
      } else {
        // ❌ no hay stock: queda en carrito
        notPurchased.push({ product: pid, quantity: qty, reason: 'Sin stock suficiente' });
      }
    }

    // Dejar en el carrito SOLO lo no comprado
    cart.products = notPurchased.map(np => ({ product: np.product, quantity: np.quantity }));
    await cart.save();

    return {
      amount: totalAmount,
      notPurchasedProducts: notPurchased,
      purchasedProducts: purchased,
    };
  }
}

module.exports = CartsRepository;
