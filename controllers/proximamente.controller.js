/**
 * Archivo: controllers/proximamente.controller.js
 * Descripción: Controlador para eventos de "Próximamente".
 */

const ProximamenteModel = require('../models/proximamente.model');
const { registrar } = require('../services/activityLog.service');

const ProximamenteController = {

    /** GET /api/futuro/proximamente — Público */
    async getAll(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const eventos = await ProximamenteModel.findAll(lang, false);
            return res.json({ ok: true, data: eventos });
        } catch (error) {
            console.error('[ProximamenteController] getAll:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al obtener los eventos.' } });
        }
    },

    /** GET /api/futuro/proximamente/admin/list — Admin */
    async getAllAdmin(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const eventos = await ProximamenteModel.findAll(lang, true);
            return res.json({ ok: true, data: eventos });
        } catch (error) {
            console.error('[ProximamenteController] getAllAdmin:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al obtener los eventos.' } });
        }
    },

    /** GET /api/futuro/proximamente/:id */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const lang = req.query.lang || 'es';
            const evento = await ProximamenteModel.findById(id, lang);
            if (!evento) {
                return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado.', userMessage: 'Este evento no existe.' } });
            }
            return res.json({ ok: true, data: evento });
        } catch (error) {
            console.error('[ProximamenteController] getById:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al obtener el evento.' } });
        }
    },

    /** POST /api/futuro/proximamente — Admin */
    async create(req, res) {
        try {
            const userId = req.user.id;
            const data = req.body;

            if (!data.titulo) {
                return res.status(400).json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Falta campo titulo.', userMessage: 'El título es obligatorio.' } });
            }

            const newId = await ProximamenteModel.create(data, userId);
            registrar(userId, 'crear', 'proximamente', newId, `Creó evento Próximamente: "${data.titulo}"`);
            return res.status(201).json({ ok: true, data: { id: newId }, message: 'Evento creado correctamente.' });
        } catch (error) {
            console.error('[ProximamenteController] create:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al crear el evento.' } });
        }
    },

    /** PUT /api/futuro/proximamente/:id — Admin */
    async update(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const success = await ProximamenteModel.updateFull(id, req.body, userId);
            if (!success) {
                return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado.', userMessage: 'Este evento no existe.' } });
            }
            registrar(userId, 'editar', 'proximamente', parseInt(id), `Editó evento Próximamente #${id}`);
            return res.json({ ok: true, message: 'Evento actualizado correctamente.' });
        } catch (error) {
            console.error('[ProximamenteController] update:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al actualizar el evento.' } });
        }
    },

    /** DELETE /api/futuro/proximamente/:id — Admin */
    async remove(req, res) {
        try {
            const { id } = req.params;
            const success = await ProximamenteModel.delete(id);
            if (!success) {
                return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado.', userMessage: 'Este evento no existe.' } });
            }
            registrar(req.user?.id, 'eliminar', 'proximamente', parseInt(id), `Eliminó evento Próximamente #${id}`);
            return res.json({ ok: true, message: 'Evento eliminado correctamente.' });
        } catch (error) {
            console.error('[ProximamenteController] remove:', error);
            return res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: error.message, userMessage: 'Error al eliminar el evento.' } });
        }
    }
};

module.exports = ProximamenteController;
