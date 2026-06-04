const FeedbacksModel = require('../models/feedbacks.model');

const FeedbacksController = {
    /**
     * POST /api/feedbacks
     * Registra un nuevo comentario/sugerencia
     */
    async createFeedback(req, res) {
        try {
            const { rol, comentario } = req.body;

            // Validación de campos requeridos
            if (!rol || !comentario) {
                return res.status(400).json({ message: 'Todos los campos son obligatorios (rol, comentario).' });
            }

            // Validar que el rol sea uno de los permitidos
            const rolesValidos = ['docente', 'administrativo', 'estudiante'];
            if (!rolesValidos.includes(rol)) {
                return res.status(400).json({ message: 'El rol proporcionado no es válido.' });
            }

            // Validar largo del comentario
            if (comentario.trim().length < 5) {
                return res.status(400).json({ message: 'El comentario debe tener al menos 5 caracteres.' });
            }

            const feedbackId = await FeedbacksModel.create(rol, comentario);
            
            res.status(201).json({
                message: 'Sugerencia enviada correctamente',
                id: feedbackId
            });
        } catch (error) {
            console.error('Error al registrar feedback:', error);
            res.status(500).json({ message: 'Error interno del servidor al enviar la sugerencia.' });
        }
    },

    /**
     * GET /api/feedbacks
     * Obtiene el listado completo de feedbacks (Solo Admin / SuperAdmin)
     */
    async getFeedbacks(req, res) {
        try {
            const data = await FeedbacksModel.findAll();
            res.json({ data });
        } catch (error) {
            console.error('Error al obtener feedbacks:', error);
            res.status(500).json({ message: 'Error interno del servidor al obtener las sugerencias.' });
        }
    },

    /**
     * DELETE /api/feedbacks/:id
     * Elimina un feedback por ID (Solo SuperAdmin / Admin)
     */
    async deleteFeedback(req, res) {
        try {
            const { id } = req.params;
            const success = await FeedbacksModel.delete(id);

            if (!success) {
                return res.status(404).json({ message: 'Sugerencia no encontrada o ya eliminada.' });
            }

            res.json({ message: 'Sugerencia eliminada correctamente.' });
        } catch (error) {
            console.error('Error al eliminar feedback:', error);
            res.status(500).json({ message: 'Error interno del servidor al eliminar la sugerencia.' });
        }
    }
};

module.exports = FeedbacksController;
