const TicketsDAO = require('../dao/tickets.dao');

class TicketsRepository {
  constructor() {
    this.dao = new TicketsDAO();
  }

  async createTicket(data) {
    return this.dao.create(data);
  }
}

module.exports = TicketsRepository;
