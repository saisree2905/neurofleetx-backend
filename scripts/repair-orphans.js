/**
 * scripts/repair-orphans.js (SANITIZED)
 *
 * Usage:
 *   node scripts/repair-orphans.js <tripId> <seatNo>
 *
 * This version strips unsupported mongo URI query params like
 * useNewUrlParser and useUnifiedTopology before connecting.
 */
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const Ticket = require('../src/models/ticket');
const Trip = require('../src/models/trip');

function sanitizeMongoUri(rawUri){
  try {
    // If it is a mongodb+srv or mongodb URI, use WHATWG URL to trim unsupported params
    const url = new URL(rawUri);
    const remove = new Set(['usenewurlparser','useunifiedtopology','retrywrites','ssl','readpreference']);
    for (const key of Array.from(url.searchParams.keys())) {
      if (remove.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    // return string without trailing '?' if no params
    let out = url.toString();
    // for mongodb+srv, URL adds a trailing slash; that's fine
    return out;
  } catch (e) {
    // if parsing fails, try to remove common fragments manually (fallback)
    return rawUri.replace(/\?(.*)/,'');
  }
}

async function main() {
  const tripId = process.argv[2];
  const seatNo = process.argv[3];

  if (!tripId || !seatNo) {
    console.error('Usage: node scripts/repair-orphans.js <tripId> <seatNo>');
    process.exit(1);
  }

  const rawUri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGO;
  if (!rawUri) {
    console.error('ERROR: no MONGO_URI / MONGO_URL / MONGO in .env');
    process.exit(1);
  }

  const uri = sanitizeMongoUri(rawUri);
  console.log('Connecting to Mongo with URI (sanitized):', uri.split('@').length>1 ? '***REDACTED***' : uri);

  // connect WITHOUT legacy options (driver defaults are fine)
  await mongoose.connect(uri);
  console.log('Connected.');

  const tickets = await Ticket.find({ tripId, seatNo }).lean();
  const ts = Date.now();
  const backupPath = `./scripts/backup-tickets-${tripId}-${seatNo}-${ts}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(tickets, null, 2), 'utf8');
  console.log(`Backed up ${tickets.length} tickets to ${backupPath}`);

  if (tickets.length === 0) {
    console.log('No tickets found for that tripId & seatNo. Nothing to do.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const trip = await Trip.findById(tripId);
  if (!trip) {
    console.error('Trip not found:', tripId);
    await mongoose.disconnect();
    process.exit(1);
  }

  for (const t of tickets) {
    const ticket = await Ticket.findById(t._id);
    if (!ticket) continue;
    if (String(ticket.status) === 'cancelled') {
      console.log(`Ticket ${ticket._id} already cancelled — skipping`);
      continue;
    }

    ticket.status = 'cancelled';
    ticket.paymentStatus = 'refunded';
    await ticket.save();
    console.log(`Cancelled ticket ${ticket._id}`);

    const seatIndex = trip.seats.findIndex(s => s.seatNo === seatNo);
    if (seatIndex !== -1) {
      const seat = trip.seats[seatIndex];
      if (seat.ticketId && String(seat.ticketId) === String(ticket._id)) {
        trip.seats[seatIndex].status = 'available';
        trip.seats[seatIndex].ticketId = null;
        console.log(`Cleared trip.seats[${seatIndex}] ticketId for trip ${tripId}`);
      } else {
        if (!seat.ticketId) {
          trip.seats[seatIndex].status = 'available';
          console.log(`Seat ${seatNo} had no ticketId — ensured status=available`);
        } else {
          console.log(`Seat ${seatNo} points to different ticketId (${seat.ticketId}) — not modified`);
        }
      }
    } else {
      console.warn(`Trip ${tripId} has no seat ${seatNo}`);
    }
  }

  await trip.save();
  console.log('Trip updated and saved.');

  await mongoose.disconnect();
  console.log('Done. Exiting.');
  process.exit(0);
}
main().catch(err => {
  console.error('Error', err);
  process.exit(1);
});
