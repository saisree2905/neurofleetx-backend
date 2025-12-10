// src/controllers/bookingController.js
const mongoose = require('mongoose');
const Trip = require('../models/trip');
const Ticket = require('../models/ticket');
const Bus = require('../models/bus');

exports.createTripWithSeats = async (req, res) => {
  try {
    const { busId, routeId, departureTime, arrivalTime } = req.body;
    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ msg: 'Bus not found' });

    const capacity = bus.capacity || 0;
    if (capacity <= 0) return res.status(400).json({ msg: 'Bus capacity must be > 0' });

    const seats = [];
    for (let i = 1; i <= capacity; i++) {
      seats.push({ seatNo: String(i).padStart(2,'0'), status: 'available' });
    }

    const trip = new Trip({ busId, routeId, departureTime, arrivalTime, seats });
    await trip.save();
    return res.status(201).json(trip);
  } catch (err) {
    console.error('createTripWithSeats err:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const trip = await Trip.findById(id).populate('busId', 'registrationNo name capacity');
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });
    return res.json(trip);
  } catch (err) {
    console.error('getTripById err:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

// src/controllers/bookingController.js

exports.bookSeat = async (req, res) => {
  try {
    const { userId, tripId, seatNo, fare } = req.body;
    if (!userId || !tripId || !seatNo) {
      return res.status(400).json({ msg: 'userId, tripId and seatNo are required' });
    }

    // load trip
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ msg: 'Trip not found' });

    const seatIndex = trip.seats.findIndex(s => s.seatNo === seatNo);
    if (seatIndex === -1) return res.status(400).json({ msg: 'Invalid seatNo for trip' });

    const seat = trip.seats[seatIndex];
    if (seat.status === 'booked' || seat.status === 'reserved') {
      // If seat is marked reserved/booked, give informative response
      return res.status(409).json({ msg: 'Seat already reserved or booked' });
    }

    // Create new ticket
    const ticket = new Ticket({
      userId: mongoose.Types.ObjectId(userId),
      tripId: mongoose.Types.ObjectId(tripId),
      busId: trip.busId, // assume busId from trip
      seatNo,
      fare,
      paymentStatus: 'pending',
      status: 'active', // active until cancelled
      bookedAt: new Date()
    });

    try {
      const saved = await ticket.save();

      // link to trip seat
      trip.seats[seatIndex].status = 'reserved'; // reserved until payment confirmed
      trip.seats[seatIndex].ticketId = saved._id;
      await trip.save();

      return res.status(201).json({ ticket: saved });
    } catch (err) {
      // handle duplicate key (someone else / cancelled ticket)
      if (err && err.code === 11000) {
        console.warn('bookSeat duplicate key:', err);

        // Find existing ticket with same tripId & seatNo
        const existing = await Ticket.findOne({ tripId, seatNo });

        if (!existing) {
          // very unlikely but handle defensively
          return res.status(409).json({ msg: 'Seat already taken (duplicate key), and existing ticket not found' });
        }

        // if cancelled -> reactivate and reuse
        if (String(existing.status) === 'cancelled') {
          existing.status = 'active';
          existing.paymentStatus = 'pending';
          existing.userId = mongoose.Types.ObjectId(userId); // optionally reassign user
          existing.fare = fare || existing.fare;
          existing.bookedAt = new Date();
          await existing.save();

          // attach to trip seat (overwrite or set)
          trip.seats[seatIndex].status = 'reserved';
          trip.seats[seatIndex].ticketId = existing._id;
          await trip.save();

          return res.status(200).json({ ticket: existing, reused: true });
        }

        // if existing ticket active/reserved/booked -> collision
        return res.status(409).json({ msg: 'Seat already booked or reserved', ticket: existing });
      }

      // other errors -> bubble up
      console.error('bookSeat err:', err);
      return res.status(500).json({ msg: 'Server error', error: err.message || err });
    }
  } catch (err) {
    console.error('bookSeat outer err:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message || err });
  }
};


exports.confirmPayment = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { ticketId } = req.params;
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ msg: 'paymentId required' });

    session.startTransaction();

    const ticket = await Ticket.findById(ticketId).session(session);
    if (!ticket) {
      await session.abortTransaction();
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    if (ticket.paymentStatus === 'paid') {
      await session.abortTransaction();
      return res.status(400).json({ msg: 'Ticket already marked paid' });
    }

    const trip = await Trip.findById(ticket.tripId).session(session);
    if (!trip) {
      await session.abortTransaction();
      return res.status(404).json({ msg: 'Trip not found' });
    }

    const seatIndex = trip.seats.findIndex(s => s.seatNo === ticket.seatNo && String(s.ticketId) === String(ticket._id));
    if (seatIndex === -1) {
      await session.abortTransaction();
      return res.status(400).json({ msg: 'Seat not reserved for this ticket' });
    }

    ticket.paymentStatus = 'paid';
    ticket.paymentId = paymentId;
    await ticket.save({ session });

    trip.seats[seatIndex].status = 'booked';
    await trip.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({ msg: 'Payment confirmed, seat booked', ticket });
  } catch (err) {
    try { await session.abortTransaction(); session.endSession(); } catch (e) {}
    console.error('confirmPayment err:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
};

exports.cancelTicket = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { ticketId } = req.params;
    if (!ticketId) return res.status(400).json({ msg: 'ticketId required' });

    session.startTransaction();

    const ticket = await Ticket.findById(ticketId).session(session);
    if (!ticket) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: 'Ticket not found' });
    }

    if (ticket.status === 'cancelled') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ msg: 'Ticket already cancelled' });
    }

    const trip = await Trip.findById(ticket.tripId).session(session);
    if (!trip) {
      // if trip missing, still cancel ticket to avoid inconsistent state
      ticket.status = 'cancelled';
      ticket.paymentStatus = 'refunded';
      await ticket.save({ session });
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ msg: 'Ticket cancelled (trip not found)', ticket });
    }

    const seatIndex = trip.seats.findIndex(s => s.seatNo === ticket.seatNo && String(s.ticketId) === String(ticket._id));
    if (seatIndex !== -1) {
      trip.seats[seatIndex].status = 'available';
      trip.seats[seatIndex].ticketId = null;
      await trip.save({ session });
    } else {
      console.warn('Seat not found or mismatch when cancelling ticket', ticket._id);
    }

    ticket.status = 'cancelled';
    ticket.paymentStatus = 'refunded';
    await ticket.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({ msg: 'Ticket cancelled', ticket });
  } catch (err) {
    try { await session.abortTransaction(); session.endSession(); } catch (e) {}
    console.error('cancelTicket err:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
