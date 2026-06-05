const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * Endpoint para obtener métricas de tráfico desde GA4
 * GET /api/admin/metricas
 */
router.get('/metricas', analyticsController.getMetricas);

module.exports = router;
