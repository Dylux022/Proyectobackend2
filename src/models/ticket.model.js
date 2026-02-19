const { Schema, model } = require('mongoose');

const TicketSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    purchase_datetime: { type: Date, default: Date.now },
    amount: { type: Number, required: true, min: 0 },
    purchaser: { type: String, required: true, trim: true, lowercase: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TicketSchema.virtual('id').get(function () {
  return this._id.toString();
});

module.exports = model('Ticket', TicketSchema);
