const rateLimit = require('express-rate-limit');

// Límite de peticiones para rutas generales (Ej: Perfil, Historial Normal)
// 100 peticiones cada 15 minutos por IP
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: {
        ok: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
        }
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// Límite más estricto para rutas sensibles (Ej: Login)
// 10 intentos de login cada 10 minutos
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 10,
    message: {
        ok: false,
        error: {
            code: 'AUTH_RATE_LIMIT',
            message: 'Demasiados intentos de inicio de sesión fallidos, intenta en 10 minutos.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter
};
