const Ticket = require('../models/ticket.model');

class TicketsDAO {
  async create(data) {
    const created = await Ticket.create(data);
    return created.toObject({ virtuals: true });
  }
}

module.exports = TicketsDAO;
