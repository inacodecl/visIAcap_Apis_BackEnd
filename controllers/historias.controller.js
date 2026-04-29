/**
 * Archivo: controllers/historias.controller.js
 * Descripción: Controlador para la gestión de hitos históricos (Timeline).
 *              Delega la lógica transaccional y de acceso a datos a HistoriasModel.
 */

const HistoriasModel = require('../models/historias.model');
const { registrar } = require('../services/activityLog.service');

/**
 * Obtener listado de historias (Timeline)
 */
const getHistory = async (req, res) => {
    try {
        const lang = req.query.lang || 'es';
        const includeHidden = req.query.include_hidden === 'true' || req.query.all === 'true';
        const data = await HistoriasModel.findAll(lang, includeHidden);
        console.log(`DEBUG [getHistory]: Historias obtenidas: ${data.length} para idioma: ${lang} (includeHidden: ${includeHidden})`);
        res.json(data);
    } catch (error) {
        console.error('Error obteniendo historia:', error);
        res.status(500).json({ message: 'Error al obtener la línea de tiempo' });
    }
};

/**
 * Obtener detalle de un hito por ID
 */
const getHistoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const lang = req.query.lang || 'es';

        const data = await HistoriasModel.findById(id, lang);

        if (!data) {
            return res.status(404).json({ message: 'Hito no encontrado' });
        }

        res.json(data);
    } catch (error) {
        console.error('Error obteniendo hito:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

/**
 * Crear nuevo hito (Transaccional)
 */
const createHistory = async (req, res) => {
    try {
        const userId = req.user.id; // Del token
        const historiaId = await HistoriasModel.create(req.body, userId);
        registrar(userId, 'crear', 'historias', historiaId, `Creó un hito histórico: "${req.body.titulo || 'Sin título'}"`);
        res.status(201).json({ message: 'Hito creado exitosamente', id: historiaId });

    } catch (error) {
        console.error('Error creando hito:', error);
        res.status(500).json({ message: 'Error al crear el hito' });
    }
};

/**
 * Actualización Total (PUT)
 */
const updateHistoryFull = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const hitoPre = await HistoriasModel.findById(id, 'es');

        const success = await HistoriasModel.updateFull(id, req.body, userId);

        if (!success) {
            return res.status(404).json({ message: 'Hito no encontrado' });
        }

        // Limpieza de imágenes huérfanas por reemplazo
        if (hitoPre && req.body.media) {
            const { deleteImage } = require('../services/image.service');
            let oldMedia = hitoPre.media;
            if (typeof oldMedia === 'string') {
                try { oldMedia = JSON.parse(oldMedia); } catch (e) { oldMedia = []; }
            }
            if (Array.isArray(oldMedia)) {
                // Las urls actuales que vienen en la petición (que sobrevivieron)
                const newUrls = (req.body.media || []).map(m => m.url);
                oldMedia.forEach(m => {
                    // Si la imagen antigua no está en la nueva lista, la borramos del servidor
                    if (m && m.url && !newUrls.includes(m.url)) {
                        deleteImage(m.url);
                        console.log(`[updateHistoryFull] Imagen antigua eliminada por reemplazo: ${m.url}`);
                    }
                });
            }
        }

        const hitoInfo = req.body.anio || req.body.titulo || id;
        registrar(userId, 'editar', 'historias', parseInt(id), `Editó el hito histórico: ${hitoInfo}`);
        res.json({ message: 'Hito actualizado completamente' });

    } catch (error) {
        console.error('Error actualizando hito (PUT):', error);
        res.status(500).json({ message: 'Error al actualizar el hito' });
    }
};

/**
 * Actualización Parcial (PATCH)
 */
const updateHistoryPartial = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const hitoPre = await HistoriasModel.findById(id, 'es');
        
        let hitoInfo = req.body.anio || req.body.titulo;
        if (!hitoInfo) {
            hitoInfo = hitoPre ? (hitoPre.anio || hitoPre.titulo) : id;
        }

        const success = await HistoriasModel.patch(id, req.body, userId);

        // Limpieza de imágenes huérfanas por reemplazo parcial
        if (success && req.body.media !== undefined && hitoPre) {
            const { deleteImage } = require('../services/image.service');
            let oldMedia = hitoPre.media;
            if (typeof oldMedia === 'string') {
                try { oldMedia = JSON.parse(oldMedia); } catch (e) { oldMedia = []; }
            }
            if (Array.isArray(oldMedia)) {
                const newUrls = (req.body.media || []).map(m => m.url);
                oldMedia.forEach(m => {
                    if (m && m.url && !newUrls.includes(m.url)) {
                        deleteImage(m.url);
                        console.log(`[updateHistoryPartial] Imagen antigua eliminada por reemplazo: ${m.url}`);
                    }
                });
            }
        }

        registrar(userId, 'editar', 'historias', parseInt(id), `Editó parcialmente el hito: ${hitoInfo}`);
        res.json({ message: 'Hito actualizado parcialmente' });

    } catch (error) {
        console.error('Error actualizando hito (PATCH):', error);
        res.status(500).json({ message: 'Error al actualizar el hito' });
    }
};

/**
 * Eliminar Hito (DELETE)
 */
const deleteHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        // Obtener info antes de eliminar para el log
        const hitoPre = await HistoriasModel.findById(id, 'es');
        const hitoInfo = hitoPre ? (hitoPre.anio || hitoPre.titulo) : id;

        const success = await HistoriasModel.delete(id);

        if (!success) {
            return res.status(404).json({ message: 'Hito no encontrado' });
        }

        // Eliminar las imágenes huérfanas del servidor
        if (hitoPre && hitoPre.media) {
            const { deleteImage } = require('../services/image.service');
            let mediaArray = hitoPre.media;
            if (typeof mediaArray === 'string') {
                try { mediaArray = JSON.parse(mediaArray); } catch (e) { mediaArray = []; }
            }
            if (Array.isArray(mediaArray)) {
                mediaArray.forEach(m => {
                    if (m && m.url) {
                        deleteImage(m.url);
                        console.log(`[deleteHistory] Imagen huérfana eliminada del servidor: ${m.url}`);
                    }
                });
            }
        }

        registrar(userId, 'eliminar', 'historias', parseInt(id), `Eliminó el hito histórico: ${hitoInfo}`);
        res.json({ message: 'Hito eliminado exitosamente' });

    } catch (error) {
        console.error('Error eliminando hito:', error);
        res.status(500).json({ message: 'Error al eliminar el hito' });
    }
};

module.exports = {
    getHistory,
    getHistoryById,
    createHistory,
    updateHistoryFull,
    updateHistoryPartial,
    deleteHistory
};
