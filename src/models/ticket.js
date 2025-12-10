// src/models/ticket.js
const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  seatNo: { type: String, required: true },
  fare: { type: Number, required: true, default: 0 },
  paymentStatus: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  paymentId: { type: String },
  status: { type: String, enum: ['active','cancelled'], default: 'active' },
  bookedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// prevent duplicate bookings on same trip+seat
TicketSchema.index({ tripId: 1, seatNo: 1 }, { unique: true });

module.exports = mongoose.model('Ticket', TicketSchema);
