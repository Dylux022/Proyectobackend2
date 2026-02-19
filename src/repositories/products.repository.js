const ProductsDAO = require('../dao/products.dao');

class ProductsRepository {
  constructor() {
    this.dao = new ProductsDAO();
  }

  // mantiene tu lógica de filtros/paginación pero ya usando DAO
  async getProductsAdvanced(options = {}) {
    const {
      page = 1,
      limit = 10,
      sort,
      query,
      priceMin,
      priceMax,
      stockMin,
      stockMax,
    } = options;

    const filter = {};

    if (query) {
      if (query.includes(':')) {
        const pairs = query.split(',').map(s => s.trim()).filter(Boolean);
        for (const p of pairs) {
          const [k, v] = p.split(':').map(s => s.trim());
          if (!k) continue;
          if (k === 'status') filter.status = v === 'true';
          else if (k === 'category') filter.category = v;
          else if (k === 'code') filter.code = v;
          else filter[k] = v;
        }
      } else {
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
      this.dao.find(filter, { sort: sortObj, skip, limit: limitNum }),
      this.dao.count(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    return {
      status: 'success',
      payload: items,
      totalDocs: total,
      limit: limitNum,
      page: pageNum,
      totalPages,
      hasPrevPage: pageNum > 1,
      hasNextPage: pageNum < totalPages,
    };
  }

  async getProducts() {
    return this.dao.findAll();
  }

  async getProductById(id) {
    return this.dao.findById(id);
  }

  async addProduct(data) {
    try {
      return await this.dao.create(data);
    } catch (err) {
      if (err && err.code === 11000) throw new Error('El campo "code" ya existe. Debe ser único.');
      if (err && err.name === 'ValidationError') throw new Error('Datos inválidos: ' + err.message);
      throw err;
    }
  }

  async updateProduct(id, data) {
    try {
      return await this.dao.updateById(id, data);
    } catch (err) {
      if (err && err.code === 11000) throw new Error('El campo "code" ya existe. Debe ser único.');
      if (err && err.name === 'ValidationError') throw new Error('Datos inválidos: ' + err.message);
      throw err;
    }
  }

  async deleteProduct(id) {
    return this.dao.deleteById(id);
  }
}

module.exports = ProductsRepository;
