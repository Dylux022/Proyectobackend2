// src/models/cart.model.js
const { Schema, model } = require('mongoose');

const CartSchema = new Schema(
  {
    products: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para exponer `id` como string
CartSchema.virtual('id').get(function () {
  return this._id.toString();
});

module.exports = model('Cart', CartSchema);
