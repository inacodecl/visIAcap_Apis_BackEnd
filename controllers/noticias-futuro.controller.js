/**
 * Archivo: controllers/noticias-futuro.controller.js
 * Descripción: Controlador para Noticias del Futuro.
 */

const NoticiasFuturoModel = require('../models/noticias-futuro.model');

const NoticiasFuturoController = {

    /** GET /api/futuro/noticias — Público, solo publicadas */
    async getAll(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const noticias = await NoticiasFuturoModel.findAll(lang, false);
            return res.json({ ok: true, data: noticias });
        } catch (error) {
            console.error('[NoticiasFuturoController] getAll:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al obtener las noticias.' } });
        }
    },

    /** GET /api/futuro/noticias/admin/list — Admin, incluye borradores */
    async getAllAdmin(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const noticias = await NoticiasFuturoModel.findAll(lang, true);
            return res.json({ ok: true, data: noticias });
        } catch (error) {
            console.error('[NoticiasFuturoController] getAllAdmin:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al obtener las noticias.' } });
        }
    },

    /** GET /api/futuro/noticias/:id */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const lang = req.query.lang || 'es';
            const noticia = await NoticiasFuturoModel.findById(id, lang);
            if (!noticia) {
                return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Noticia no encontrada.', userMessage: 'Esta noticia no existe.' } });
            }
            return res.json({ ok: true, data: noticia });
        } catch (error) {
            console.error('[NoticiasFuturoController] getById:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al obtener la noticia.' } });
        }
    },

    /** POST /api/futuro/noticias — Admin */
    async create(req, res) {
        try {
            const userId = req.user.id;
            const data = req.body;

            if (!data.titulo) {
                return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Falta campo titulo.', userMessage: 'El título es obligatorio.' } });
            }

            const newId = await NoticiasFuturoModel.create(data, userId);
            return res.status(201).json({ ok: true, data: { id: newId }, message: 'Noticia creada correctamente.' });
        } catch (error) {
            console.error('[NoticiasFuturoController] create:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al crear la noticia.' } });
        }
    },

    /** PUT /api/futuro/noticias/:id — Admin */
    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const success = await NoticiasFuturoModel.updateFull(id, req.body, userId);
            if (!success) {
                return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Noticia no encontrada.', userMessage: 'Esta noticia no existe.' } });
            }
            return res.json({ ok: true, message: 'Noticia actualizada correctamente.' });
        } catch (error) {
            console.error('[NoticiasFuturoController] update:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al actualizar la noticia.' } });
        }
    },

    /** DELETE /api/futuro/noticias/:id — Admin */
    async remove(req, res) {
        try {
            const { id } = req.params;
            const success = await NoticiasFuturoModel.delete(id);
            if (!success) {
                return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Noticia no encontrada.', userMessage: 'Esta noticia no existe.' } });
            }
            return res.json({ ok: true, message: 'Noticia eliminada correctamente.' });
        } catch (error) {
            console.error('[NoticiasFuturoController] remove:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al eliminar la noticia.' } });
        }
    }
};

module.exports = NoticiasFuturoController;
