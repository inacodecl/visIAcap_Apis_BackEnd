/**
 * Archivo: routes/historias.routes.js
 * Descripción: Define las rutas REST para el recurso 'history' (historias).
 *              Mapea endpoints HTTP a métodos del controlador HistoriasController.
 */

const express = require('express');
const router = express.Router();
const historiasController = require('../controllers/historias.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// Rutas Públicas
router.get('/', historiasController.getHistory);
router.get('/:id', historiasController.getHistoryById);

// Rutas Protegidas (Solo Admin/SuperAdmin pueden gestionar el CMS)
router.post('/', verifyToken, verifyRole(['admin', 'super_admin']), historiasController.createHistory);
router.put('/:id', verifyToken, verifyRole(['admin', 'super_admin']), historiasController.updateHistoryFull);
router.patch('/:id', verifyToken, verifyRole(['admin', 'super_admin']), historiasController.updateHistoryPartial);
router.delete('/:id', verifyToken, verifyRole(['admin', 'super_admin']), historiasController.deleteHistory);

module.exports = router;
