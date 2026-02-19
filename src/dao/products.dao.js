const Product = require('../models/product.model');

class ProductsDAO {
  async find(filter = {}, options = {}) {
    const { sort = {}, skip = 0, limit = 10 } = options;
    return Product.find(filter).sort(sort).skip(skip).limit(limit).lean();
  }

  async count(filter = {}) {
    return Product.countDocuments(filter);
  }

  async findAll() {
    return Product.find().lean();
  }

  async findById(id) {
    return Product.findById(id).lean();
  }

  async create(data) {
    const created = await Product.create(data);
    return created.toObject({ virtuals: true });
  }

  async updateById(id, data) {
    const updated = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    return updated ? updated.toObject({ virtuals: true }) : null;
  }

  async deleteById(id) {
    const result = await Product.findByIdAndDelete(id);
    return !!result;
  }
}

module.exports = ProductsDAO;
