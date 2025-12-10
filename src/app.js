// src/app.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const busRoutes = require("./routes/buses");
const bookingRoutes = require("./routes/booking");
const ticketRoutes = require("./routes/tickets");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health
app.get("/", (req, res) => res.json({ ok: true, msg: "NeuroFleetX Backend Running 🚀" }));

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/tickets", ticketRoutes);

module.exports = app;
