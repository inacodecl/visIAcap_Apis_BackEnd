const express = require('express');
const router = express.Router();
const entrevistasController = require('../controllers/entrevistas.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// Rutas Públicas
router.get('/', entrevistasController.getEntrevistas);

// Rutas Protegidas (Requieren Token)
//router.use(verifyToken);

// Obtener todas (Admin)
router.get('/all', verifyRole(['admin', 'super_admin']), entrevistasController.getAllEntrevistas);

// Crear (Admin)
router.post('/', verifyRole(['admin', 'super_admin']), entrevistasController.createEntrevista);

// Actualizar completa (Admin)
router.put('/:id', verifyRole(['admin', 'super_admin']), entrevistasController.updateEntrevista);

// Actualizar parcial (Admin)
router.patch('/:id', verifyRole(['admin', 'super_admin']), entrevistasController.patchEntrevista);

// Eliminar (Admin)
router.delete('/:id', verifyRole(['admin', 'super_admin']), entrevistasController.deleteEntrevista);

module.exports = router;
