// src/routes/buses.js
const express = require('express');
const busController = require('../controllers/busController');
const auth = require('../middlewares/auth');

const router = express.Router();

// Public read
router.get('/', (req, res, next) => busController.getAllBuses(req, res).catch(next));
router.get('/:id', (req, res, next) => busController.getBus(req, res).catch(next));

// Protected - admin for create/update/delete
router.post('/', auth.verifyToken, auth.requireRole('admin'), (req, res, next) => busController.createBus(req, res).catch(next));
router.put('/:id', auth.verifyToken, auth.requireRole('admin'), (req, res, next) => busController.updateBus(req, res).catch(next));
router.delete('/:id', auth.verifyToken, auth.requireRole('admin'), (req, res, next) => busController.deleteBus(req, res).catch(next));

module.exports = router;
