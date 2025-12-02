require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const db = require('./config/db');

const usuarioRoutes = require('./routes/usuario.routes');


const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet()); // Seguridad HTTP
app.use(morgan('dev')); // Logger
app.use(cors()); // Permitir peticiones cruzadas (desde Ionic)
app.use(express.json()); // Parsear JSON body
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/usuarios', usuarioRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: 'Bienvenido a la API de VislAcap', 
        version: '1.0.0',
        status: 'running'
    });
});

// Verificación de conexión a BD al iniciar
db.getConnection()
    .then(connection => {
        console.log('✅ Conexión a MySQL exitosa');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error conectando a MySQL:', err.message);
    });

// Iniciar servidor
app.listen(PORT, () => {
    console.log('================================================');
    console.log('');
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log('URLS TEMPORALES');
    console.log(`• Usuarios: http://localhost:${PORT}/api/usuarios`)
    console.log('')
    console.log('================================================');
});