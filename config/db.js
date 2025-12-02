const mysql = require('mysql2/promise');

// En producción, usar variables de entorno (.env)
// usuario de prueba 
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'visiacap_user', 
    password: process.env.DB_PASSWORD || 'VisIacap123#',
    database: process.env.DB_NAME || 'visiacap',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00'
});

module.exports = pool;