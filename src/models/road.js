const mongoose = require("mongoose");

const roadSchema = new mongoose.Schema({
  from: String,
  to: String,
  distance: Number,
  fromLat: Number,
  fromLng: Number,
  toLat: Number,
  toLng: Number
});

module.exports = mongoose.model("Road", roadSchema);
