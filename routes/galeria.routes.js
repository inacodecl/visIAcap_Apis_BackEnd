const express = require('express');
const router = express.Router();
const galeriaController = require('../controllers/galeria.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// Rutas Públicas
router.get('/', galeriaController.getGaleria);
router.get('/:id', galeriaController.getImagenById);

// Rutas Protegidas (Requieren autenticación y rol)
router.post('/', verifyToken, verifyRole(['admin', 'superadmin']), galeriaController.createImagen);
router.put('/:id', verifyToken, verifyRole(['admin', 'superadmin']), galeriaController.updateImagen);
router.delete('/:id', verifyToken, verifyRole(['admin', 'superadmin']), galeriaController.deleteImagen);

module.exports = router;
