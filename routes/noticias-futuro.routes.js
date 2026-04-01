/**
 * Archivo: routes/noticias-futuro.routes.js
 * Descripción: Rutas REST para Noticias del Futuro.
 */

const express = require('express');
const router = express.Router();
const NoticiasFuturoController = require('../controllers/noticias-futuro.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// Admin — lectura (antes de /:id para evitar colisión)
router.get('/admin/list', verifyToken, verifyRole(['admin', 'super_admin']), NoticiasFuturoController.getAllAdmin);

// Público — lectura
router.get('/',    NoticiasFuturoController.getAll);
router.get('/:id', NoticiasFuturoController.getById);

// Admin — escritura
router.post('/',    verifyToken, verifyRole(['admin', 'super_admin']), NoticiasFuturoController.create);
router.put('/:id',  verifyToken, verifyRole(['admin', 'super_admin']), NoticiasFuturoController.update);
router.delete('/:id', verifyToken, verifyRole(['admin', 'super_admin']), NoticiasFuturoController.remove);

module.exports = router;
