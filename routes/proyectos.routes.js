/**
 * Archivo: routes/proyectos.routes.js
 * Descripción: Define las rutas REST para la entidad 'Proyectos'.
 */

const express = require('express');
const router = express.Router();
const ProyectosController = require('../controllers/proyectos.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// Rutas Públicas (Lectura)
router.get('/', ProyectosController.getProyectosPresente);
router.get('/:id', ProyectosController.getProyectoById);

// Rutas Privadas (Admin/SuperAdmin) - Escritura
router.post('/', verifyToken, verifyRole(['admin', 'super_admin']), ProyectosController.createProyecto);
router.put('/:id', verifyToken, verifyRole(['admin', 'super_admin']), ProyectosController.updateProyecto);
router.delete('/:id', verifyToken, verifyRole(['admin', 'super_admin']), ProyectosController.deleteProyecto);

module.exports = router;
