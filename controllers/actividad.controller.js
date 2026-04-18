/**
 * Archivo: controllers/actividad.controller.js
 * Descripción: Controller para el endpoint de lectura de actividad propia.
 *              Solo permite ver la actividad del usuario autenticado (req.user.id).
 */

const ActividadLogModel = require('../models/actividad-log.model');

const ActividadController = {

    /**
     * GET /api/actividad/me?page=1&limit=15
     * Obtiene el historial de actividad del usuario autenticado con paginación
     * y métricas rápidas del día actual.
     */
    async getMyActivity(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;
            const offset = (page - 1) * limit;

            // Obtener datos y total en paralelo
            const [data, total, metricas] = await Promise.all([
                ActividadLogModel.findByUsuario(userId, limit, offset, cursor),
                ActividadLogModel.countByUsuario(userId),
                ActividadLogModel.getMetricasHoy(userId)
            ]);

            // Determinar el proximo cursor
            let nextCursor = null;
            if (data.length === limit && data[data.length - 1]) {
                nextCursor = data[data.length - 1].id;
            }

            res.json({
                data,
                metricas,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                    nextCursor
                }
            });

        } catch (error) {
            console.error('Error obteniendo actividad:', error);
            res.status(500).json({ message: 'Error interno al obtener actividad' });
        }
    }
};

module.exports = ActividadController;
