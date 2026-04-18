/**
 * Archivo: models/actividad-log.model.js
 * Descripción: Modelo para consultar registros de actividad con paginación
 *              y métricas agregadas por usuario.
 */

const db = require('../config/db');

const ActividadLogModel = {

    /**
     * Obtiene el historial de actividad de un usuario con paginación Dual (Cursor u Offset).
     * @param {number} usuarioId - ID del usuario
     * @param {number} limit     - Registros por página
     * @param {number} offset    - Desplazamiento tradicional (fallback)
     * @param {number|null} cursor - ID del último registro visto (Cursor Pagination)
     * @returns {Promise<Array>} Lista de registros de actividad
     */
    async findByUsuario(usuarioId, limit = 15, offset = 0, cursor = null) {
        let query = `SELECT id, accion, modulo, entidad_id, descripcion, created_at 
                     FROM actividad_log 
                     WHERE usuario_id = ? `;
        const params = [usuarioId];

        if (cursor) {
            // Si usamos cursor, saltamos directo usando el Indice primario
            query += `AND id < ? `;
            params.push(cursor);
        }

        query += `ORDER BY id DESC LIMIT ? `;
        params.push(limit);

        // Solo aplicamos OFFSET si NO hay cursor y el offset es mayor a 0
        if (!cursor && offset > 0) {
            query += `OFFSET ?`;
            params.push(offset);
        }

        const [rows] = await db.query(query, params);
        return rows;
    },

    /**
     * Cuenta el total de registros de actividad de un usuario.
     * @param {number} usuarioId
     * @returns {Promise<number>}
     */
    async countByUsuario(usuarioId) {
        const [result] = await db.query(
            'SELECT COUNT(*) AS total FROM actividad_log WHERE usuario_id = ?',
            [usuarioId]
        );
        return result[0].total;
    },

    /**
     * Obtiene métricas rápidas del usuario para el día actual.
     * Retorna: total de acciones hoy + desglose por tipo de acción.
     * @param {number} usuarioId
     * @returns {Promise<Object>} { totalHoy, crear, editar, eliminar }
     */
    async getMetricasHoy(usuarioId) {
        const [rows] = await db.query(
            `SELECT accion, COUNT(*) AS total 
             FROM actividad_log 
             WHERE usuario_id = ? AND DATE(created_at) = CURDATE() 
             GROUP BY accion`,
            [usuarioId]
        );

        // Construir objeto de métricas
        const metricas = { totalHoy: 0, crear: 0, editar: 0, eliminar: 0 };
        for (const row of rows) {
            metricas.totalHoy += row.total;
            if (metricas.hasOwnProperty(row.accion)) {
                metricas[row.accion] = row.total;
            }
        }
        return metricas;
    }
};

module.exports = ActividadLogModel;
