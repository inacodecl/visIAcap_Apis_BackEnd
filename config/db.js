const mysql = require('mysql2/promise');

// En producción, usar variables de entorno (.env)
// usuario de prueba 
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z', // UTC para evitar problemas de fechas
    dateStrings: true // Recuperar fechas como strings para evitar conversiones automáticas no deseadas
});

module.exports = pool;