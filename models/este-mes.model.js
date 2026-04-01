/**
 * Archivo: models/este-mes.model.js
 * Descripción: Modelo para eventos de "Este Mes" (tabla este_mes + este_mes_i18n).
 */

const db = require('../config/db');
const TranslationService = require('../services/translation.service');

const EsteMesModel = {

    async findAll(lang = 'es', includeUnpublished = false) {
        let query = `
            SELECT
                e.id,
                e.dia,
                e.mes,
                e.tipo,
                e.is_published,
                e.order_index,
                e.created_at,
                COALESCE(ei.titulo,      ei_es.titulo)      AS titulo,
                COALESCE(ei.descripcion, ei_es.descripcion) AS descripcion
            FROM este_mes e
            LEFT JOIN este_mes_i18n ei    ON e.id = ei.evento_id AND ei.locale    = ?
            LEFT JOIN este_mes_i18n ei_es ON e.id = ei_es.evento_id AND ei_es.locale = 'es'
        `;
        const params = [lang];

        if (!includeUnpublished) {
            query += ' WHERE e.is_published = 1';
        }
        query += ' ORDER BY e.order_index ASC, e.dia ASC';

        const [rows] = await db.query(query, params);
        return rows;
    },

    async findById(id, lang = 'es') {
        const query = `
            SELECT
                e.id, e.dia, e.mes, e.tipo, e.is_published, e.order_index,
                COALESCE(ei.titulo,      ei_es.titulo)      AS titulo,
                COALESCE(ei.descripcion, ei_es.descripcion) AS descripcion,
                COALESCE(ei.locale,      ei_es.locale)      AS locale
            FROM este_mes e
            LEFT JOIN este_mes_i18n ei    ON e.id = ei.evento_id AND ei.locale    = ?
            LEFT JOIN este_mes_i18n ei_es ON e.id = ei_es.evento_id AND ei_es.locale = 'es'
            WHERE e.id = ?
        `;
        const [rows] = await db.query(query, [lang, id]);
        return rows[0] || null;
    },

    async create(data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { dia, mes, tipo, is_published = 1, order_index = 0, titulo, descripcion, locale = 'es' } = data;

            const [result] = await connection.query(
                `INSERT INTO este_mes (dia, mes, tipo, is_published, order_index, created_by, updated_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [dia, mes, tipo, is_published ? 1 : 0, order_index, userId, userId]
            );
            const eventoId = result.insertId;

            await connection.query(
                `INSERT INTO este_mes_i18n (evento_id, locale, titulo, descripcion) VALUES (?, ?, ?, ?)`,
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

            const { dia, mes, tipo, is_published, order_index, titulo, descripcion, locale = 'es' } = data;

            const [result] = await connection.query(
                `UPDATE este_mes SET dia=?, mes=?, tipo=?, is_published=?, order_index=?, updated_by=?, updated_at=NOW()
                 WHERE id=?`,
                [dia, mes, tipo, is_published ? 1 : 0, order_index, userId, id]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }

            const [exists] = await connection.query(
                'SELECT id FROM este_mes_i18n WHERE evento_id = ? AND locale = ?', [id, locale]
            );
            if (exists.length > 0) {
                await connection.query(
                    `UPDATE este_mes_i18n SET titulo=?, descripcion=? WHERE evento_id=? AND locale=?`,
                    [titulo, descripcion, id, locale]
                );
            } else {
                await connection.query(
                    `INSERT INTO este_mes_i18n (evento_id, locale, titulo, descripcion) VALUES (?, ?, ?, ?)`,
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
        const [result] = await db.query('DELETE FROM este_mes WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    async _runAutoTranslation(eventoId, fields, targetLocales) {
        try {
            const translations = await TranslationService.translateBatch(fields, targetLocales);
            for (const locale of targetLocales) {
                const { titulo, descripcion } = translations[locale];
                await db.query(
                    `INSERT INTO este_mes_i18n (evento_id, locale, titulo, descripcion)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE titulo = VALUES(titulo), descripcion = VALUES(descripcion)`,
                    [eventoId, locale, titulo, descripcion]
                );
            }
            console.log(`[EsteMesModel] Auto-traducción completada para ID: ${eventoId}`);
        } catch (error) {
            console.error(`[EsteMesModel] Fallo en auto-traducción:`, error);
        }
    }
};

module.exports = EsteMesModel;
