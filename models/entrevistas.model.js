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
        const [rows] = await db.query('SELECT * FROM entrevistas WHERE visible = TRUE ORDER BY fecha_grabacion DESC');
        return rows;
    },

    /**
     * Obtiene todas las entrevistas sin filtro de visibilidad (para administradores)
     */
    async findAll() {
        const [rows] = await db.query('SELECT * FROM entrevistas ORDER BY fecha_grabacion DESC');
        return rows;
    },

    /**
     * Crea una nueva entrevista
     * @param {Object} data - Objeto con los datos de la entrevista
     */
    async create(data) {
        const { titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible } = data;
        const [result] = await db.query(
            'INSERT INTO entrevistas (titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion || new Date(), visible !== undefined ? visible : true]
        );
        return result.insertId;
    },

    /**
     * Actualiza una entrevista completa por ID
     * @param {number} id - ID de la entrevista
     * @param {Object} data - Datos actualizados
     */
    async update(id, data) {
        const { titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible } = data;
        const [result] = await db.query(
            'UPDATE entrevistas SET titulo=?, entrevistado=?, descripcion=?, url_video=?, url_imagen=?, fecha_grabacion=?, visible=? WHERE id=?',
            [titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible, id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Actualiza parcialmente una entrevista (PATCH)
     * @param {number} id - ID de la entrevista
     * @param {Object} fields - Campos a actualizar
     */
    async patch(id, fields) {
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
