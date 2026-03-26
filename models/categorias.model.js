const db = require('../config/db');

const CategoriasModel = {
    /**
     * Obtiene todas las categorías
     * @param {string} lang - Idioma para el nombre ('es' o 'en')
     */
    async findAll(lang = 'es') {
        // Selección dinámica del campo de nombre según idioma
        const nombreField = lang === 'en' ? 'nombre_en' : 'nombre_es';

        const query = `
            SELECT c.id, c.slug, c.${nombreField} as nombre,
                   c.created_at
            FROM categorias c
            ORDER BY c.${nombreField} ASC
        `;

        const [rows] = await db.query(query);
        return rows;
    },

    /**
     * Crea una nueva categoría
     * @param {string} slug 
     * @param {string} nombre_es 
     * @param {string} nombre_en 
     * @param {number} userId - ID del creador (Golden Standard)
     */
    async create(slug, nombre_es, nombre_en, userId = null) {
        const query = `INSERT INTO categorias (slug, nombre_es, nombre_en) VALUES (?, ?, ?)`;
        const [result] = await db.query(query, [slug, nombre_es, nombre_en]);
        return result.insertId;
    },

    /**
     * Elimina una categoría por ID
     * @param {number} id 
     */
    async delete(id) {
        const query = `DELETE FROM categorias WHERE id = ?`;
        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = CategoriasModel;
