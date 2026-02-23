const db = require('../config/db');

const TagsModel = {
    /**
     * Obtiene todos los tags
     * @param {string} lang - Idioma para el nombre ('es' o 'en')
     */
    async findAll(lang = 'es') {
        const nombreField = lang === 'en' ? 'nombre_en' : 'nombre_es';

        const query = `
            SELECT t.id, t.slug, t.${nombreField} as nombre,
                   t.created_at, t.updated_at, t.created_by, t.updated_by,
                   uc.email AS creator_email, 
                   uu.email AS updater_email 
            FROM tags t
            LEFT JOIN usuarios uc ON t.created_by = uc.id 
            LEFT JOIN usuarios uu ON t.updated_by = uu.id
            ORDER BY t.${nombreField} ASC
        `;

        const [rows] = await db.query(query);
        return rows;
    },

    /**
     * Crea un nuevo tag
     * @param {string} slug 
     * @param {string} nombre_es 
     * @param {string} nombre_en 
     * @param {number} userId - ID del creador (Golden Standard)
     */
    async create(slug, nombre_es, nombre_en, userId = null) {
        const query = `INSERT INTO tags (slug, nombre_es, nombre_en, created_by, updated_by) VALUES (?, ?, ?, ?, ?)`;
        const [result] = await db.query(query, [slug, nombre_es, nombre_en, userId, userId]);
        return result.insertId;
    },

    /**
     * Elimina un tag por ID
     * @param {number} id 
     */
    async delete(id) {
        // Asume ON DELETE CASCADE en tablas pivote o manejo manual si falla
        const query = `DELETE FROM tags WHERE id = ?`;
        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = TagsModel;
