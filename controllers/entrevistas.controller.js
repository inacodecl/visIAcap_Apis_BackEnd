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
        
        // Obtener la entrevista antes de actualizar para comparar la imagen
        const entrevistaPre = await EntrevistasModel.findById(id);

        const success = await EntrevistasModel.update(id, req.body, userId);
        if (!success) {
            return res.status(404).json({ message: 'Entrevista no encontrada' });
        }

        // Si se actualizó correctamente y la URL de la imagen cambió, borrar la anterior
        if (entrevistaPre && entrevistaPre.url_imagen && req.body.url_imagen && entrevistaPre.url_imagen !== req.body.url_imagen) {
            const { deleteImage } = require('../services/image.service');
            deleteImage(entrevistaPre.url_imagen);
            console.log(`[updateEntrevista] Imagen antigua eliminada por reemplazo: ${entrevistaPre.url_imagen}`);
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
        
        const entrevistaPre = await EntrevistasModel.findById(id);

        const success = await EntrevistasModel.patch(id, req.body, userId);

        if (!success) {
            return res.status(404).json({ message: 'Entrevista no encontrada o sin cambios válidos' });
        }

        // Si se envió un url_imagen nuevo en el PATCH y es distinto al anterior
        if (req.body.url_imagen !== undefined && entrevistaPre && entrevistaPre.url_imagen && entrevistaPre.url_imagen !== req.body.url_imagen) {
            const { deleteImage } = require('../services/image.service');
            deleteImage(entrevistaPre.url_imagen);
            console.log(`[patchEntrevista] Imagen antigua eliminada por reemplazo: ${entrevistaPre.url_imagen}`);
        }

        let entrevistaInfo = req.body.titulo || req.body.entrevistado;
        if (!entrevistaInfo) {
            entrevistaInfo = entrevistaPre ? (entrevistaPre.titulo || entrevistaPre.entrevistado) : id;
        }

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
        // Obtener info antes de eliminar para el log y para borrar la imagen
        const entrevistaPre = await EntrevistasModel.findById(id);
        const entrevistaInfo = entrevistaPre ? (entrevistaPre.titulo || entrevistaPre.entrevistado) : id;

        const success = await EntrevistasModel.delete(id);
        if (!success) {
            return res.status(404).json({ message: 'Entrevista no encontrada' });
        }

        // Eliminar imagen huérfana del servidor
        if (entrevistaPre && entrevistaPre.url_imagen) {
            const { deleteImage } = require('../services/image.service');
            deleteImage(entrevistaPre.url_imagen);
            console.log(`[deleteEntrevista] Imagen de portada eliminada del servidor: ${entrevistaPre.url_imagen}`);
        }

        registrar(req.user?.id, 'eliminar', 'entrevistas', parseInt(id), `Eliminó la entrevista: "${entrevistaInfo}"`);
        res.json({ message: 'Entrevista eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar entrevista' });
    }
};
