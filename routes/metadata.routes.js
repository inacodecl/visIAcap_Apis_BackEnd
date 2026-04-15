const express = require('express');
const router = express.Router();
const MetadataController = require('../controllers/metadata.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

const adminMiddleware = [verifyToken, verifyRole(['admin', 'super_admin'])];

// Tags
router.get('/tags', MetadataController.getTags); // Público (necesario para el formulario de proyectos)
router.post('/tags', ...adminMiddleware, MetadataController.createTag);
router.delete('/tags/:id', ...adminMiddleware, MetadataController.deleteTag);

// Categorías
router.get('/categorias', MetadataController.getCategorias); // Público (necesario para filtros)
router.post('/categorias', ...adminMiddleware, MetadataController.createCategoria);
router.delete('/categorias/:id', ...adminMiddleware, MetadataController.deleteCategoria);

module.exports = router;
