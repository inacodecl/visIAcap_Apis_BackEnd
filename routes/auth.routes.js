const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authLimiter } = require('../middlewares/rateLimiter');

// Definir rutas de autenticación
router.post('/login', authLimiter, authController.login);

module.exports = router;
