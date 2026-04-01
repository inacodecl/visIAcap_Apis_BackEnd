/**
 * Archivo: controllers/este-mes.controller.js
 * Descripción: Controlador para eventos de "Este Mes".
 */

const EsteMesModel = require('../models/este-mes.model');

const EsteMesController = {

    /** GET /api/futuro/este-mes — Público */
    async getAll(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const eventos = await EsteMesModel.findAll(lang, false);
            return res.json({ ok: true, data: eventos });
        } catch (error) {
            console.error('[EsteMesController] getAll:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al obtener los eventos.' } });
        }
    },

    /** GET /api/futuro/este-mes/admin/list — Admin */
    async getAllAdmin(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const eventos = await EsteMesModel.findAll(lang, true);
            return res.json({ ok: true, data: eventos });
        } catch (error) {
            console.error('[EsteMesController] getAllAdmin:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al obtener los eventos.' } });
        }
    },

    /** GET /api/futuro/este-mes/:id */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const lang = req.query.lang || 'es';
            const evento = await EsteMesModel.findById(id, lang);
            if (!evento) {
                return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado.', userMessage: 'Este evento no existe.' } });
            }
            return res.json({ ok: true, data: evento });
        } catch (error) {
            console.error('[EsteMesController] getById:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al obtener el evento.' } });
        }
    },

    /** POST /api/futuro/este-mes — Admin */
    async create(req, res) {
        try {
            const userId = req.user.id;
            const data = req.body;

            if (!data.titulo || !data.dia || !data.mes) {
                return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Faltan campos obligatorios.', userMessage: 'Título, día y mes son obligatorios.' } });
            }

            const newId = await EsteMesModel.create(data, userId);
            return res.status(201).json({ ok: true, data: { id: newId }, message: 'Evento creado correctamente.' });
        } catch (error) {
            console.error('[EsteMesController] create:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al crear el evento.' } });
        }
    },

    /** PUT /api/futuro/este-mes/:id — Admin */
    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const success = await EsteMesModel.updateFull(id, req.body, userId);
            if (!success) {
                return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado.', userMessage: 'Este evento no existe.' } });
            }
            return res.json({ ok: true, message: 'Evento actualizado correctamente.' });
        } catch (error) {
            console.error('[EsteMesController] update:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al actualizar el evento.' } });
        }
    },

    /** DELETE /api/futuro/este-mes/:id — Admin */
    async remove(req, res) {
        try {
            const { id } = req.params;
            const success = await EsteMesModel.delete(id);
            if (!success) {
                return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado.', userMessage: 'Este evento no existe.' } });
            }
            return res.json({ ok: true, message: 'Evento eliminado correctamente.' });
        } catch (error) {
            console.error('[EsteMesController] remove:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al eliminar el evento.' } });
        }
    }
};

module.exports = EsteMesController;
