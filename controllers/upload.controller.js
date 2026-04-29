const imageService = require('../services/image.service');

const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó ninguna imagen o el formato es incorrecto.'
            });
        }

        const folder = req.params.folder || 'hitos';

        // Llamar al servicio para optimizar y guardar en la carpeta dinámica
        const imageUrl = await imageService.optimizeAndSaveImage(req.file.buffer, folder);

        res.status(200).json({
            success: true,
            message: 'Imagen subida y optimizada correctamente',
            data: {
                url: imageUrl
            }
        });

    } catch (error) {
        console.error(`Error en uploadImage (${req.params.folder}):`, error);
        res.status(500).json({
            success: false,
            message: 'Error interno al procesar la imagen',
            error: error.message
        });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó una URL para eliminar.'
            });
        }

        const deleted = imageService.deleteImage(url);

        if (deleted) {
            res.status(200).json({
                success: true,
                message: 'Imagen eliminada correctamente del servidor.'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'La imagen no existe o no pudo ser eliminada.'
            });
        }
    } catch (error) {
        console.error('Error en deleteImage:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al eliminar la imagen',
            error: error.message
        });
    }
};

module.exports = {
    uploadImage,
    deleteImage
};
