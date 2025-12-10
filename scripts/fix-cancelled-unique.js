/**
 * scripts/fix-cancelled-unique.js
 *
 * Usage:
 *   node scripts/fix-cancelled-unique.js <tripId> <seatNo>
 *
 * This will:
 *  - find tickets with given tripId and seatNo
 *  - back them up to ./scripts/backup-...
 *  - for tickets with status === "cancelled", rename seatNo -> ORPHAN-<ticketId>
 *  - print actions taken
 *
 * Safe: non-destructive (keeps tickets), only renames seatNo for cancelled tickets.
 */
const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const Ticket = require('../src/models/ticket');

function sanitizeMongoUri(rawUri){
  try {
    const url = new URL(rawUri);
    const remove = new Set(['usenewurlparser','useunifiedtopology','retrywrites','ssl','readpreference']);
    for (const key of Array.from(url.searchParams.keys())) {
      if (remove.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    return url.toString();
  } catch (e) {
    return rawUri.replace(/\?(.*)/,'');
  }
}

async function main(){
  const tripId = process.argv[2];
  const seatNo = process.argv[3];
  if (!tripId || !seatNo) {
    console.error('Usage: node scripts/fix-cancelled-unique.js <tripId> <seatNo>');
    process.exit(1);
  }

  const rawUri = process.env.MONGO_URI || process.env.MONGO_URL || process.env.MONGO;
  if (!rawUri) {
    console.error('ERROR: no MONGO_URI / MONGO_URL / MONGO in .env');
    process.exit(1);
  }
  const uri = sanitizeMongoUri(rawUri);
  await mongoose.connect(uri);

  const tickets = await Ticket.find({ tripId, seatNo }).lean();
  const ts = Date.now();
  const backupPath = `./scripts/backup-tickets-${tripId}-${seatNo}-${ts}.json`;
  fs.writeFileSync(backupPath, JSON.stringify(tickets, null, 2), 'utf8');
  console.log(`Backed up ${tickets.length} tickets to ${backupPath}`);

  if (tickets.length === 0) {
    console.log('No tickets found for that tripId & seatNo. Nothing to change.');
    await mongoose.disconnect();
    process.exit(0);
  }

  for (const t of tickets) {
    const ticket = await Ticket.findById(t._id);
    if (!ticket) continue;
    if (String(ticket.status) === 'cancelled') {
      const newSeat = `ORPHAN-${String(ticket._id).slice(0,8)}`;
      console.log(`Renaming cancelled ticket ${ticket._id} seatNo "${ticket.seatNo}" -> "${newSeat}"`);
      ticket.seatNo = newSeat;
      await ticket.save();
    } else {
      console.log(`Ticket ${ticket._id} status="${ticket.status}" — skipping (not cancelled)`);
    }
  }

  console.log('Done. Disconnecting.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
