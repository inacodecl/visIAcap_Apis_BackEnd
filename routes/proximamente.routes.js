/**
 * Archivo: routes/proximamente.routes.js
 * Descripción: Rutas REST para eventos de "Próximamente".
 */

const express = require('express');
const router = express.Router();
const ProximamenteController = require('../controllers/proximamente.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// Admin — lectura
router.get('/admin/list', verifyToken, verifyRole(['admin', 'super_admin']), ProximamenteController.getAllAdmin);

// Público — lectura
router.get('/',    ProximamenteController.getAll);
router.get('/:id', ProximamenteController.getById);

// Admin — escritura
router.post('/',    verifyToken, verifyRole(['admin', 'super_admin']), ProximamenteController.create);
router.put('/:id',  verifyToken, verifyRole(['admin', 'super_admin']), ProximamenteController.update);
router.delete('/:id', verifyToken, verifyRole(['admin', 'super_admin']), ProximamenteController.remove);

module.exports = router;
