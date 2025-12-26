const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Crear Usuario (Solo SuperAdmin)
 */
const createUser = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol = 'viewer' } = req.body;

        // Validaciones básicas
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // Verificar si existe email
        const [exists] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (exists.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        // Encriptar password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insertar usuario
        const [result] = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol) VALUES (?, ?, ?, ?, ?)`,
            [nombre, apellido, email, passwordHash, rol]
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            id: result.insertId
        });

    } catch (error) {
        console.error('Error creando usuario:', error);
        res.status(500).json({ message: 'Error interno al crear usuario' });
    }
};

/**
 * Listar Usuarios con Paginación y Filtro
 * GET /?page=1&limit=10&rol=admin
 */
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const rolFilter = req.query.rol;

        let query = 'SELECT id, nombre, apellido, email, rol, is_active, last_login_at, created_at FROM usuarios';
        const queryParams = [];

        if (rolFilter) {
            query += ' WHERE rol = ?';
            queryParams.push(rolFilter);
        }

        // Contar total para paginación
        const countQuery = `SELECT COUNT(*) as total FROM usuarios ${rolFilter ? 'WHERE rol = ?' : ''}`;
        const [totalResult] = await pool.query(countQuery, queryParams);
        const totalUsers = totalResult[0].total;

        // Agregar NO paginación si limit es -1 (opcional), pero por defecto paginamos
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [rows] = await pool.query(query, queryParams);

        res.json({
            data: rows,
            meta: {
                total: totalUsers,
                page,
                limit,
                totalPages: Math.ceil(totalUsers / limit)
            }
        });

    } catch (error) {
        console.error('Error listando usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

/**
 * Obtener usuario por ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(
            'SELECT id, nombre, apellido, email, rol, is_active, last_login_at, created_at FROM usuarios WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo usuario:', error);
        res.status(500).json({ message: 'Error interno' });
    }
};

/**
 * Actualización Parcial de Usuario (Roles / Estado)
 * Solo SuperAdmin puede cambiar roles o desactivar usuarios.
 */
const updateUserPartial = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol, is_active } = req.body;

        // Validar que venga al menos un campo
        if (rol === undefined && is_active === undefined) {
            return res.status(400).json({ message: 'No se enviaron campos para actualizar (rol, is_active)' });
        }

        const updates = [];
        const values = [];

        if (rol !== undefined) {
            updates.push('rol = ?');
            values.push(rol);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        values.push(id);

        const query = `UPDATE usuarios SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;

        const [result] = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ message: 'Usuario actualizado exitosamente' });

    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUserPartial
};