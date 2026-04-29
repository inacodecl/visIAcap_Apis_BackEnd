const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Procesa y optimiza una imagen a formato WebP
 * @param {Buffer} fileBuffer - El buffer de la imagen subida
 * @param {string} folder - Carpeta destino dentro de /public/uploads/
 * @returns {Promise<string>} - Ruta pública de la imagen
 */
const optimizeAndSaveImage = async (fileBuffer, folder = 'hitos') => {
    // Asegurar que el directorio de destino exista
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads', folder);
    
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generar nombre de archivo único con timestamp y número aleatorio
    const filename = `img-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const filepath = path.join(uploadDir, filename);

    // Procesar la imagen con sharp
    await sharp(fileBuffer)
        .resize({ width: 1200, withoutEnlargement: true }) // Redimensionar si es mayor a 1200px
        .webp({ quality: 80 }) // Convertir a WebP con 80% de calidad
        .toFile(filepath);

    // Retornar la ruta pública para guardar en DB y consumir en Frontend
    return `/uploads/${folder}/${filename}`;
};

module.exports = {
    optimizeAndSaveImage
};
