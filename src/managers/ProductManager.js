const fs = require('fs').promises;
const path = require('path');

// ruta ajustada para la nueva estructura
const filePath = path.join(__dirname, '../../data/products.json');

function generateId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
}

class ProductManager {
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

  async getProducts(){
    return await this._readFile();
  }

  async getProductById(pid){
    const products = await this._readFile();
    return products.find(p => String(p.id) === String(pid)) || null;
  }

  async addProduct(productData){
    const products = await this._readFile();
    const id = generateId();
    const newProduct = { id, ...productData };
    products.push(newProduct);
    await this._writeFile(products);
    return newProduct;
  }

  async updateProduct(pid, updateFields){
    const products = await this._readFile();
    const idx = products.findIndex(p => String(p.id) === String(pid));
    if (idx === -1) return null;
    const updated = { ...products[idx], ...updateFields, id: products[idx].id };
    products[idx] = updated;
    await this._writeFile(products);
    return updated;
  }

  async deleteProduct(pid){
    const products = await this._readFile();
    const idx = products.findIndex(p => String(p.id) === String(pid));
    if (idx === -1) return false;
    products.splice(idx, 1);
    await this._writeFile(products);
    return true;
  }
}

module.exports = ProductManager;
