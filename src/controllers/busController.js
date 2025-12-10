// src/controllers/busController.js
const Bus = require('../models/bus');

async function createBus(req, res) {
  try {
    const { registrationNo, name, capacity, routeId } = req.body;
    const existing = await Bus.findOne({ registrationNo });
    if (existing) return res.status(409).json({ msg: 'Bus with this registration already exists' });

    const bus = new Bus({ registrationNo, name, capacity, routeId });
    await bus.save();
    return res.status(201).json(bus);
  } catch (err) {
    console.error('createBus error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function getAllBuses(req, res) {
  try {
    const buses = await Bus.find().sort({ createdAt: -1 });
    return res.json(buses);
  } catch (err) {
    console.error('getAllBuses error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function getBus(req, res) {
  try {
    const bus = await Bus.findById(req.params.id);
    if (!bus) return res.status(404).json({ msg: 'Bus not found' });
    return res.json(bus);
  } catch (err) {
    console.error('getBus error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function updateBus(req, res) {
  try {
    const bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bus) return res.status(404).json({ msg: 'Bus not found' });
    return res.json(bus);
  } catch (err) {
    console.error('updateBus error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

async function deleteBus(req, res) {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ msg: 'Bus not found' });
    return res.json({ msg: 'Bus deleted' });
  } catch (err) {
    console.error('deleteBus error:', err);
    return res.status(500).json({ msg: 'Server error' });
  }
}

module.exports = {
  createBus,
  getAllBuses,
  getBus,
  updateBus,
  deleteBus
};
