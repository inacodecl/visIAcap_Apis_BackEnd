const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

/**
 * Endpoint para obtener métricas de tráfico consolidadas desde GA4
 * GET /api/admin/metricas
 */
router.get('/metricas', analyticsController.getMetricas);

/**
 * Endpoint para obtener métricas de tráfico en tiempo real (últimos 30 minutos)
 * GET /api/admin/metricas/tiempo-real
 */
router.get('/metricas/tiempo-real', analyticsController.getRealtimeMetricas);

module.exports = router;