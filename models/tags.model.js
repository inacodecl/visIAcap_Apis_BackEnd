const db = require('../config/db');

const TagsModel = {
    /**
     * Obtiene todos los tags
     * @param {string} lang - Idioma para el nombre ('es' o 'en')
     */
    async findAll(lang = 'es') {
        const nombreField = lang === 'en' ? 'nombre_en' : 'nombre_es';

        const query = `
            SELECT t.id, t.slug, t.${nombreField} as nombre
            FROM tags t
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
        const query = `INSERT INTO tags (slug, nombre_es, nombre_en) VALUES (?, ?, ?)`;
        const [result] = await db.query(query, [slug, nombre_es, nombre_en]);
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
