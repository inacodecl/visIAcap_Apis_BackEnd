/**
 * Archivo: models/proyectos.model.js
 * Descripción: Modelo encargado de la interacción con la tabla 'proyectos' y sus traducciones ('proyectos_i18n').
 *              Maneja transacciones para asegurar integridad de datos.
 */

const db = require('../config/db');

const ProyectosModel = {
    /**
     * Obtiene el listado de proyectos filtrado por idioma y tipo
     * @param {string} lang - Código de idioma (es, en)
     * @param {string} tipo - Tipo de proyecto ('presente', 'futuro')
     */
    async findAll(lang = 'es', tipo = 'presente') {
        const query = `
            SELECT 
                p.id, p.slug, p.tipo, p.featured, p.order_index, 
                p.image_cover_url, p.url_externa, p.start_date, p.end_date, 
                p.location, p.is_published,
                pi.titulo, pi.resumen, pi.descripcion
            FROM proyectos p
            LEFT JOIN proyectos_i18n pi ON p.id = pi.proyecto_id
            WHERE pi.locale = ? AND p.tipo = ? AND p.is_published = 1
            ORDER BY p.order_index ASC, p.created_at DESC
        `;
        const [rows] = await db.query(query, [lang, tipo]);
        return rows;
    },

    /**
     * Obtiene un proyecto por ID e Idioma
     * @param {number} id 
     * @param {string} lang 
     */
    async findById(id, lang = 'es') {
        const query = `
            SELECT 
                p.*,
                pi.titulo, pi.resumen, pi.descripcion, pi.locale
            FROM proyectos p
            LEFT JOIN proyectos_i18n pi ON p.id = pi.proyecto_id
            WHERE p.id = ? AND pi.locale = ?
        `;
        const [rows] = await db.query(query, [id, lang]);
        return rows[0];
    },

    /**
     * Crea un nuevo proyecto con su traducción inicial (Transaccional)
     * @param {Object} data 
     * @param {number} userId 
     */
    async create(data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                slug, tipo = 'presente', featured, order_index,
                image_cover_url, url_externa, start_date, end_date,
                location, is_published,
                titulo, resumen, descripcion, locale = 'es'
            } = data;

            // 1. Insertar en proyectos
            const [resultP] = await connection.query(
                `INSERT INTO proyectos 
                (slug, tipo, featured, order_index, image_cover_url, url_externa, start_date, end_date, location, is_published, created_by, updated_by) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    slug, tipo, featured ? 1 : 0, order_index || 0,
                    image_cover_url, url_externa, start_date, end_date,
                    location, is_published ? 1 : 0, userId, userId
                ]
            );

            const proyectoId = resultP.insertId;

            // 2. Insertar en proyectos_i18n
            await connection.query(
                `INSERT INTO proyectos_i18n (proyecto_id, locale, titulo, resumen, descripcion) 
                VALUES (?, ?, ?, ?, ?)`,
                [proyectoId, locale, titulo, resumen, descripcion]
            );

            await connection.commit();
            return proyectoId;

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    /**
     * Actualización completa de un proyecto (PUT)
     * @param {number} id 
     * @param {Object} data 
     * @param {number} userId 
     */
    async updateFull(id, data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                slug, tipo, featured, order_index,
                image_cover_url, url_externa, start_date, end_date,
                location, is_published,
                titulo, resumen, descripcion, locale = 'es'
            } = data;

            // 1. Actualizar proyectos
            // Nota: Se asume que no se actualiza todo a NULL si no viene, pero en PUT estricto debería.
            // Aquí haremos una actualización más flexible similar al modelo historias.

            const [result] = await connection.query(
                `UPDATE proyectos SET 
                slug=?, tipo=?, featured=?, order_index=?, image_cover_url=?, 
                url_externa=?, start_date=?, end_date=?, location=?, is_published=?, 
                updated_by=?, updated_at=NOW()
                WHERE id=?`,
                [
                    slug, tipo, featured ? 1 : 0, order_index, image_cover_url,
                    url_externa, start_date, end_date, location, is_published ? 1 : 0,
                    userId, id
                ]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }

            // 2. Actualizar o Insertar traducción
            const [exists] = await connection.query('SELECT id FROM proyectos_i18n WHERE proyecto_id = ? AND locale = ?', [id, locale]);

            if (exists.length > 0) {
                await connection.query(
                    `UPDATE proyectos_i18n SET titulo=?, resumen=?, descripcion=? WHERE proyecto_id=? AND locale=?`,
                    [titulo, resumen, descripcion, id, locale]
                );
            } else {
                await connection.query(
                    `INSERT INTO proyectos_i18n (proyecto_id, locale, titulo, resumen, descripcion) VALUES (?, ?, ?, ?, ?)`,
                    [id, locale, titulo, resumen, descripcion]
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
     * Elimina un proyecto
     * @param {number} id 
     */
    async delete(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // La FK tiene ON DELETE CASCADE, así que eliminar el padre borra los hijos.
            // Pero podríamos borrar explícitamente si queremos estar seguros o si la FK cambia.
            // Seguiremos el patrón de historias que borra hijos primero por seguridad o lógica explicita.
            await connection.query('DELETE FROM proyectos_i18n WHERE proyecto_id = ?', [id]);
            // Tablas N:M (categories/tags) y media no están siendo borradas explícitamente aquí, 
            // asumimos que el CASCADE de la base de datos se encarga, o deberíamos agregarlo si se requiere limpieza manual.
            // Revisando el esquema SQL:
            // fk_pc_proyecto -> ON DELETE CASCADE
            // fk_pt_proyecto -> ON DELETE CASCADE
            // fk_pm_proyecto -> ON DELETE CASCADE
            // fk_proyectos_i18n_proyecto -> ON DELETE CASCADE

            // Dado que todo tiene CASCADE, borrar el padre es suficiente.
            const [result] = await connection.query('DELETE FROM proyectos WHERE id = ?', [id]);

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

module.exports = ProyectosModel;
