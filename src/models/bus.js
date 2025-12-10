const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
  registrationNo: { type: String, required: true, unique: true },
  name: { type: String },
  capacity: { type: Number, default: 0 },
  routeId: { type: String },
  active: { type: Boolean, default: true },
  meta: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Bus', BusSchema);
