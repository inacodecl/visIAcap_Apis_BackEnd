require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
    const c = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    await c.execute(`
        CREATE TABLE actividad_log (
            id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            usuario_id   BIGINT UNSIGNED NOT NULL,
            accion       VARCHAR(30)  NOT NULL,
            modulo       VARCHAR(50)  NOT NULL,
            entidad_id   BIGINT UNSIGNED NULL,
            descripcion  VARCHAR(255) NOT NULL,
            created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            INDEX idx_usuario_fecha (usuario_id, created_at DESC),
            INDEX idx_modulo (modulo),
            INDEX idx_accion (accion)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tabla actividad_log creada exitosamente');
    await c.end();
})();
