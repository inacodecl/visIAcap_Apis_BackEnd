require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const db = require('./config/db');

// Importar rutas (Nomenclatura Plural Estandarizada)
const usuariosRoutes = require('./routes/usuarios.routes');
const entrevistasRoutes = require('./routes/entrevistas.routes');
const historiasRoutes = require('./routes/historias.routes');
const authRoutes = require('./routes/auth.routes');
const proyectosRoutes = require('./routes/proyectos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet()); // Seguridad HTTP
app.use(morgan('dev')); // Logger
app.use(cors({
    origin: ['http://localhost:8100', 'http://localhost:4200'],
    credentials: true
}));
app.use(express.json()); // Parsear JSON body
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/history', historiasRoutes); // Mantenemos /history por compatibilidad frontend
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/entrevistas', entrevistasRoutes);
app.use('/api/proyectos', proyectosRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenido a la API de VisIAcap',
        version: '1.0.0',
        status: 'running',
        architecture: 'MVC Refactored'
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
    console.log(`• Entrevistas: http://localhost:${PORT}/api/entrevistas`)
    console.log(`• Proyectos: http://localhost:${PORT}/api/proyectos`)
    console.log(`• Historia: http://localhost:${PORT}/api/history`)
    console.log('')
    console.log('================================================');
});