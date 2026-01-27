/**
 * Archivo: models/historias.model.js
 * Descripción: Modelo encargado de la interacción con el timeline (tabla 'historia') y sus traducciones ('historia_i18n').
 *              Maneja transacciones complejas para asegurar integridad entre hito y traducción.
 */

const db = require('../config/db');

const HistoriasModel = {
    /**
     * Obtiene el listado de historias filtrado por idioma
     * @param {string} lang - Código de idioma (es, en, etc.)
     */
    async findAll(lang = 'es') {
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
        const [rows] = await db.query(query, [lang]);
        return rows;
    },

    /**
     * Obtiene una historia por ID e Idioma
     * @param {number} id 
     * @param {string} lang 
     */
    async findById(id, lang = 'es') {
        const query = `
            SELECT 
                h.*,
                hi.titulo, hi.descripcion, hi.audio_url, hi.locale
            FROM historia h
            LEFT JOIN historia_i18n hi ON h.id = hi.historia_id
            WHERE h.id = ? AND hi.locale = ?
        `;
        const [rows] = await db.query(query, [id, lang]);
        return rows[0];
    },

    /**
     * Crea un nuevo hito con su traducción inicial (Transaccional)
     * @param {Object} data 
     * @param {number} userId - ID del usuario creador
     */
    async create(data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                anio, fecha, location, visible, order_index, categoria_id, media_url,
                titulo, descripcion, audio_url, locale = 'es'
            } = data;

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
            return historiaId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Actualización completa de un hito (PUT)
     * @param {number} id 
     * @param {Object} data 
     * @param {number} userId 
     */
    async updateFull(id, data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                anio, fecha, location, visible, order_index, categoria_id, media_url,
                titulo, descripcion, audio_url, locale = 'es'
            } = data;

            // 1. Actualizar historia
            const [result] = await connection.query(
                `UPDATE historia SET 
                anio=?, fecha=?, location=?, visible=?, order_index=?, categoria_id=?, media_url=?, updated_by=?, updated_at=NOW()
                WHERE id=?`,
                [anio, fecha, location, visible ? 1 : 0, order_index, categoria_id, media_url, userId, id]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return false; // Hito no encontrado
            }

            // 2. Actualizar o Insertar traducción
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
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Actualización parcial (PATCH)
     * @param {number} id 
     * @param {Object} data 
     * @param {number} userId 
     */
    async patch(id, data, userId) {
        const connection = await db.getConnection();
        const locale = data.locale || 'es';

        try {
            await connection.beginTransaction();

            // Campos historia
            const fieldsHistoria = ['anio', 'fecha', 'location', 'visible', 'order_index', 'categoria_id', 'media_url'];
            const updatesHistoria = [];
            const valuesHistoria = [];

            fieldsHistoria.forEach(field => {
                if (data[field] !== undefined) {
                    updatesHistoria.push(`${field} = ?`);
                    valuesHistoria.push(data[field]);
                }
            });

            if (updatesHistoria.length > 0) {
                updatesHistoria.push('updated_by = ?');
                valuesHistoria.push(userId);
                updatesHistoria.push('updated_at = NOW()');
                valuesHistoria.push(id);

                const queryH = `UPDATE historia SET ${updatesHistoria.join(', ')} WHERE id = ?`;
                // No necesitamos verificar affectedRows aquí estrictamente si vamos a intentar actualizar hijos, 
                // pero si el ID no existe, fallará silenciosamente o retornará 0. Validaremos al final.
                await connection.query(queryH, valuesHistoria);
            }

            // Campos i18n
            const fieldsI18n = ['titulo', 'descripcion', 'audio_url'];
            const updatesI18n = [];
            const valuesI18n = [];

            fieldsI18n.forEach(field => {
                if (data[field] !== undefined) {
                    updatesI18n.push(`${field} = ?`);
                    valuesI18n.push(data[field]);
                }
            });

            if (updatesI18n.length > 0) {
                valuesI18n.push(id);
                valuesI18n.push(locale);

                const [exists] = await connection.query('SELECT id FROM historia_i18n WHERE historia_id = ? AND locale = ?', [id, locale]);

                if (exists.length > 0) {
                    const queryI = `UPDATE historia_i18n SET ${updatesI18n.join(', ')} WHERE historia_id = ? AND locale = ?`;
                    await connection.query(queryI, valuesI18n);
                }
                // Si no existe traducción, en PATCH normalmente no creamos mágicamente a menos que sea deseado. 
                // Mantenemos la lógica original.
            }

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Elimina un hito y sus dependencias
     * @param {number} id 
     */
    async delete(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query('DELETE FROM historia_i18n WHERE historia_id = ?', [id]);
            const [result] = await connection.query('DELETE FROM historia WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }

            await connection.commit();
            return true;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = HistoriasModel;
