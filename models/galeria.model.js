const db = require('../config/db');

const GaleriaModel = {
    /**
     * Obtiene todas las imágenes de la galería
     * @param {boolean} includeHidden - Si es true, incluye imágenes no visibles
     */
    async findAll(includeHidden = false) {
        let query = 'SELECT * FROM galeria';
        if (!includeHidden) {
            query += ' WHERE visible = 1';
        }
        query += ' ORDER BY order_index ASC, anio DESC, created_at DESC';
        
        const [rows] = await db.query(query);
        return rows;
    },

    /**
     * Obtiene una imagen por ID
     * @param {number} id 
     */
    async findById(id) {
        const [rows] = await db.query('SELECT * FROM galeria WHERE id = ?', [id]);
        return rows[0];
    },

    /**
     * Crea una nueva imagen en la galería
     * @param {Object} data - Datos de la imagen { url, anio, visible, order_index }
     */
    async create(data) {
        const { url, anio, visible = 1, order_index = 0 } = data;
        
        const [result] = await db.query(
            'INSERT INTO galeria (url, anio, visible, order_index) VALUES (?, ?, ?, ?)',
            [url, anio, visible, order_index]
        );
        
        return result.insertId;
    },

    /**
     * Actualiza una imagen existente
     * @param {number} id 
     * @param {Object} data 
     */
    async update(id, data) {
        const fields = [];
        const values = [];

        ['url', 'anio', 'visible', 'order_index'].forEach(field => {
            if (data[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(data[field]);
            }
        });

        if (fields.length === 0) return true;

        const query = `UPDATE galeria SET ${fields.join(', ')} WHERE id = ?`;
        values.push(id);

        const [result] = await db.query(query, values);
        return result.affectedRows > 0;
    },

    /**
     * Elimina una imagen de la galería
     * @param {number} id 
     */
    async delete(id) {
        const [result] = await db.query('DELETE FROM galeria WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = GaleriaModel;
