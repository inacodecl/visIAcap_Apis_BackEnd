/**
 * Script de utilidad: Crear/resetear usuario admin
 * Uso: node scripts/create_admin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const ADMIN = {
    nombre: 'Admin',
    apellido: 'VISIACAP',
    email: 'admin@inacap.cl',
    password: 'Visiacap2026#',
    rol: 'admin'
};

async function main() {
    try {
        console.log('🔍 Verificando si el usuario ya existe...');
        const [rows] = await db.query('SELECT id, email, rol FROM usuarios WHERE email = ?', [ADMIN.email]);

        const hash = await bcrypt.hash(ADMIN.password, 10);

        if (rows.length > 0) {
            // Actualizar contraseña y asegurarse que sea admin activo
            await db.query(
                `UPDATE usuarios SET password_hash = ?, rol = 'admin', is_active = 1, nombre = ?, apellido = ? WHERE email = ?`,
                [hash, ADMIN.nombre, ADMIN.apellido, ADMIN.email]
            );
            console.log(`✅ Usuario actualizado: ${ADMIN.email}`);
        } else {
            // Crear nuevo usuario
            await db.query(
                `INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, is_active) VALUES (?, ?, ?, ?, 'admin', 1)`,
                [ADMIN.nombre, ADMIN.apellido, ADMIN.email, hash]
            );
            console.log(`✅ Usuario creado: ${ADMIN.email}`);
        }

        console.log('\n==============================');
        console.log('  CREDENCIALES DE ACCESO ADMIN');
        console.log('==============================');
        console.log(`  Email   : ${ADMIN.email}`);
        console.log(`  Password: ${ADMIN.password}`);
        console.log('==============================\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        process.exit(0);
    }
}

main();
