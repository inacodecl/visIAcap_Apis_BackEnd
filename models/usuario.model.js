const db = require('../config/db');

const UsuarioModel = {
    // Método asíncrono para obtener todos los usuarios
    // Devuelve una promesa que se resuelve con las filas de la tabla
    getAll: async () => {
        // query: Ejecuta la consulta SQL pura.
        // Seleccionamos campos específicos por seguridad (nunca devolver password_hash al front)
        const [rows] = await db.query('SELECT id, nombre, apellido, email, rol, is_active FROM usuarios');
        return rows;
    }
};

module.exports = UsuarioModel;