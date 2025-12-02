const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

// Falta implementar los Middlewares

router.get('/', usuarioController.listarUsuarios);

module.exports = router;