/**
 * Archivo: middlewares/validation.middleware.js
 * Descripción: Middleware genérico para centralizar la validación de campos obligatorios en el body.
 *              Permite limpiar los controladores de lógica repetitiva de validación.
 */

/**
 * Valida que los campos requeridos estén presentes en el body de la petición
 * @param {Array<string>} fields - Lista de nombres de campos obligatorios
 */
const validateRequiredFields = (fields = []) => {
    return (req, res, next) => {
        const missingFields = [];

        fields.forEach(field => {
            if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Faltan campos obligatorios: ${missingFields.join(', ')}`
            });
        }

        next();
    };
};

module.exports = {
    validateRequiredFields
};
