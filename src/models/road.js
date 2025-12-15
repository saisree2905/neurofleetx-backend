const mongoose = require("mongoose");

const roadSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  distance: { type: Number, required: true },
  fromLat: Number,
  fromLng: Number,
  toLat: Number,
  toLng: Number
});

module.exports = mongoose.model("Road", roadSchema);
