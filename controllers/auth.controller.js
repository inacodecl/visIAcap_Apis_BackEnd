const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Iniciar sesión
 * @param {Request} req 
 * @param {Response} res 
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, ingrese email y contraseña' });
        }

        // Validar dominio institucional
        // Validar dominio institucional
        if (!email.endsWith('@inacapmail.cl') && !email.endsWith('@inacap.cl')) {
            return res.status(403).json({ message: 'Solo se permite el acceso con correo institucional (@inacapmail.cl o @inacap.cl)' });
        }

        // Buscar usuario por email
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const usuario = rows[0];

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, usuario.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        if (!usuario.is_active) {
            return res.status(403).json({ message: 'Su cuenta ha sido desactivada' });
        }

        // Actualizar último login
        await pool.query('UPDATE usuarios SET last_login_at = NOW() WHERE id = ?', [usuario.id]);

        // Generar Token JWT
        const payload = {
            id: usuario.id,
            rol: usuario.rol
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
            expiresIn: '8h' // Token expira en 8 horas
        });

        // Respuesta exitosa (Omitimos password_hash)
        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

module.exports = {
    login
};
