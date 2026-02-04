const express = require('express');
const router = express.Router();
const MetadataController = require('../controllers/metadata.controller');

// Rutas Públicas (usadas tanto en Admin como en Web Pública)
router.get('/tags', MetadataController.getTags);
router.post('/tags', MetadataController.createTag);
router.delete('/tags/:id', MetadataController.deleteTag);

router.get('/categorias', MetadataController.getCategorias);
router.post('/categorias', MetadataController.createCategoria);
router.delete('/categorias/:id', MetadataController.deleteCategoria);

module.exports = router;
