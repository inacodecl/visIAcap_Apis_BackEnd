/**
 * Archivo: models/proximamente.model.js
 * Descripción: Modelo para eventos de "Próximamente" (tabla proximamente + proximamente_i18n).
 *              Incluye: icono, imagen_url, ubicacion, fecha_texto (todos campos no-i18n).
 */

const db = require('../config/db');
const TranslationService = require('../services/translation.service');

const ProximamenteModel = {

    async findAll(lang = 'es', includeUnpublished = false) {
        let query = `
            SELECT
                p.id,
                p.icono,
                p.imagen_url  AS imagen,
                p.ubicacion,
                p.fecha_texto AS fechaTexto,
                p.is_published,
                p.order_index,
                p.created_at,
                COALESCE(pi.titulo,      pi_es.titulo)      AS titulo,
                COALESCE(pi.descripcion, pi_es.descripcion) AS descripcion
            FROM proximamente p
            LEFT JOIN proximamente_i18n pi    ON p.id = pi.evento_id AND pi.locale    = ?
            LEFT JOIN proximamente_i18n pi_es ON p.id = pi_es.evento_id AND pi_es.locale = 'es'
        `;
        const params = [lang];

        if (!includeUnpublished) {
            query += ' WHERE p.is_published = 1';
        }
        query += ' ORDER BY p.order_index ASC, p.created_at DESC';

        const [rows] = await db.query(query, params);
        return rows;
    },

    async findById(id, lang = 'es') {
        const query = `
            SELECT
                p.id, p.icono, p.imagen_url AS imagen, p.ubicacion,
                p.fecha_texto AS fechaTexto, p.is_published, p.order_index,
                COALESCE(pi.titulo,      pi_es.titulo)      AS titulo,
                COALESCE(pi.descripcion, pi_es.descripcion) AS descripcion,
                COALESCE(pi.locale,      pi_es.locale)      AS locale
            FROM proximamente p
            LEFT JOIN proximamente_i18n pi    ON p.id = pi.evento_id AND pi.locale    = ?
            LEFT JOIN proximamente_i18n pi_es ON p.id = pi_es.evento_id AND pi_es.locale = 'es'
            WHERE p.id = ?
        `;
        const [rows] = await db.query(query, [lang, id]);
        return rows[0] || null;
    },

    async create(data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                icono, imagen_url, ubicacion, fecha_texto,
                is_published = 1, order_index = 0,
                titulo, descripcion, locale = 'es'
            } = data;

            const [result] = await connection.query(
                `INSERT INTO proximamente (icono, imagen_url, ubicacion, fecha_texto, is_published, order_index, created_by, updated_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [icono, imagen_url, ubicacion, fecha_texto, is_published ? 1 : 0, order_index, userId, userId]
            );
            const eventoId = result.insertId;

            await connection.query(
                `INSERT INTO proximamente_i18n (evento_id, locale, titulo, descripcion) VALUES (?, ?, ?, ?)`,
                [eventoId, locale, titulo, descripcion]
            );

            await connection.commit();

            if (locale === 'es') {
                this._runAutoTranslation(eventoId, { titulo, descripcion }, ['en', 'ht']);
            }

            return eventoId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async updateFull(id, data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                icono, imagen_url, ubicacion, fecha_texto,
                is_published, order_index,
                titulo, descripcion, locale = 'es'
            } = data;

            const [result] = await connection.query(
                `UPDATE proximamente SET
                    icono=?, imagen_url=?, ubicacion=?, fecha_texto=?,
                    is_published=?, order_index=?, updated_by=?, updated_at=NOW()
                 WHERE id=?`,
                [icono, imagen_url, ubicacion, fecha_texto, is_published ? 1 : 0, order_index, userId, id]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }

            const [exists] = await connection.query(
                'SELECT id FROM proximamente_i18n WHERE evento_id = ? AND locale = ?', [id, locale]
            );
            if (exists.length > 0) {
                await connection.query(
                    `UPDATE proximamente_i18n SET titulo=?, descripcion=? WHERE evento_id=? AND locale=?`,
                    [titulo, descripcion, id, locale]
                );
            } else {
                await connection.query(
                    `INSERT INTO proximamente_i18n (evento_id, locale, titulo, descripcion) VALUES (?, ?, ?, ?)`,
                    [id, locale, titulo, descripcion]
                );
            }

            await connection.commit();

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

    async delete(id) {
        const [result] = await db.query('DELETE FROM proximamente WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    async _runAutoTranslation(eventoId, fields, targetLocales) {
        try {
            const translations = await TranslationService.translateBatch(fields, targetLocales);
            for (const locale of targetLocales) {
                const { titulo, descripcion } = translations[locale];
                await db.query(
                    `INSERT INTO proximamente_i18n (evento_id, locale, titulo, descripcion)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), descripcion = VALUES(descripcion)`,
                    [eventoId, locale, titulo, descripcion]
                );
            }
            console.log(`[ProximamenteModel] Auto-traducción completada para ID: ${eventoId}`);
        } catch (error) {
            console.error(`[ProximamenteModel] Fallo en auto-traducción:`, error);
        }
    }
};

module.exports = ProximamenteModel;
