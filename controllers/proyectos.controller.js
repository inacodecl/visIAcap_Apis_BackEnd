/**
 * Archivo: controllers/proyectos.controller.js
 * Descripción: Controlador para la gestión de proyectos (Sección Presente).
 */

const ProyectosModel = require('../models/proyectos.model');
const { registrar } = require('../services/activityLog.service');

const ProyectosController = {

    /**
     * GET /api/proyectos
     * Obtiene proyectos. Filtra por tipo si se envía (ej: ?tipo=futuro).
     * Por defecto tipo='presente'.
     */
    async getAll(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const tipo = req.query.tipo || 'presente';

            const proyectos = await ProyectosModel.findAll(lang, tipo, false); // Solo publicados
            return res.json(proyectos);
        } catch (error) {
            console.error('Error en getAll:', error);
            return res.status(500).json({ message: 'Error interno del servidor al obtener proyectos.' });
        }
    },

    /**
     * GET /api/proyectos/admin/list
     * Obtiene TODOS los proyectos (publicados y borradores)
     */
    async getAllAdmin(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const tipo = req.query.tipo || 'all'; // Default: Traer TODOS para Admin

            const proyectos = await ProyectosModel.findAll(lang, tipo, true); // Incluye ocultos
            return res.json(proyectos);
        } catch (error) {
            console.error('Error en getAllAdmin:', error);
            return res.status(500).json({ message: 'Error interno al obtener proyectos admin.' });
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

            // Si no viene tipo, asumimos 'presente' (default mysql o lógica app)
            if (!data.tipo) data.tipo = 'presente';

            const newId = await ProyectosModel.create(data, userId);
            registrar(userId, 'crear', 'proyectos', newId, `Creó el proyecto: "${data.titulo || data.slug}"`);

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


            const success = await ProyectosModel.updateFull(id, data, userId);

            if (!success) {
                return res.status(404).json({ message: 'Proyecto no encontrado para actualizar.' });
            }

            const proyectoInfo = data.titulo || id;
            registrar(userId, 'editar', 'proyectos', parseInt(id), `Editó el proyecto: "${proyectoInfo}"`);
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
            // Obtener info antes de eliminar para el log
            const proyectoPre = await ProyectosModel.findById(id, 'es');
            const proyectoInfo = proyectoPre ? proyectoPre.titulo : id;

            const success = await ProyectosModel.delete(id);

            if (!success) {
                return res.status(404).json({ message: 'Proyecto no encontrado para eliminar.' });
            }

            registrar(req.user?.id, 'eliminar', 'proyectos', parseInt(id), `Eliminó el proyecto: "${proyectoInfo}"`);
            return res.json({ message: 'Proyecto eliminado correctamente.' });

        } catch (error) {
            console.error('Error en deleteProyecto:', error);
            return res.status(500).json({ message: 'Error interno al eliminar el proyecto.' });
        }
    }
};

module.exports = ProyectosController;
