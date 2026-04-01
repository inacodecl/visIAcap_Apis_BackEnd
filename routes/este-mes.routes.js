/**
 * Archivo: routes/este-mes.routes.js
 * Descripción: Rutas REST para eventos de "Este Mes".
 */

const express = require('express');
const router = express.Router();
const EsteMesController = require('../controllers/este-mes.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// Admin — lectura
router.get('/admin/list', verifyToken, verifyRole(['admin', 'super_admin']), EsteMesController.getAllAdmin);

// Público — lectura
router.get('/',    EsteMesController.getAll);
router.get('/:id', EsteMesController.getById);

// Admin — escritura
router.post('/',    verifyToken, verifyRole(['admin', 'super_admin']), EsteMesController.create);
router.put('/:id',  verifyToken, verifyRole(['admin', 'super_admin']), EsteMesController.update);
router.delete('/:id', verifyToken, verifyRole(['admin', 'super_admin']), EsteMesController.remove);

module.exports = router;
