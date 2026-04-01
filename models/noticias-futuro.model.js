/**
 * Archivo: models/noticias-futuro.model.js
 * Descripción: Modelo para Noticias del Futuro (tabla noticias_futuro + noticias_futuro_i18n).
 *              Sigue el mismo patrón que proyectos.model.js con soporte i18n y auto-traducción.
 */

const db = require('../config/db');
const TranslationService = require('../services/translation.service');

const NoticiasFuturoModel = {

    /**
     * Obtiene el listado de noticias filtrado por idioma.
     * Columna 'fecha' (DATE) se retorna como string ISO. El frontend se encarga del formato.
     */
    async findAll(lang = 'es', includeUnpublished = false) {
        let query = `
            SELECT
                n.id,
                n.imagen_url  AS imagen,
                n.etiqueta,
                n.fecha,
                n.is_published,
                n.order_index,
                n.created_at,
                n.updated_at,
                COALESCE(ni.titulo,   ni_es.titulo)   AS titulo,
                COALESCE(ni.resumen,  ni_es.resumen)  AS resumen
            FROM noticias_futuro n
            LEFT JOIN noticias_futuro_i18n ni    ON n.id = ni.noticia_id  AND ni.locale   = ?
            LEFT JOIN noticias_futuro_i18n ni_es ON n.id = ni_es.noticia_id AND ni_es.locale = 'es'
        `;
        const params = [lang];

        if (!includeUnpublished) {
            query += ' WHERE n.is_published = 1';
        }
        query += ' ORDER BY n.fecha DESC, n.order_index ASC';

        const [rows] = await db.query(query, params);
        return rows;
    },

    /**
     * Obtiene una noticia por ID e idioma.
     */
    async findById(id, lang = 'es') {
        const query = `
            SELECT
                n.id,
                n.imagen_url  AS imagen,
                n.etiqueta,
                n.fecha,
                n.is_published,
                n.order_index,
                n.created_at,
                n.updated_at,
                COALESCE(ni.titulo,   ni_es.titulo)   AS titulo,
                COALESCE(ni.resumen,  ni_es.resumen)  AS resumen,
                COALESCE(ni.locale,   ni_es.locale)   AS locale
            FROM noticias_futuro n
            LEFT JOIN noticias_futuro_i18n ni    ON n.id = ni.noticia_id  AND ni.locale   = ?
            LEFT JOIN noticias_futuro_i18n ni_es ON n.id = ni_es.noticia_id AND ni_es.locale = 'es'
            WHERE n.id = ?
        `;
        const [rows] = await db.query(query, [lang, id]);
        return rows[0] || null;
    },

    /**
     * Crea una nueva noticia con su traducción (Transaccional).
     */
    async create(data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                imagen_url, etiqueta, fecha, is_published = 1, order_index = 0,
                titulo, resumen, locale = 'es'
            } = data;

            // 1. Insertar en noticias_futuro
            const [result] = await connection.query(
                `INSERT INTO noticias_futuro (imagen_url, etiqueta, fecha, is_published, order_index, created_by, updated_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [imagen_url, etiqueta, fecha || null, is_published ? 1 : 0, order_index, userId, userId]
            );
            const noticiaId = result.insertId;

            // 2. Insertar traducción
            await connection.query(
                `INSERT INTO noticias_futuro_i18n (noticia_id, locale, titulo, resumen)
                 VALUES (?, ?, ?, ?)`,
                [noticiaId, locale, titulo, resumen]
            );

            await connection.commit();

            // Auto-traducción en background
            if (locale === 'es') {
                this._runAutoTranslation(noticiaId, { titulo, resumen }, ['en', 'ht']);
            }

            return noticiaId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Actualización completa de una noticia (PUT).
     */
    async updateFull(id, data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                imagen_url, etiqueta, fecha, is_published, order_index,
                titulo, resumen, locale = 'es'
            } = data;

            // 1. Actualizar base
            const [result] = await connection.query(
                `UPDATE noticias_futuro SET
                    imagen_url=?, etiqueta=?, fecha=?, is_published=?, order_index=?,
                    updated_by=?, updated_at=NOW()
                 WHERE id=?`,
                [imagen_url, etiqueta, fecha || null, is_published ? 1 : 0, order_index, userId, id]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }

            // 2. Upsert traducción
            const [exists] = await connection.query(
                'SELECT id FROM noticias_futuro_i18n WHERE noticia_id = ? AND locale = ?', [id, locale]
            );
            if (exists.length > 0) {
                await connection.query(
                    `UPDATE noticias_futuro_i18n SET titulo=?, resumen=? WHERE noticia_id=? AND locale=?`,
                    [titulo, resumen, id, locale]
                );
            } else {
                await connection.query(
                    `INSERT INTO noticias_futuro_i18n (noticia_id, locale, titulo, resumen) VALUES (?, ?, ?, ?)`,
                    [id, locale, titulo, resumen]
                );
            }

            await connection.commit();

            if (locale === 'es') {
                this._runAutoTranslation(id, { titulo, resumen }, ['en', 'ht']);
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
     * Elimina una noticia (CASCADE borra i18n automáticamente).
     */
    async delete(id) {
        const [result] = await db.query('DELETE FROM noticias_futuro WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    /**
     * Auto-traducción en background.
     */
    async _runAutoTranslation(noticiaId, fields, targetLocales) {
        try {
            const translations = await TranslationService.translateBatch(fields, targetLocales);
            for (const locale of targetLocales) {
                const { titulo, resumen } = translations[locale];
                await db.query(
                    `INSERT INTO noticias_futuro_i18n (noticia_id, locale, titulo, resumen)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), resumen = VALUES(resumen)`,
                    [noticiaId, locale, titulo, resumen]
                );
            }
            console.log(`[NoticiasFuturoModel] Auto-traducción completada para ID: ${noticiaId}`);
        } catch (error) {
            console.error(`[NoticiasFuturoModel] Fallo en auto-traducción:`, error);
        }
    }
};

module.exports = NoticiasFuturoModel;
