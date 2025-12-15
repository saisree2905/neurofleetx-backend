// src/routes/buses.js
const express = require('express');
const busController = require('../controllers/busController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/', (req, res, next) => {
    // This is a valid, working Express route handler
    res.status(200).json({ status: "OK", message: "Bus API Route Works! Router Fixed." });
});

// Keep the other public route for now, assuming it is defined correctly
router.get('/:id', (req, res, next) => busController.getBus(req, res, next));

// Protected - admin for create/update/delete
router.post('/', auth.verifyToken, auth.requireRole('admin'), (req, res, next) => busController.createBus(req, res).catch(next));
router.put('/:id', auth.verifyToken, auth.requireRole('admin'), (req, res, next) => busController.updateBus(req, res).catch(next));
router.delete('/:id', auth.verifyToken, auth.requireRole('admin'), (req, res, next) => busController.deleteBus(req, res).catch(next));

module.exports = router;
