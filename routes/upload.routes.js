const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middlewares/upload.middleware');
const uploadController = require('../controllers/upload.controller');

// Ruta: POST /api/upload/hito
// Espera un form-data con un campo llamado 'image'
router.post('/hito', uploadMiddleware.single('image'), uploadController.uploadHitoImage);

// Ruta: DELETE /api/upload/hito
// Elimina una imagen del servidor (cuando se cancela o remueve de la previsualización)
router.delete('/hito', uploadController.deleteHitoImage);

module.exports = router;
