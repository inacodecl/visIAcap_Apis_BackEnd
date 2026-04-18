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
const metadataRoutes = require('./routes/metadata.routes');

// Rutas del Futuro
const noticiasFuturoRoutes = require('./routes/noticias-futuro.routes');
const esteMesRoutes = require('./routes/este-mes.routes');
const proximamenteRoutes = require('./routes/proximamente.routes');

// Actividad / Auditoría
const actividadRoutes = require('./routes/actividad.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet()); // Seguridad HTTP
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
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
app.use('/api/metadata', metadataRoutes);
app.use('/api/actividad', actividadRoutes);

// Rutas del Futuro
app.use('/api/futuro/noticias', noticiasFuturoRoutes);
app.use('/api/futuro/este-mes', esteMesRoutes);
app.use('/api/futuro/proximamente', proximamenteRoutes);

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
    console.log('--- PASADO / PRESENTE ---');
    console.log(`• Usuarios:    http://localhost:${PORT}/api/usuarios`);
    console.log(`• Entrevistas: http://localhost:${PORT}/api/entrevistas`);
    console.log(`• Proyectos:   http://localhost:${PORT}/api/proyectos`);
    console.log(`• Historia:    http://localhost:${PORT}/api/history`);
    console.log('--- FUTURO ---');
    console.log(`• Noticias:    http://localhost:${PORT}/api/futuro/noticias`);
    console.log(`• Este Mes:    http://localhost:${PORT}/api/futuro/este-mes`);
    console.log(`• Próxim.:     http://localhost:${PORT}/api/futuro/proximamente`);
    console.log('');
    console.log('================================================');
});