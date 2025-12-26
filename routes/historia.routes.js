const express = require('express');
const router = express.Router();
const historiaController = require('../controllers/historia.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// Public
router.get('/', historiaController.getHistory);
router.get('/:id', historiaController.getHistoryById);

// Protegidas (Admin / SuperAdmin)
router.post('/', [verifyToken, verifyRole(['admin', 'super_admin'])], historiaController.createHistory);
router.put('/:id', [verifyToken, verifyRole(['admin', 'super_admin'])], historiaController.updateHistoryFull);
router.patch('/:id', [verifyToken, verifyRole(['admin', 'super_admin'])], historiaController.updateHistoryPartial);
router.delete('/:id', [verifyToken, verifyRole(['admin', 'super_admin'])], historiaController.deleteHistory);

module.exports = router;
