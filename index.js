require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
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

// Actividad
const actividadRoutes = require('./routes/actividad.routes');
const uploadRoutes = require('./routes/upload.routes');
const galeriaRoutes = require('./routes/galeria.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet()); // Seguridad HTTP
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
app.use(morgan('dev'));
app.use(cors({
    origin: [
        'http://localhost:8100',
        'http://inacapsmart.cl',
        'https://inacapsmart.cl'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/history', historiasRoutes); 
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/entrevistas', entrevistasRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/actividad', actividadRoutes);
// Rutas del Futuro
app.use('/api/futuro/noticias', noticiasFuturoRoutes);
app.use('/api/futuro/este-mes', esteMesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/galeria', galeriaRoutes);

// Servir archivos estáticos (imágenes subidas) con caché de 30 días
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
    maxAge: '30d'
}));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        message: 'Bienvenido a la API de Inacap Smart V 2.0',
        version: '2.0.0',
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
    console.log('==========================================================');
    console.log('');
    console.log(`🚀 Servidor corriendo en http://apibackend.inacapsmart.cl/`);
    console.log('');
    console.log('==========================================================');
});