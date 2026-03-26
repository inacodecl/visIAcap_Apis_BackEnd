/**
 * Archivo: models/historias.model.js
 * Descripción: Modelo encargado de la interacción con el timeline (tabla 'historia') y sus traducciones ('historia_i18n').
 *              Maneja transacciones complejas para asegurar integridad entre hito y traducción, incluyendo Media y Tags.
 */

const db = require('../config/db');
const TranslationService = require('../services/translation.service');

const HistoriasModel = {
    /**
     * Obtiene el listado de historias filtrado por idioma con Media y Tags
     * @param {string} lang - Código de idioma (es, en, etc.)
     */
    async findAll(lang = 'es', includeHidden = false) {
        const query = `
            SELECT 
                h.id, h.anio, h.fecha, h.location, h.visible, h.order_index, 
                h.categoria_id, h.media_url, 
                COALESCE(hi.titulo, hi_es.titulo) AS titulo,
                COALESCE(hi.descripcion, hi_es.descripcion) AS descripcion,
                COALESCE(hi.audio_url, hi_es.audio_url) AS audio_url,
                
                (
                    SELECT IFNULL(JSON_ARRAYAGG(
                        JSON_OBJECT('id', hm.id, 'url', hm.url, 'tipo', hm.tipo, 'alt', hm.alt_es)
                    ), '[]')
                    FROM historia_media hm WHERE hm.historia_id = h.id
                ) as media,
                
                (
                    SELECT IFNULL(JSON_ARRAYAGG(
                        JSON_OBJECT('id', t.id, 'slug', t.slug, 'nombre', t.nombre_es)
                    ), '[]')
                    FROM historia_tag ht
                    JOIN tags t ON ht.tag_id = t.id
                    WHERE ht.historia_id = h.id
                ) as tags

            FROM historia h
            LEFT JOIN historia_i18n hi ON h.id = hi.historia_id AND hi.locale = ?
            LEFT JOIN historia_i18n hi_es ON h.id = hi_es.historia_id AND hi_es.locale = 'es'
            ${includeHidden ? '' : 'WHERE h.visible = 1'}
            ORDER BY h.fecha ASC, h.anio ASC
        `;
        const [rows] = await db.query(query, [lang]);
        return rows;
    },

    /**
     * Obtiene una historia por ID e Idioma con relaciones
     * @param {number} id 
     * @param {string} lang 
     */
    async findById(id, lang = 'es') {
        const query = `
            SELECT 
                h.*,
                COALESCE(hi.titulo, hi_es.titulo) AS titulo,
                COALESCE(hi.descripcion, hi_es.descripcion) AS descripcion,
                COALESCE(hi.audio_url, hi_es.audio_url) AS audio_url,
                COALESCE(hi.locale, hi_es.locale) AS locale,
                
                (
                    SELECT IFNULL(JSON_ARRAYAGG(
                        JSON_OBJECT('id', hm.id, 'url', hm.url, 'tipo', hm.tipo, 'alt', hm.alt_es)
                    ), '[]')
                    FROM historia_media hm WHERE hm.historia_id = h.id
                ) as media,
                
                (
                    SELECT IFNULL(JSON_ARRAYAGG(
                        JSON_OBJECT('id', t.id, 'slug', t.slug, 'nombre', t.nombre_es)
                    ), '[]')
                    FROM historia_tag ht
                    JOIN tags t ON ht.tag_id = t.id
                    WHERE ht.historia_id = h.id
                ) as tags

            FROM historia h
            LEFT JOIN historia_i18n hi ON h.id = hi.historia_id AND hi.locale = ?
            LEFT JOIN historia_i18n hi_es ON h.id = hi_es.historia_id AND hi_es.locale = 'es'
            WHERE h.id = ?
        `;
        const [rows] = await db.query(query, [lang, id]);
        return rows[0];
    },

    /**
     * Crea un nuevo hito con todas sus relaciones (Transaccional)
     * @param {Object} data 
     * @param {number} userId - ID del usuario creador
     */
    async create(data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                anio, fecha, location, visible, order_index, categoria_id, media_url,
                titulo, descripcion, audio_url, locale = 'es',
                media = [], // Array de { url, tipo, alt }
                tags = []   // Array de IDs [1, 2]
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

            // 3. Insertar Multimedia Batch
            if (media && media.length > 0) {
                const mediaValues = media.map(m => [historiaId, m.url, m.tipo || 'image', m.alt || '']);
                await connection.query(
                    `INSERT INTO historia_media (historia_id, url, tipo, alt_es) VALUES ?`,
                    [mediaValues]
                );
            }

            // 4. Insertar Tags Batch
            if (tags && tags.length > 0) {
                const tagValues = tags.map(tagId => [historiaId, tagId]);
                await connection.query(
                    `INSERT INTO historia_tag (historia_id, tag_id) VALUES ?`,
                    [tagValues]
                );
            }

            await connection.commit();

            // 5. Auto-Traducción Inteligente (Fuera de la transacción principal para no bloquear)
            // Solo si el idioma original es español y es una creación nueva
            if (locale === 'es') {
                this._runAutoTranslation(historiaId, { titulo, descripcion }, ['en', 'ht']);
            }

            return historiaId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Actualización Total (PUT) - Reemplaza colecciones
     * @param {number} id 
     * @param {Object} data 
     * @param {number} userId 
     */
    async updateFull(id, data, userId) {
        const connection = await db.getConnection();
        const locale = data.locale || 'es';

        try {
            await connection.beginTransaction();

            // 0. Obtener estado previo de la Base de Datos para preservación
            const [currentRows] = await connection.query('SELECT * FROM historia WHERE id = ?', [id]);

            if (currentRows.length === 0) {
                await connection.rollback();
                return false; // Hito no encontrado
            }

            const current = currentRows[0];

            // Deep Merge: Si 'data' no trae el campo, usamos lo que ya estaba en la BBDD
            const anio = data.anio !== undefined ? data.anio : current.anio;
            const fecha = data.fecha !== undefined ? data.fecha : current.fecha;
            const location = data.location !== undefined ? data.location : current.location;
            const visible = data.visible !== undefined ? (data.visible ? 1 : 0) : current.visible;
            const order_index = data.order_index !== undefined ? data.order_index : current.order_index;
            const categoria_id = data.categoria_id !== undefined ? data.categoria_id : current.categoria_id;
            const media_url = data.media_url !== undefined ? data.media_url : current.media_url;

            // Extraer traducciones y relaciones
            let { titulo, descripcion, audio_url, media = [], tags = [] } = data;

            // 1. Actualizar historia (ya fusionado)
            const [result] = await connection.query(
                `UPDATE historia SET 
                anio=?, fecha=?, location=?, visible=?, order_index=?, categoria_id=?, media_url=?, updated_by=?, updated_at=NOW()
                WHERE id=?`,
                [anio, fecha, location, visible, order_index, categoria_id, media_url, userId, id]
            );

            // 2. Actualizar o Insertar traducción
            const [exists] = await connection.query('SELECT * FROM historia_i18n WHERE historia_id = ? AND locale = ?', [id, locale]);

            if (exists.length > 0) {
                const currentI18n = exists[0];
                titulo = titulo !== undefined ? titulo : currentI18n.titulo;
                descripcion = descripcion !== undefined ? descripcion : currentI18n.descripcion;
                audio_url = audio_url !== undefined ? audio_url : currentI18n.audio_url;

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

            // 3. Reemplazar Multimedia (Estrategia: Delete All + Insert New)
            await connection.query('DELETE FROM historia_media WHERE historia_id = ?', [id]);
            if (media && media.length > 0) {
                const mediaValues = media.map(m => [id, m.url, m.tipo || 'image', m.alt || '']);
                await connection.query(
                    `INSERT INTO historia_media (historia_id, url, tipo, alt_es) VALUES ?`,
                    [mediaValues]
                );
            }

            // 4. Reemplazar Tags (Estrategia: Delete All + Insert New)
            await connection.query('DELETE FROM historia_tag WHERE historia_id = ?', [id]);
            if (tags && tags.length > 0) {
                const tagValues = tags.map(tagId => [id, tagId]);
                await connection.query(
                    `INSERT INTO historia_tag (historia_id, tag_id) VALUES ?`,
                    [tagValues]
                );
            }

            await connection.commit();

            // 5. Auto-Traducción Inteligente en Update
            if (locale === 'es') {
                this._runAutoTranslation(id, { titulo, descripcion }, ['en', 'ht']);
            }

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
     * Mantiene comportamiento legacy para casos simples, no toca relaciones.
     * @param {number} id 
     * @param {Object} data 
     * @param {number} userId 
     */
    async patch(id, data, userId) {
        const connection = await db.getConnection();
        const locale = data.locale || 'es';

        try {
            await connection.beginTransaction();

            // Mapeo dinámico de campos tabla historia
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

                await connection.query(`UPDATE historia SET ${updatesHistoria.join(', ')} WHERE id = ?`, valuesHistoria);
            }

            // Mapeo dinámico tabla i18n
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

                // Intenta actualizar solo si existe
                await connection.query(`UPDATE historia_i18n SET ${updatesI18n.join(', ')} WHERE historia_id = ? AND locale = ?`, valuesI18n);
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
     * Elimina un hito y sus dependencias (Cascade manual)
     * @param {number} id 
     */
    async delete(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query('DELETE FROM historia_media WHERE historia_id = ?', [id]);
            await connection.query('DELETE FROM historia_i18n WHERE historia_id = ?', [id]);
            await connection.query('DELETE FROM historia_tag WHERE historia_id = ?', [id]);

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
    },

    /**
     * Lógica interna para ejecutar traducciones en segundo plano
     */
    async _runAutoTranslation(historiaId, fields, targetLocales) {
        try {
            const translations = await TranslationService.translateBatch(fields, targetLocales);
            
            for (const locale of targetLocales) {
                const { titulo, descripcion } = translations[locale];
                await db.query(
                    `INSERT INTO historia_i18n (historia_id, locale, titulo, descripcion) 
                     VALUES (?, ?, ?, ?) 
                     ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), descripcion = VALUES(descripcion)`,
                    [historiaId, locale, titulo, descripcion]
                );
            }
            console.log(`[HistoriasModel] Auto-traducción completada para ID: ${historiaId}`);
        } catch (error) {
            console.error(`[HistoriasModel] Fallo en auto-traducción:`, error);
        }
    }
};

module.exports = HistoriasModel;
