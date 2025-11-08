// src/models/product.model.js
const { Schema, model } = require('mongoose');

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: { type: Boolean, default: true },
    stock: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    thumbnails: { type: [String], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual para exponer `id` como string (compatible con tu front/WS)
ProductSchema.virtual('id').get(function () {
  return this._id.toString();
});

module.exports = model('Product', ProductSchema);
