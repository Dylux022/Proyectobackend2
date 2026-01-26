// src/managers/ProductManager.js
const Product = require('../models/product.model');

class ProductManager {
  // --- Nuevo: listado avanzado con filtros/paginación/orden ---
  async getProductsAdvanced(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort,              // 'price:asc' | 'price:desc' | 'stock:asc' | '-price'
      query,             // 'category:mates,status:true' o texto libre
      priceMin,
      priceMax,
      stockMin,
      stockMax,
    } = options;

    // --- Filtros ---
    const filter = {};

    if (query) {
      if (query.includes(':')) {
        // pares clave:valor separados por coma (category:mates,status:true)
        const pairs = query.split(',').map(s => s.trim()).filter(Boolean);
        for (const p of pairs) {
          const [k, v] = p.split(':').map(s => s.trim());
          if (!k) continue;
          if (k === 'status') filter.status = v === 'true';
          else if (k === 'category') filter.category = v;
          else if (k === 'code') filter.code = v;
          else filter[k] = v; // campo libre
        }
      } else {
        // texto libre → busca en title/description (case-insensitive)
        filter.$or = [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ];
      }
    }

    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = Number(priceMin);
      if (priceMax) filter.price.$lte = Number(priceMax);
    }
    if (stockMin || stockMax) {
      filter.stock = {};
      if (stockMin) filter.stock.$gte = Number(stockMin);
      if (stockMax) filter.stock.$lte = Number(stockMax);
    }

    // --- Orden ---
    let sortObj = {};
    if (sort) {
      if (sort.includes(':')) {
        const [field, dir] = sort.split(':');
        sortObj[field] = dir === 'desc' ? -1 : 1;
      } else if (sort.startsWith('-')) {
        sortObj[sort.slice(1)] = -1;
      } else {
        sortObj[sort] = 1;
      }
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const hasPrevPage = pageNum > 1;
    const hasNextPage = pageNum < totalPages;

    return {
      status: 'success',
      payload: items,
      totalDocs: total,
      limit: limitNum,
      page: pageNum,
      totalPages,
      hasPrevPage,
      hasNextPage,
    };
  }

  // --- CRUD base (compatibles con tus routers/sockets) ---
  async getProducts() {
    return await Product.find().lean();
  }

  async getProductById(pid) {
    return await Product.findById(pid).lean();
  }

  async addProduct(productData) {
    try {
      const created = await Product.create(productData);
      return created.toObject({ virtuals: true });
    } catch (err) {
      if (err && err.code === 11000) throw new Error('El campo "code" ya existe. Debe ser único.');
      if (err && err.name === 'ValidationError') throw new Error('Datos inválidos: ' + err.message);
      throw err;
    }
  }

  async updateProduct(pid, updateFields) {
    try {
      const updated = await Product.findByIdAndUpdate(pid, updateFields, {
        new: true,
        runValidators: true,
      });
      return updated ? updated.toObject({ virtuals: true }) : null;
    } catch (err) {
      if (err && err.code === 11000) throw new Error('El campo "code" ya existe. Debe ser único.');
      if (err && err.name === 'ValidationError') throw new Error('Datos inválidos: ' + err.message);
      throw err;
    }
  }

  async deleteProduct(pid) {
    const result = await Product.findByIdAndDelete(pid);
    return !!result;
  }
}

module.exports = ProductManager;
