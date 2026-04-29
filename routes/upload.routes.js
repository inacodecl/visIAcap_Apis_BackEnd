const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middlewares/upload.middleware');
const uploadController = require('../controllers/upload.controller');

// Ruta: POST /api/upload/hito
// Espera un form-data con un campo llamado 'image'
router.post('/hito', uploadMiddleware.single('image'), uploadController.uploadHitoImage);

module.exports = router;
