const express = require('express');
const router = express.Router();
const feedbacksController = require('../controllers/feedbacks.controller');
const { verifyToken, verifyRole } = require('../middlewares/auth.middleware');

// POST /api/feedbacks — Registrar un nuevo comentario/sugerencia (Público)
router.post('/', feedbacksController.createFeedback);

// GET /api/feedbacks — Listar todas las sugerencias (Privado, Admin/SuperAdmin)
router.get('/', verifyToken, verifyRole(['admin', 'super_admin']), feedbacksController.getFeedbacks);

// DELETE /api/feedbacks/:id — Eliminar una sugerencia (Privado, Solo SuperAdmin)
router.delete('/:id', verifyToken, verifyRole(['admin','super_admin']), feedbacksController.deleteFeedback);

module.exports = router;
