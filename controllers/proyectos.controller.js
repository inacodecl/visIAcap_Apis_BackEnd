/**
 * Archivo: controllers/proyectos.controller.js
 * Descripción: Controlador para la gestión de proyectos (Sección Presente).
 */

const ProyectosModel = require('../models/proyectos.model');

const ProyectosController = {

    /**
     * GET /api/proyectos
     * Obtiene proyectos de tipo 'presente'
     */
    async getProyectosPresente(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const proyectos = await ProyectosModel.findAll(lang, 'presente');
            return res.json(proyectos);
        } catch (error) {
            console.error('Error en getProyectosPresente:', error);
            return res.status(500).json({ message: 'Error interno del servidor al obtener proyectos.' });
        }
    },

    /**
     * GET /api/proyectos/:id
     * Obtiene un proyecto por ID
     */
    async getProyectoById(req, res) {
        try {
            const { id } = req.params;
            const lang = req.query.lang || 'es';
            const proyecto = await ProyectosModel.findById(id, lang);

            if (!proyecto) {
                return res.status(404).json({ message: 'Proyecto no encontrado.' });
            }

            return res.json(proyecto);
        } catch (error) {
            console.error('Error en getProyectoById:', error);
            return res.status(500).json({ message: 'Error interno del servidor al obtener el proyecto.' });
        }
    },

    /**
     * POST /api/proyectos
     * Crea un nuevo proyecto (Admin)
     */
    async createProyecto(req, res) {
        try {
            const userId = req.user.id; // Del token
            const data = req.body;

            // Validaciones básicas
            if (!data.slug || !data.titulo) {
                return res.status(400).json({ message: 'Faltan campos obligatorios (slug, titulo).' });
            }

            // Forzar tipo 'presente' si no se envía, o validarlo
            // El requerimiento dice "informacion del boton presente", asumimos tipo=presente por defecto
            if (!data.tipo) data.tipo = 'presente';

            const newId = await ProyectosModel.create(data, userId);

            return res.status(201).json({
                message: 'Proyecto creado exitosamente.',
                id: newId
            });

        } catch (error) {
            console.error('Error en createProyecto:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'El slug ya existe.' });
            }
            return res.status(500).json({ message: 'Error interno al crear el proyecto.' });
        }
    },

    /**
     * PUT /api/proyectos/:id
     * Actualiza un proyecto existente (Admin)
     */
    async updateProyecto(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const data = req.body;

            // Validaciones básicas de existencia de datos a actualizar
            // (En un escenario real se validaría schema con Joi/Zod)

            const success = await ProyectosModel.updateFull(id, data, userId);

            if (!success) {
                return res.status(404).json({ message: 'Proyecto no encontrado para actualizar.' });
            }

            return res.json({ message: 'Proyecto actualizado correctamente.' });

        } catch (error) {
            console.error('Error en updateProyecto:', error);
            return res.status(500).json({ message: 'Error interno al actualizar el proyecto.' });
        }
    },

    /**
     * DELETE /api/proyectos/:id
     * Elimina un proyecto (Admin)
     */
    async deleteProyecto(req, res) {
        try {
            const { id } = req.params;

            const success = await ProyectosModel.delete(id);

            if (!success) {
                return res.status(404).json({ message: 'Proyecto no encontrado para eliminar.' });
            }

            return res.json({ message: 'Proyecto eliminado correctamente.' });

        } catch (error) {
            console.error('Error en deleteProyecto:', error);
            return res.status(500).json({ message: 'Error interno al eliminar el proyecto.' });
        }
    }
};

module.exports = ProyectosController;
