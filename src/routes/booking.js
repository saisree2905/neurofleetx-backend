// src/routes/booking.js
/*const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middlewares/auth');

// quick ping
router.get('/ping', (req, res) => res.json({ ok: true, msg: 'Booking route working!' }));

// create trip (admin)
router.post('/trip', auth.verifyToken, auth.requireRole('admin'), bookingController.createTripWithSeats);

// get trip by id
router.get('/trip/:id', bookingController.getTripById);

// book a seat (authenticated)
router.post('/book', auth.verifyToken, bookingController.bookSeat);

// confirm payment (authenticated)
router.post('/confirm/:ticketId', auth.verifyToken, bookingController.confirmPayment);

// cancel ticket (authenticated)
router.post('/cancel/:ticketId', auth.verifyToken, bookingController.cancelTicket);

module.exports = router;*/
