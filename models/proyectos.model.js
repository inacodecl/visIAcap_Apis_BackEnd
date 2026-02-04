const db = require('../config/db');

const ProyectosModel = {
    /**
     * Obtiene el listado de proyectos filtrado por idioma y tipo
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
     * Obtiene un proyecto por ID e Idioma con TODAS sus relaciones
     */
    async findById(id, lang = 'es') {
        const connection = await db.getConnection();
        try {
            // 1. Datos base del proyecto
            const queryP = `
                SELECT 
                    p.*,
                    pi.titulo, pi.resumen, pi.descripcion, pi.locale
                FROM proyectos p
                LEFT JOIN proyectos_i18n pi ON p.id = pi.proyecto_id
                WHERE p.id = ? AND pi.locale = ?
            `;
            const [rowsP] = await connection.query(queryP, [id, lang]);

            if (rowsP.length === 0) return null;
            const proyecto = rowsP[0];

            // 2. Obtener Relaciones en paralelo
            const [members] = await connection.query('SELECT * FROM proyecto_miembros WHERE proyecto_id = ?', [id]);
            const [media] = await connection.query('SELECT * FROM proyecto_media WHERE proyecto_id = ? ORDER BY order_index ASC', [id]);

            // Tags (con nombres traducidos)
            const nombreTag = lang === 'en' ? 'nombre_en' : 'nombre_es';
            const [tags] = await connection.query(`
                SELECT t.id, t.slug, t.${nombreTag} as nombre 
                FROM tags t 
                JOIN proyecto_tag pt ON t.id = pt.tag_id 
                WHERE pt.proyecto_id = ?
            `, [id]);

            // Categorías (con nombres traducidos)
            const nombreCat = lang === 'en' ? 'nombre_en' : 'nombre_es';
            const [categories] = await connection.query(`
                SELECT c.id, c.slug, c.${nombreCat} as nombre 
                FROM categorias c 
                JOIN proyecto_categoria pc ON c.id = pc.categoria_id 
                WHERE pc.proyecto_id = ?
            `, [id]);

            // Armar objeto completo
            proyecto.members = members;
            proyecto.images = media;
            proyecto.tags = tags;
            proyecto.categories = categories;

            return proyecto;

        } finally {
            connection.release();
        }
    },

    /**
     * Crea un nuevo proyecto con todas sus relaciones (Transaccional)
     */
    async create(data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                slug, tipo = 'presente', featured, order_index,
                image_cover_url, url_externa, start_date, end_date,
                location, is_published,
                titulo, resumen, descripcion, locale = 'es',
                members = [], images = [], tags = [], categories = []
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

            // 3. Insertar Miembros
            if (members.length > 0) {
                const memberValues = members.map(m => [proyectoId, m.nombre, m.rol, m.contacto]);
                await connection.query(
                    `INSERT INTO proyecto_miembros (proyecto_id, nombre, rol, contacto) VALUES ?`,
                    [memberValues]
                );
            }

            // 4. Insertar Media
            if (images.length > 0) {
                const mediaValues = images.map((img, idx) => [
                    proyectoId, img.tipo || 'image', img.url,
                    img.alt_es || '', img.alt_en || '', img.order_index || idx
                ]);
                await connection.query(
                    `INSERT INTO proyecto_media (proyecto_id, tipo, url, alt_es, alt_en, order_index) VALUES ?`,
                    [mediaValues]
                );
            }

            // 5. Insertar Tags
            if (tags.length > 0) {
                // tags viene como array de IDs
                const tagValues = tags.map(tagId => [proyectoId, tagId]);
                await connection.query(
                    `INSERT INTO proyecto_tag (proyecto_id, tag_id) VALUES ?`,
                    [tagValues]
                );
            }

            // 6. Insertar Categorias
            if (categories.length > 0) {
                // categories viene como array de IDs
                const catValues = categories.map(catId => [proyectoId, catId]);
                await connection.query(
                    `INSERT INTO proyecto_categoria (proyecto_id, categoria_id) VALUES ?`,
                    [catValues]
                );
            }

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
     * Actualización completa de un proyecto y sus relaciones (PUT)
     */
    async updateFull(id, data, userId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const {
                slug, tipo, featured, order_index,
                image_cover_url, url_externa, start_date, end_date,
                location, is_published,
                titulo, resumen, descripcion, locale = 'es',
                members = [], images = [], tags = [], categories = []
            } = data;

            // 1. Actualizar proyectos
            const [result] = await connection.query(
                `UPDATE proyectos SET 
                slug=?, tipo=?, featured=?, order_index=?, image_cover_url=?, 
                url_externa=?, start_date=?, end_date=?, location=?, is_published=?, 
                updated_by=?, updated_at=NOW()
                WHERE id=?`,
                [
                    slug, tipo, featured ? 1 : 0, order_index || 0, image_cover_url,
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

            // --- REEMPLAZO DE RELACIONES ---

            // 3. Miembros
            await connection.query('DELETE FROM proyecto_miembros WHERE proyecto_id = ?', [id]);
            if (members.length > 0) {
                const memberValues = members.map(m => [id, m.nombre, m.rol, m.contacto]);
                await connection.query(
                    `INSERT INTO proyecto_miembros (proyecto_id, nombre, rol, contacto) VALUES ?`,
                    [memberValues]
                );
            }

            // 4. Media
            await connection.query('DELETE FROM proyecto_media WHERE proyecto_id = ?', [id]);
            if (images.length > 0) {
                const mediaValues = images.map((img, idx) => [
                    id, img.tipo || 'image', img.url,
                    img.alt_es || '', img.alt_en || '', img.order_index || idx
                ]);
                await connection.query(
                    `INSERT INTO proyecto_media (proyecto_id, tipo, url, alt_es, alt_en, order_index) VALUES ?`,
                    [mediaValues]
                );
            }

            // 5. Tags
            await connection.query('DELETE FROM proyecto_tag WHERE proyecto_id = ?', [id]);
            if (tags.length > 0) {
                const tagValues = tags.map(tagId => [id, tagId]);
                await connection.query(
                    `INSERT INTO proyecto_tag (proyecto_id, tag_id) VALUES ?`,
                    [tagValues]
                );
            }

            // 6. Categorias
            await connection.query('DELETE FROM proyecto_categoria WHERE proyecto_id = ?', [id]);
            if (categories.length > 0) {
                const catValues = categories.map(catId => [id, catId]);
                await connection.query(
                    `INSERT INTO proyecto_categoria (proyecto_id, categoria_id) VALUES ?`,
                    [catValues]
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
     */
    async delete(id) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Borrado explícito de dependencias que no dependen de CASCADE (por seguridad)
            // Las tablas pivote y tablas hijas deberían tener ON DELETE CASCADE, 
            // pero si algo falla, aquí lo forzamos.
            await connection.query('DELETE FROM proyectos_i18n WHERE proyecto_id = ?', [id]);

            // Borramos el padre
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
