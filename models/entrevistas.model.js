/**
 * Archivo: models/entrevistas.model.js
 * Descripción: Modelo encargado de interactuar directamente con la tabla 'entrevistas' de la base de datos.
 *              Contiene toda la lógica SQL para CRUD y filtros.
 */

const db = require('../config/db');

const EntrevistasModel = {
    /**
     * Obtiene todas las entrevistas visibles (para usuarios públicos)
     */
    async findAllVisible() {
        const query = `
            SELECT e.*, 
                   uc.email AS creator_email, 
                   uu.email AS updater_email 
            FROM entrevistas e 
            LEFT JOIN usuarios uc ON e.created_by = uc.id 
            LEFT JOIN usuarios uu ON e.updated_by = uu.id
            WHERE e.visible = TRUE 
            ORDER BY e.fecha_grabacion DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    /**
     * Obtiene todas las entrevistas sin filtro de visibilidad (para administradores)
     */
    async findAll() {
        const query = `
            SELECT e.*, 
                   uc.email AS creator_email, 
                   uu.email AS updater_email 
            FROM entrevistas e 
            LEFT JOIN usuarios uc ON e.created_by = uc.id 
            LEFT JOIN usuarios uu ON e.updated_by = uu.id
            ORDER BY e.fecha_grabacion DESC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    /**
     * Crea una nueva entrevista
     * @param {Object} data - Objeto con los datos de la entrevista
     * @param {number} userId - ID del usuario creador (Golden Standard)
     */
    async create(data, userId = null) {
        const { titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible } = data;
        const [result] = await db.query(
            'INSERT INTO entrevistas (titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion || new Date(), visible !== undefined ? visible : true, userId, userId]
        );
        return result.insertId;
    },

    /**
     * Actualiza una entrevista completa por ID
     * @param {number} id - ID de la entrevista
     * @param {Object} data - Datos actualizados
     * @param {number} userId - ID del usuario que actualiza
     */
    async update(id, data, userId = null) {
        const { titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible } = data;
        const [result] = await db.query(
            'UPDATE entrevistas SET titulo=?, entrevistado=?, descripcion=?, url_video=?, url_imagen=?, fecha_grabacion=?, visible=?, updated_by=? WHERE id=?',
            [titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible, userId, id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Actualiza parcialmente una entrevista (PATCH)
     * @param {number} id - ID de la entrevista
     * @param {Object} fields - Campos a actualizar
     * @param {number} userId - ID del usuario que actualiza
     */
    async patch(id, fields, userId = null) {
        const allowedFields = ['titulo', 'entrevistado', 'descripcion', 'url_video', 'url_imagen', 'fecha_grabacion', 'visible'];
        const updates = [];
        const values = [];

        for (const key in fields) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = ?`);
                values.push(fields[key]);
            }
        }

        if (updates.length === 0) return false;

        // Golden Standard: Siempre actualizar updated_by en PATCH
        updates.push('updated_by = ?');
        values.push(userId);

        values.push(id);
        const query = `UPDATE entrevistas SET ${updates.join(', ')} WHERE id = ?`;

        const [result] = await db.query(query, values);
        return result.affectedRows > 0;
    },

    /**
     * Elimina una entrevista por ID
     * @param {number} id 
     */
    async delete(id) {
        const [result] = await db.query('DELETE FROM entrevistas WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = EntrevistasModel;
