const fs = require('fs').promises;
const path = require('path');


const filePath = path.join(__dirname, '../../data/carts.json');

function generateId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

class CartManager {
  constructor(filepath = filePath){
    this.filepath = filepath;
  }

  async _readFile(){
    try {
      const content = await fs.readFile(this.filepath, 'utf8');
      return JSON.parse(content);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.mkdir(path.dirname(this.filepath), { recursive: true });
        await fs.writeFile(this.filepath, JSON.stringify([], null, 2));
        return [];
      }
      throw err;
    }
  }

  async _writeFile(data){
    await fs.writeFile(this.filepath, JSON.stringify(data, null, 2));
  }

  async createCart(){
    const carts = await this._readFile();
    const id = generateId();
    const newCart = { id, products: [] };
    carts.push(newCart);
    await this._writeFile(carts);
    return newCart;
  }

  async getCartById(cid){
    const carts = await this._readFile();
    return carts.find(c => String(c.id) === String(cid)) || null;
  }

  async addProductToCart(cid, pid, quantity = 1){
    const carts = await this._readFile();
    const idx = carts.findIndex(c => String(c.id) === String(cid));
    if (idx === -1) return null;

    const cart = carts[idx];
    const prodIdx = cart.products.findIndex(p => String(p.product) === String(pid));
    if (prodIdx === -1) {
      cart.products.push({ product: pid, quantity });
    } else {
      cart.products[prodIdx].quantity += quantity;
    }

    carts[idx] = cart;
    await this._writeFile(carts);
    return cart;
  }
}

module.exports = CartManager;
