/**
 * Archivo: models/usuarios.model.js
 * Descripción: Modelo encargado de la gestión de datos de la tabla 'usuarios'.
 *              Incluye métodos para CRUD, búsqueda por email y gestión de roles.
 */

const db = require('../config/db');

const UsuariosModel = {
    /**
     * Busca un usuario por su email (Útil para login y validación de duplicados)
     * @param {string} email 
     */
    async findByEmail(email) {
        const [rows] = await db.query('SELECT id, email FROM usuarios WHERE email = ?', [email]);
        return rows[0];
    },

    /**
     * Crea un nuevo usuario
     * @param {Object} userData - Datos { nombre, apellido, email, password_hash, rol }
     */
    async create(userData) {
        const { nombre, apellido, email, password_hash, rol } = userData;
        const [result] = await db.query(
            `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol) VALUES (?, ?, ?, ?, ?)`,
            [nombre, apellido, email, password_hash, rol]
        );
        return result.insertId;
    },

    /**
     * Obtiene usuarios con paginación y filtro opcional por rol
     * @param {number} limit 
     * @param {number} offset 
     * @param {string} rolFilter 
     */
    async findAll(limit, offset, rolFilter) {
        let query = 'SELECT id, nombre, apellido, email, rol, is_active, last_login_at, created_at FROM usuarios';
        const queryParams = [];

        if (rolFilter) {
            query += ' WHERE rol = ?';
            queryParams.push(rolFilter);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await db.query(query, queryParams);
        return rows;
    },

    /**
     * Cuenta el total de usuarios (para metadatos de paginación)
     * @param {string} rolFilter 
     */
    async count(rolFilter) {
        const countQuery = `SELECT COUNT(*) as total FROM usuarios ${rolFilter ? 'WHERE rol = ?' : ''}`;
        const params = rolFilter ? [rolFilter] : [];
        const [result] = await db.query(countQuery, params);
        return result[0].total;
    },

    /**
     * Busca usuario por ID
     * @param {number} id 
     */
    async findById(id) {
        const [rows] = await db.query(
            'SELECT id, nombre, apellido, email, rol, is_active, last_login_at, created_at FROM usuarios WHERE id = ?',
            [id]
        );
        return rows[0];
    },

    /**
     * Actualización parcial de usuario
     * @param {number} id 
     * @param {Object} updates - Objeto { campo: valor }
     */
    async update(id, updates) {
        const fields = Object.keys(updates);
        if (fields.length === 0) return false;

        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = Object.values(updates);
        values.push(id);

        const query = `UPDATE usuarios SET ${setClause}, updated_at = NOW() WHERE id = ?`;
        const [result] = await db.query(query, values);
        return result.affectedRows > 0;
    },

    /**
     * Elimina un usuario físicamente de la base de datos (Requiere validación previa de roles)
     * @param {number} id 
     */
    async delete(id) {
        const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
};

module.exports = UsuariosModel;
