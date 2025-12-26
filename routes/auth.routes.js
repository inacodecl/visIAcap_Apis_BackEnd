const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Definir rutas de autenticación
router.post('/login', authController.login);

module.exports = router;
