/**
 * Archivo: controllers/entrevistas.controller.js
 * Descripción: Controlador que maneja la lógica de negocio para las Entrevistas.
 *              Recibe peticiones HTTP, valida (vía middlewares o lógica simple) y delega en EntrevistasModel.
 */

const EntrevistasModel = require('../models/entrevistas.model');
const { registrar } = require('../services/activityLog.service');

/**
 * Obtener lista de entrevistas públicas (solo visibles)
 */
exports.getEntrevistas = async (req, res) => {
    try {
        const lang = req.query.lang || 'es';
        const rows = await EntrevistasModel.findAllVisible(lang);
        console.log('DEBUG [getEntrevistas]: Entrevistas obtenidas correctamente', { count: rows.length, lang });
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener entrevistas' });
    }
};

/**
 * Obtener TODAS las entrevistas (Admin)
 */
exports.getAllEntrevistas = async (req, res) => {
    try {
        const rows = await EntrevistasModel.findAll();
        console.log('DEBUG [getAllEntrevistas]: Listado completo obtenido', { count: rows.length });
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener listado completo de entrevistas' });
    }
};

/**
 * Crear nueva entrevista (Admin)
 */
exports.createEntrevista = async (req, res) => {
    try {
        // ID de usuario gestionado por auth middleware
        const userId = req.user ? req.user.id : null;

        // La validación de campos obligatorios se delega al middleware 'validation.middleware'
        const id = await EntrevistasModel.create(req.body, userId);
        registrar(userId, 'crear', 'entrevistas', id, `Creó la entrevista: "${req.body.nombre || 'Sin título'}"`);
        res.status(201).json({ id, message: 'Entrevista creada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la entrevista' });
    }
};

/**
 * Actualizar entrevista completa (PUT)
 */
exports.updateEntrevista = async (req, res) => {
    const { id } = req.params;
    try {
        const userId = req.user ? req.user.id : null;
        const success = await EntrevistasModel.update(id, req.body, userId);
        if (!success) {
            return res.status(404).json({ message: 'Entrevista no encontrada' });
        }
        const entrevistaInfo = req.body.titulo || req.body.entrevistado || id;
        registrar(userId, 'editar', 'entrevistas', parseInt(id), `Editó la entrevista: "${entrevistaInfo}"`);
        res.json({ message: 'Entrevista actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar entrevista' });
    }
};

/**
 * Actualización parcial (PATCH)
 */
exports.patchEntrevista = async (req, res) => {
    const { id } = req.params;
    try {
        const userId = req.user ? req.user.id : null;
        // Verificación básica de que hay fields válidos delega en el modelo o se valida aquí si es crítica la respuesta 400
        const success = await EntrevistasModel.patch(id, req.body, userId);

        // Si el modelo devuelve false podría ser porque no encontró el ID o no hubo updates.
        // Asumimos 404 si es un error de ID.
        if (!success) {
            // Check si es porque no enviamos campos (eso ya debería estar validado, o el modelo retorna false si updates es vacio)
            // Aquí simplificamos para cumplir contrato.
            return res.status(404).json({ message: 'Entrevista no encontrada o sin cambios válidos' });
        }
        const entrevistaInfo = req.body.titulo || req.body.entrevistado || id;
        registrar(userId, 'editar', 'entrevistas', parseInt(id), `Editó parcialmente la entrevista: "${entrevistaInfo}"`);
        res.json({ message: 'Entrevista actualizada parcialmente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar entrevista (PATCH)' });
    }
};

/**
 * Eliminar entrevista
 */
exports.deleteEntrevista = async (req, res) => {
    const { id } = req.params;
    try {
        // Obtener info antes de eliminar para el log
        const entrevistaPre = await EntrevistasModel.findById(id);
        const entrevistaInfo = entrevistaPre ? (entrevistaPre.titulo || entrevistaPre.entrevistado) : id;

        const success = await EntrevistasModel.delete(id);
        if (!success) {
            return res.status(404).json({ message: 'Entrevista no encontrada' });
        }
        registrar(req.user?.id, 'eliminar', 'entrevistas', parseInt(id), `Eliminó la entrevista: "${entrevistaInfo}"`);
        res.json({ message: 'Entrevista eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar entrevista' });
    }
};
