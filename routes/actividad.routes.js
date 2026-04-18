/**
 * Archivo: routes/actividad.routes.js
 * Descripción: Ruta protegida para consultar la actividad propia del administrador.
 */

const express = require('express');
const router = express.Router();
const actividadController = require('../controllers/actividad.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');
const { generalLimiter } = require('../middlewares/rateLimiter');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/actividad/me — Obtener mi actividad con paginación
router.get('/me', generalLimiter, verifyRole(['admin', 'super_admin']), actividadController.getMyActivity);

module.exports = router;
