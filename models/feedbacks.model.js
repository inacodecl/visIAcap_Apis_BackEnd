const db = require('../config/db');

const FeedbacksModel = {
    /**
     * Inserta una nueva sugerencia / comentario
     * @param {string} rol - Rol del autor ('docente', 'administrativo', 'estudiante')
     * @param {string} comentario - Texto de la sugerencia
     */
    async create(rol, comentario) {
        const query = `INSERT INTO feedbacks (rol, comentario) VALUES (?, ?)`;
        const [result] = await db.query(query, [rol, comentario]);
        return result.insertId;
    },

    /**
     * Obtiene todas las sugerencias ordenadas por fecha descendente
     */
    async findAll() {
        const query = `
            SELECT id, rol, comentario, created_at
            FROM feedbacks
            ORDER BY created_at DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    /**
     * Elimina una sugerencia física por ID
     * @param {number} id - ID de la sugerencia
     */
    async delete(id) {
        const query = `DELETE FROM feedbacks WHERE id = ?`;
        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = FeedbacksModel;
