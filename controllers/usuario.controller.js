const UsuarioModel = require('../models/usuario.model');

const usuarioController = {
    // Esta función maneja la petición GET /api/usuarios
    listarUsuarios: async (req, res) => {
        try {
            // Llamamos al modelo para pedir los datos a MySQL
            const usuarios = await UsuarioModel.getAll();
            
            // Respondemos al frontend con un JSON y código 200 (OK)
            res.status(200).json({
                success: true,
                count: usuarios.length,
                data: usuarios
            });
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                debugInfo: error.message 
            });
        }
    }
};

module.exports = usuarioController;