/**
 * Archivo: controllers/usuarios.controller.js
 * Descripción: Controlador para la gestión de usuarios (Creación, Listado, Modificación).
 *              Delega el acceso a datos a UsuariosModel.
 */

const bcrypt = require('bcryptjs');
const UsuariosModel = require('../models/usuarios.model');

/**
 * Crear Usuario (Solo SuperAdmin)
 */
const createUser = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol = 'viewer' } = req.body;

        // Validar dominio institucional
        if (!email.endsWith('@inacapmail.cl') && !email.endsWith('@inacap.cl')) {
            return res.status(400).json({ message: 'El correo debe ser institucional (@inacapmail.cl o @inacap.cl)' });
        }

        // Verificar existencia (Lógica de negocio)
        const existingUser = await UsuariosModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        // Encriptar password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear
        const newUserId = await UsuariosModel.create({
            nombre, apellido, email, password_hash: passwordHash, rol
        });

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            id: newUserId
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

        // Obtener datos y total
        const rows = await UsuariosModel.findAll(limit, offset, rolFilter);
        const totalUsers = await UsuariosModel.count(rolFilter);

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
        const user = await UsuariosModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(user);
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

        // Construir objeto de updates solo con lo definido
        const updates = {};
        if (rol !== undefined) updates.rol = rol;
        if (is_active !== undefined) updates.is_active = is_active;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No se enviaron campos para actualizar (rol, is_active)' });
        }

        const success = await UsuariosModel.update(id, updates);

        if (!success) {
            return res.status(404).json({ message: 'Usuario no encontrado o sin cambios' });
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
