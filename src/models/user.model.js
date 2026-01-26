const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    age: { type: Number, required: true, min: 0 },
    password: { type: String, required: true }, // hash
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', default: null },
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
