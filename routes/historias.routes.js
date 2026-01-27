/**
 * Archivo: routes/historias.routes.js
 * Descripción: Define las rutas REST para el recurso 'history' (historias).
 *              Mapea endpoints HTTP a métodos del controlador HistoriasController.
 */

const express = require('express');
const router = express.Router();
const historiasController = require('../controllers/historias.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Rutas Públicas
router.get('/', historiasController.getHistory);
router.get('/:id', historiasController.getHistoryById);

// Rutas Protegidas (Para gestión del CMS)
router.post('/', verifyToken, historiasController.createHistory);
router.put('/:id', verifyToken, historiasController.updateHistoryFull);
router.patch('/:id', verifyToken, historiasController.updateHistoryPartial);
router.delete('/:id', verifyToken, historiasController.deleteHistory);

module.exports = router;
