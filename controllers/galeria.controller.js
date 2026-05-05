const GaleriaModel = require('../models/galeria.model');
const imageService = require('../services/image.service');

/**
 * Obtener todas las imágenes de la galería
 */
const getGaleria = async (req, res) => {
    try {
        const includeHidden = req.query.includeHidden === 'true';
        const imagenes = await GaleriaModel.findAll(includeHidden);
        
        res.status(200).json({
            success: true,
            data: imagenes
        });
    } catch (error) {
        console.error('Error al obtener galería:', error);
        res.status(500).json({ success: false, message: 'Error al obtener la galería', error: error.message });
    }
};

/**
 * Obtener una imagen por ID
 */
const getImagenById = async (req, res) => {
    try {
        const { id } = req.params;
        const imagen = await GaleriaModel.findById(id);

        if (!imagen) {
            return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
        }

        res.status(200).json({
            success: true,
            data: imagen
        });
    } catch (error) {
        console.error('Error al obtener imagen:', error);
        res.status(500).json({ success: false, message: 'Error al obtener la imagen', error: error.message });
    }
};

/**
 * Crear una nueva imagen en la galería
 */
const createImagen = async (req, res) => {
    try {
        const { url, anio, visible, order_index } = req.body;

        if (!url || !anio) {
            return res.status(400).json({ success: false, message: 'La URL y el año son obligatorios' });
        }

        const newId = await GaleriaModel.create({ url, anio, visible, order_index });

        res.status(201).json({
            success: true,
            message: 'Imagen agregada a la galería exitosamente',
            data: { id: newId }
        });
    } catch (error) {
        console.error('Error al crear imagen:', error);
        res.status(500).json({ success: false, message: 'Error al crear la imagen', error: error.message });
    }
};

/**
 * Actualizar una imagen existente
 */
const updateImagen = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await GaleriaModel.update(id, req.body);

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Imagen no encontrada o sin cambios' });
        }

        res.status(200).json({
            success: true,
            message: 'Imagen actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar imagen:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar la imagen', error: error.message });
    }
};

/**
 * Eliminar una imagen
 */
const deleteImagen = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar la imagen primero para obtener su URL
        const imagen = await GaleriaModel.findById(id);
        
        if (!imagen) {
            return res.status(404).json({ success: false, message: 'Imagen no encontrada en la BD' });
        }

        // 2. Eliminar de la BD
        const deleted = await GaleriaModel.delete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'No se pudo eliminar de la BD' });
        }

        // 3. Eliminar el archivo físico del servidor SOLAMENTE si pertenece a la carpeta exclusiva de galería
        // Esto protege las imágenes de "/hitos/" compartidas
        if (imagen.url && imagen.url.includes('/galeria/')) {
            imageService.deleteImage(imagen.url);
        }

        res.status(200).json({
            success: true,
            message: 'Imagen eliminada exitosamente de la BD' + (imagen.url && imagen.url.includes('/galeria/') ? ' y del servidor' : '')
        });
    } catch (error) {
        console.error('Error al eliminar imagen:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar la imagen', error: error.message });
    }
};

module.exports = {
    getGaleria,
    getImagenById,
    createImagen,
    updateImagen,
    deleteImagen
};
