const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar Token JWT
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded; // Guardamos datos del usuario (id, rol) en la request
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token inválido o expirado' });
    }
};

/**
 * Middleware para verificar Rol (RBAC)
 * @param {Array<string>} rolesPermitidos Lista de roles permitidos
 */
const verifyRole = (rolesPermitidos = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({ message: 'Error de servidor: Usuario no verificado' });
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    verifyRole
};
