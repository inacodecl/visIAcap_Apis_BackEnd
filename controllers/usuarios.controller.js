/**
 * Descripción: Controlador para la gestión de usuarios (Creación, Listado, Modificación).
 *              Delega el acceso a datos a UsuariosModel.
 */

const bcrypt = require('bcryptjs');
const UsuariosModel = require('../models/usuarios.model');
const { registrar } = require('../services/activityLog.service');

/**
 * Crear Usuario (Solo SuperAdmin)
 */
const createUser = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol = 'viewer', telefono } = req.body;

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
            nombre, apellido, email, password_hash: passwordHash, rol, telefono
        });

        registrar(req.user?.id, 'crear', 'usuarios', newUserId, `Creó usuario: ${nombre} ${apellido} (${email})`);

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
        const { rol, is_active, nombre, apellido, telefono, password } = req.body;

        // Construir objeto de updates solo con lo definido
        const updates = {};
        if (rol !== undefined) updates.rol = rol;
        if (nombre !== undefined) updates.nombre = nombre.trim();
        if (apellido !== undefined) updates.apellido = apellido.trim();
        if (telefono !== undefined) updates.telefono = telefono.trim() || null;

        if (is_active !== undefined) {
            // Convertir a 1 (true) o 0 (false) para asegurar compatibilidad con TINYINT
            updates.is_active = (String(is_active) === 'true' || is_active === 1 || is_active === true) ? 1 : 0;
        }

        // Si se envía contraseña, encriptarla
        if (password && password.trim().length >= 6) {
            const salt = await bcrypt.genSalt(10);
            updates.password_hash = await bcrypt.hash(password, salt);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No se enviaron campos válidos para actualizar' });
        }

        const success = await UsuariosModel.update(id, updates);

        if (!success) {
            return res.status(404).json({ message: 'Usuario no encontrado o sin cambios' });
        }

        // Obtener nombre del usuario para el log si no se editó en esta petición
        let targetName = "";
        if (updates.nombre && updates.apellido) {
            targetName = `${updates.nombre} ${updates.apellido}`;
        } else {
            const userPre = await UsuariosModel.findById(id);
            targetName = userPre ? `${userPre.nombre} ${userPre.apellido}` : email || id;
        }

        registrar(req.user?.id, 'editar', 'usuarios', parseInt(id), `Modificó datos del usuario: ${targetName} (${updates.rol || 'sin cambio de rol'})`);
        res.json({ message: 'Usuario actualizado exitosamente' });

    } catch (error) {
        console.error('Error actualizando usuario:', error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

/**
 * Eliminar usuario (Físicamente)
 * Solo SuperAdmin puede eliminar.
 * Restricción: No puede eliminarse a sí mismo.
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const requestingUserId = req.user.id; // Asumiendo que verifyToken llena req.user

        // 1. Prevención de Auto-Eliminación (Anti-Suicidio Digital)
        if (parseInt(id) === requestingUserId) {
            return res.status(403).json({
                ok: false,
                error: {
                    code: 'ACTION_FORBIDDEN',
                    message: 'User attempted to delete themselves',
                    userMessage: 'No puedes eliminar tu propia cuenta.'
                }
            });
        }

        // 2. Verificar existencia
        const user = await UsuariosModel.findById(id);
        if (!user) {
            return res.status(404).json({
                ok: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: `User with id ${id} not found`,
                    userMessage: 'Usuario no encontrado.'
                }
            });
        }

        // 3. Eliminar
        const success = await UsuariosModel.delete(id);

        if (success) {
            registrar(requestingUserId, 'eliminar', 'usuarios', parseInt(id), `Eliminó el usuario: ${user.nombre} ${user.apellido} (${user.email})`);
            res.json({
                ok: true,
                message: 'Usuario eliminado correctamente'
            });
        } else {
            throw new Error('No se pudo eliminar el registro en BD');
        }

    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({
            ok: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message,
                userMessage: 'Error interno al intentar eliminar el usuario.'
            }
        });
    }
};

/**
 * Obtener datos del perfil propio (cualquier rol autenticado)
 * GET /api/usuarios/me
 * Usa req.user.id del JWT para obtener datos completos.
 */
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await require('../config/db').query(
            `SELECT id, nombre, apellido, email, telefono, avatar_url, 
                    rol, is_active, last_login_at, created_at, updated_at 
             FROM usuarios WHERE id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ message: 'Error interno al obtener perfil' });
    }
};

/**
 * Actualizar perfil propio (cualquier rol autenticado)
 * PUT /api/usuarios/me
 * Solo permite actualizar: nombre, apellido, telefono, avatar_url
 * NO permite cambiar: email, password, rol, is_active
 */
const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, apellido, telefono, avatar_url } = req.body;

        // Construir solo campos permitidos
        const updates = {};
        if (nombre !== undefined && nombre.trim()) updates.nombre = nombre.trim();
        if (apellido !== undefined && apellido.trim()) updates.apellido = apellido.trim();
        if (telefono !== undefined) updates.telefono = telefono.trim() || null;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url.trim() || null;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No se enviaron campos válidos para actualizar' });
        }

        const success = await UsuariosModel.update(userId, updates);

        if (!success) {
            return res.status(404).json({ message: 'Usuario no encontrado o sin cambios' });
        }

        // Devolver datos actualizados
        const [rows] = await require('../config/db').query(
            `SELECT id, nombre, apellido, email, telefono, avatar_url, 
                    rol, is_active, last_login_at, created_at, updated_at 
             FROM usuarios WHERE id = ?`,
            [userId]
        );

        registrar(userId, 'perfil', 'perfil', userId, 'Actualizó su perfil personal');

        res.json({
            message: 'Perfil actualizado exitosamente',
            user: rows[0]
        });

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ message: 'Error interno al actualizar perfil' });
    }
};

/**
 * Cambiar contraseña propia
 * POST /api/usuarios/change-password
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Contraseña actual y nueva son obligatorias' });
        }

        // 1. Obtener usuario con hash de contraseña
        const [users] = await require('../config/db').query(
            'SELECT password_hash FROM usuarios WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const user = users[0];

        // 2. Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        }

        // 3. Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar en BD
        await UsuariosModel.update(userId, { password_hash: passwordHash });

        registrar(userId, 'seguridad', 'usuarios', userId, 'Cambió su contraseña de acceso');

        res.json({ message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({ message: 'Error interno al cambiar contraseña' });
    }
};

module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUserPartial,
    deleteUser,
    getMyProfile,
    updateMyProfile,
    changePassword
};
