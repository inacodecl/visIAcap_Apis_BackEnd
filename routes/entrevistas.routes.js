/**
 * Archivo: routes/entrevistas.routes.js
 * Descripción: Define las rutas REST para el recurso 'entrevistas'.
 *              Mapea endpoints HTTP a métodos del controlador EntrevistasController.
 */

const express = require('express');
const router = express.Router();
const entrevistasController = require('../controllers/entrevistas.controller');
const { validateRequiredFields } = require('../middlewares/validation.middleware');
// TODO: Importar authMiddleware cuando estemos listos para proteger rutas

// Rutas Públicas
router.get('/', entrevistasController.getEntrevistas);

// Rutas Admin (Protegidas)
// router.use(verifyToken); // Descomentar para activar protección global en estas rutas
// router.use(verifyRole(['admin', 'superadmin']));

router.get('/all', entrevistasController.getAllEntrevistas);

// Validación de body antes de llamar al controlador
router.post('/',
    validateRequiredFields(['titulo', 'entrevistado', 'url_video', 'url_imagen']),
    entrevistasController.createEntrevista
);

router.put('/:id',
    validateRequiredFields(['titulo', 'entrevistado', 'url_video', 'url_imagen']),
    entrevistasController.updateEntrevista
);

router.patch('/:id', entrevistasController.patchEntrevista);

router.delete('/:id', entrevistasController.deleteEntrevista);

module.exports = router;
