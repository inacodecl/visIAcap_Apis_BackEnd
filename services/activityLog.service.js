/**
 * Archivo: services/activityLog.service.js
 * Descripción: Servicio centralizado para registrar actividad de administradores.
 *              Diseñado como fire-and-forget: si el INSERT falla, la operación
 *              principal del admin NO se ve afectada.
 *
 * Escalabilidad: Acepta cualquier valor de 'accion' y 'modulo' (ambos VARCHAR),
 *                por lo que nuevos CRUDs se integran sin modificar este servicio.
 *
 * Uso en controllers:
 *   const { registrar } = require('../services/activityLog.service');
 *   registrar(userId, 'crear', 'proyectos', newId, 'Creó el proyecto: "Becas 2026"');
 */

const db = require('../config/db');

/**
 * Registra una acción en la tabla actividad_log (fire-and-forget).
 * @param {number} usuarioId - ID del usuario que realizó la acción
 * @param {string} accion    - Tipo de acción ('login','crear','editar','eliminar','perfil', etc.)
 * @param {string} modulo    - Módulo afectado ('proyectos','entrevistas','historias', etc.)
 * @param {number|null} entidadId - ID del recurso afectado (null para login/logout)
 * @param {string} descripcion - Texto legible de la acción
 */
const registrar = (usuarioId, accion, modulo, entidadId, descripcion) => {
    // Fire-and-forget: no usamos await, no bloqueamos la respuesta
    db.query(
        `INSERT INTO actividad_log (usuario_id, accion, modulo, entidad_id, descripcion) 
         VALUES (?, ?, ?, ?, ?)`,
        [usuarioId, accion, modulo, entidadId || null, descripcion]
    ).catch(err => {
        // Solo loguear el error, NUNCA propagarlo al controller
        console.error('[ActivityLog] Error registrando actividad:', err.message);
    });
};

module.exports = { registrar };
