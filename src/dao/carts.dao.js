const Cart = require('../models/cart.model');

class CartsDAO {
  async createEmpty() {
    const created = await Cart.create({ products: [] });
    return created.toObject({ virtuals: true });
  }

  async findByIdLeanPopulated(cid) {
    return Cart.findById(cid)
      .populate({ path: 'products.product', select: 'title price category id' })
      .lean();
  }

  async findByIdDoc(cid) {
    return Cart.findById(cid);
  }

  async save(cartDoc) {
    await cartDoc.save();
    const populated = await cartDoc.populate({ path: 'products.product', select: 'title price category id' });
    return populated.toObject({ virtuals: true });
  }
}

module.exports = CartsDAO;
