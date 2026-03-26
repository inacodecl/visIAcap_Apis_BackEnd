/**
 * Archivo: models/entrevistas.model.js
 * Descripción: Modelo encargado de interactuar directamente con la tabla 'entrevistas' de la base de datos.
 *              Contiene toda la lógica SQL para CRUD y filtros.
 */

const db = require('../config/db');
const TranslationService = require('../services/translation.service');

const EntrevistasModel = {
    /**
     * Obtiene todas las entrevistas visibles (para usuarios públicos)
     * @param {string} lang - Código de idioma (es, en, ht)
     */
    async findAllVisible(lang = 'es') {
        const query = `
            SELECT e.*,
                   COALESCE(ei.titulo, e.titulo) AS titulo,
                   COALESCE(ei.entrevistado, e.entrevistado) AS entrevistado,
                   COALESCE(ei.descripcion, e.descripcion) AS descripcion
            FROM entrevistas e 
            LEFT JOIN entrevistas_i18n ei ON e.id = ei.entrevista_id AND ei.locale = ?
            WHERE e.visible = TRUE 
            ORDER BY e.fecha_grabacion DESC
        `;
        const [rows] = await db.query(query, [lang]);
        return rows;
    },

    /**
     * Obtiene todas las entrevistas sin filtro de visibilidad (para administradores)
     */
    async findAll() {
        const query = `
            SELECT e.*
            FROM entrevistas e 
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
        const { titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible, locale = 'es' } = data;
        const [result] = await db.query(
            'INSERT INTO entrevistas (titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion || new Date(), visible !== undefined ? visible : true]
        );
        const entrevistaId = result.insertId;

        // Auto-Traducción Inteligente
        if (locale === 'es') {
            this._runAutoTranslation(entrevistaId, { titulo, entrevistado, descripcion }, ['en', 'ht']);
        }

        return entrevistaId;
    },

    /**
     * Actualiza una entrevista completa por ID
     * @param {number} id - ID de la entrevista
     * @param {Object} data - Datos actualizados
     * @param {number} userId - ID del usuario que actualiza
     */
    async update(id, data, userId = null) {
        const { titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible, locale = 'es' } = data;
        const [result] = await db.query(
            'UPDATE entrevistas SET titulo=?, entrevistado=?, descripcion=?, url_video=?, url_imagen=?, fecha_grabacion=?, visible=? WHERE id=?',
            [titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible, id]
        );

        // Auto-Traducción Inteligente en Update
        if (locale === 'es' && result.affectedRows > 0) {
            this._runAutoTranslation(id, { titulo, entrevistado, descripcion }, ['en', 'ht']);
        }

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
    },

    /**
     * Lógica interna para ejecutar traducciones en segundo plano
     */
    async _runAutoTranslation(entrevistaId, fields, targetLocales) {
        try {
            const translations = await TranslationService.translateBatch(fields, targetLocales);
            
            for (const locale of targetLocales) {
                const { titulo, entrevistado, descripcion } = translations[locale];
                await db.query(
                    `INSERT INTO entrevistas_i18n (entrevista_id, locale, titulo, entrevistado, descripcion) 
                     VALUES (?, ?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), entrevistado = VALUES(entrevistado), descripcion = VALUES(descripcion)`,
                    [entrevistaId, locale, titulo, entrevistado, descripcion]
                );
            }
            console.log(`[EntrevistasModel] Auto-traducción completada para ID: ${entrevistaId}`);
        } catch (error) {
            console.error(`[EntrevistasModel] Fallo en auto-traducción:`, error);
        }
    }
};

module.exports = EntrevistasModel;
