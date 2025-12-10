// src/controllers/ticketController.js
const Ticket = require('../models/ticket');

exports.getById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId).populate('tripId').populate('busId').populate('userId', 'name email');
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
    return res.json(ticket);
  } catch (err) {
    console.error('ticketController.getById err:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.listByUser = async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.params.userId }).populate('tripId').populate('busId');
    return res.json({ tickets });
  } catch (err) {
    console.error('ticketController.listByUser err:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};
