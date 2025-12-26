const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Listar usuarios (Admin / SuperAdmin)
router.get('/', verifyRole(['admin', 'super_admin']), usuarioController.getUsers);

// Obtener detalle (Admin / SuperAdmin)
router.get('/:id', verifyRole(['admin', 'super_admin']), usuarioController.getUserById);

// Crear usuario (Solo SuperAdmin)
router.post('/', verifyRole(['super_admin']), usuarioController.createUser);

// Actualizar usuario parcialmente (Solo SuperAdmin)
router.patch('/:id', verifyRole(['super_admin']), usuarioController.updateUserPartial);

module.exports = router;