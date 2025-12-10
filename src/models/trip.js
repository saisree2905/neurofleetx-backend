// src/models/trip.js
const mongoose = require('mongoose');

const SeatSchema = new mongoose.Schema({
  seatNo: { type: String, required: true },
  status: { type: String, enum: ['available','reserved','booked'], default: 'available' },
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null }
}, { _id: false });

const TripSchema = new mongoose.Schema({
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  routeId: { type: String, default: null },
  departureTime: { type: Date, required: true },
  arrivalTime: { type: Date, default: null },
  seats: [SeatSchema],
  meta: { type: Object }
}, { timestamps: true });

TripSchema.index({ busId: 1, departureTime: 1 });

module.exports = mongoose.model('Trip', TripSchema);
