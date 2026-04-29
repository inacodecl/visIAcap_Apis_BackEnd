const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middlewares/upload.middleware');
const uploadController = require('../controllers/upload.controller');

// Ruta: POST /api/upload/:folder
// Espera un form-data con un campo llamado 'image'
// :folder puede ser 'hitos', 'entrevistas', etc.
router.post('/:folder', uploadMiddleware.single('image'), uploadController.uploadImage);

// Ruta: DELETE /api/upload/:folder
// Elimina una imagen del servidor (cuando se cancela o remueve de la previsualización)
router.delete('/:folder', uploadController.deleteImage);

module.exports = router;
