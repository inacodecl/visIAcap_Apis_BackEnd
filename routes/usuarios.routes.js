/**
 * Archivo: routes/usuarios.routes.js
 * Descripción: Define las rutas REST para la gestión de 'usuarios'.
 */

const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');
const { validateRequiredFields } = require('../middlewares/validation.middleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// ─── Perfil propio (Admin / SuperAdmin) ───
// IMPORTANTE: /me debe ir ANTES de /:id para que Express no lo interprete como un ID
router.get('/me', verifyRole(['admin', 'super_admin']), usuariosController.getMyProfile);
router.put('/me', verifyRole(['admin', 'super_admin']), usuariosController.updateMyProfile);
router.post('/change-password', verifyRole(['admin', 'super_admin']), usuariosController.changePassword);

// Listar usuarios (Admin / SuperAdmin)
router.get('/', verifyRole(['admin', 'super_admin']), usuariosController.getUsers);

// Obtener detalle (Admin / SuperAdmin)
router.get('/:id', verifyRole(['admin', 'super_admin']), usuariosController.getUserById);

// Crear usuario (Solo SuperAdmin)
router.post('/',
    verifyRole(['super_admin']),
    validateRequiredFields(['nombre', 'apellido', 'email', 'password']),
    usuariosController.createUser
);

// Actualizar usuario parcialmente (Solo SuperAdmin)
router.patch('/:id', verifyRole(['super_admin']), usuariosController.updateUserPartial);

// Eliminar usuario (Solo SuperAdmin)
router.delete('/:id', verifyRole(['super_admin']), usuariosController.deleteUser);

module.exports = router;
