const pool = require('../config/db');

/**
 * Obtener listado de historias (Timeline)
 * Puede filtrar por idioma usando ?lang=es (por defecto 'es')
 */
const getHistory = async (req, res) => {
    try {
        const lang = req.query.lang || 'es';

        const query = `
            SELECT 
                h.id, h.anio, h.fecha, h.location, h.visible, h.order_index, 
                h.categoria_id, h.media_url,
                hi.titulo, hi.descripcion, hi.audio_url
            FROM historia h
            LEFT JOIN historia_i18n hi ON h.id = hi.historia_id
            WHERE hi.locale = ? AND h.visible = 1
            ORDER BY h.anio ASC, h.order_index ASC
        `;

        const [rows] = await pool.query(query, [lang]);
        res.json(rows);
    } catch (error) {
        console.error('Error obteniendo historia:', error);
        res.status(500).json({ message: 'Error al obtener la línea de tiempo' });
    }
};

/**
 * Obtener detalle de un hito por ID
 */
const getHistoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const lang = req.query.lang || 'es';

        const query = `
            SELECT 
                h.*,
                hi.titulo, hi.descripcion, hi.audio_url, hi.locale
            FROM historia h
            LEFT JOIN historia_i18n hi ON h.id = hi.historia_id
            WHERE h.id = ? AND hi.locale = ?
        `;

        const [rows] = await pool.query(query, [id, lang]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Hito no encontrado' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error obteniendo hito:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

/**
 * Crear nuevo hito (Transaccional)
 */
const createHistory = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            anio, fecha, location, visible, order_index, categoria_id, media_url, // Tabla historia
            titulo, descripcion, audio_url, locale = 'es' // Tabla historia_i18n
        } = req.body;

        const userId = req.user.id; // Del token

        // 1. Insertar en historia
        const [resultH] = await connection.query(
            `INSERT INTO historia 
            (anio, fecha, location, visible, order_index, categoria_id, media_url, created_by, updated_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [anio, fecha, location, visible ? 1 : 0, order_index || 0, categoria_id, media_url, userId, userId]
        );

        const historiaId = resultH.insertId;

        // 2. Insertar en historia_i18n
        await connection.query(
            `INSERT INTO historia_i18n (historia_id, locale, titulo, descripcion, audio_url) 
            VALUES (?, ?, ?, ?, ?)`,
            [historiaId, locale, titulo, descripcion, audio_url]
        );

        await connection.commit();
        res.status(201).json({ message: 'Hito creado exitosamente', id: historiaId });

    } catch (error) {
        await connection.rollback();
        console.error('Error creando hito:', error);
        res.status(500).json({ message: 'Error al crear el hito' });
    } finally {
        connection.release();
    }
};

/**
 * Actualización Total (PUT)
 * Reemplaza toda la información del hito
 */
const updateHistoryFull = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            anio, fecha, location, visible, order_index, categoria_id, media_url,
            titulo, descripcion, audio_url, locale = 'es'
        } = req.body;

        const userId = req.user.id;

        // 1. Actualizar historia
        const [result] = await connection.query(
            `UPDATE historia SET 
            anio=?, fecha=?, location=?, visible=?, order_index=?, categoria_id=?, media_url=?, updated_by=?, updated_at=NOW()
            WHERE id=?`,
            [anio, fecha, location, visible ? 1 : 0, order_index, categoria_id, media_url, userId, id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Hito no encontrado' });
        }

        // 2. Actualizar o Insertar traducción (UPSERT sería ideal, aquí usamos UPDATE simple o DELETE+INSERT)
        // Para simplificar y asegurar consistencia en PUT, verificamos si existe registro i18n
        const [exists] = await connection.query('SELECT id FROM historia_i18n WHERE historia_id = ? AND locale = ?', [id, locale]);

        if (exists.length > 0) {
            await connection.query(
                `UPDATE historia_i18n SET titulo=?, descripcion=?, audio_url=? WHERE historia_id=? AND locale=?`,
                [titulo, descripcion, audio_url, id, locale]
            );
        } else {
            await connection.query(
                `INSERT INTO historia_i18n (historia_id, locale, titulo, descripcion, audio_url) VALUES (?, ?, ?, ?, ?)`,
                [id, locale, titulo, descripcion, audio_url]
            );
        }

        await connection.commit();
        res.json({ message: 'Hito actualizado completamente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error actualizando hito (PUT):', error);
        res.status(500).json({ message: 'Error al actualizar el hito' });
    } finally {
        connection.release();
    }
};

/**
 * Actualización Parcial (PATCH)
 * Actualiza solo los campos enviados
 */
const updateHistoryPartial = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const body = req.body;
        const userId = req.user.id;
        const locale = body.locale || 'es';

        // Campos permitidos para tabla 'historia'
        const fieldsHistoria = ['anio', 'fecha', 'location', 'visible', 'order_index', 'categoria_id', 'media_url'];
        const updatesHistoria = [];
        const valuesHistoria = [];

        fieldsHistoria.forEach(field => {
            if (body[field] !== undefined) {
                updatesHistoria.push(`${field} = ?`);
                valuesHistoria.push(body[field]);
            }
        });

        if (updatesHistoria.length > 0) {
            updatesHistoria.push('updated_by = ?');
            valuesHistoria.push(userId);
            updatesHistoria.push('updated_at = NOW()');
            valuesHistoria.push(id); // Para el WHERE

            const queryH = `UPDATE historia SET ${updatesHistoria.join(', ')} WHERE id = ?`;
            await connection.query(queryH, valuesHistoria);
        }

        // Campos permitidos para tabla 'historia_i18n'
        const fieldsI18n = ['titulo', 'descripcion', 'audio_url'];
        const updatesI18n = [];
        const valuesI18n = [];

        fieldsI18n.forEach(field => {
            if (body[field] !== undefined) {
                updatesI18n.push(`${field} = ?`);
                valuesI18n.push(body[field]);
            }
        });

        if (updatesI18n.length > 0) {
            valuesI18n.push(id);
            valuesI18n.push(locale);

            // Verificar si existe para hacer Update, sino Insert si hay titulo obligatoriamente? 
            // En PATCH asumimos que el registro i18n ya debería existir para editarlo, o lo creamos si no.
            const [exists] = await connection.query('SELECT id FROM historia_i18n WHERE historia_id = ? AND locale = ?', [id, locale]);

            if (exists.length > 0) {
                const queryI = `UPDATE historia_i18n SET ${updatesI18n.join(', ')} WHERE historia_id = ? AND locale = ?`;
                await connection.query(queryI, valuesI18n);
            } else {
                // Si intentan parchear un idioma que no existe, debería advertirse o crearse.
                // Para simplificar, solo actualizamos si existe. Si es un nuevo idioma, deberían usar POST o PUT.
            }
        }

        await connection.commit();
        res.json({ message: 'Hito actualizado parcialmente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error actualizando hito (PATCH):', error);
        res.status(500).json({ message: 'Error al actualizar el hito' });
    } finally {
        connection.release();
    }
};

/**
 * Eliminar Hito (DELETE)
 */
const deleteHistory = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // 1. Eliminar traducciones (Por si no hay ON DELETE CASCADE)
        await connection.query('DELETE FROM historia_i18n WHERE historia_id = ?', [id]);

        // 2. Eliminar registro principal
        const [result] = await connection.query('DELETE FROM historia WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Hito no encontrado' });
        }

        await connection.commit();
        res.json({ message: 'Hito eliminado exitosamente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error eliminando hito:', error);
        res.status(500).json({ message: 'Error al eliminar el hito' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getHistory,
    getHistoryById,
    createHistory,
    updateHistoryFull,
    updateHistoryPartial,
    deleteHistory
};
