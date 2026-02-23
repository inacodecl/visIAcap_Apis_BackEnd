const TagsModel = require('../models/tags.model');
const CategoriasModel = require('../models/categorias.model');

const MetadataController = {

    /**
     * GET /api/metadata/tags
     * Obtiene la lista de etiquetas
     */
    async getTags(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const tags = await TagsModel.findAll(lang);
            return res.json(tags);
        } catch (error) {
            console.error('Error en getTags:', error);
            return res.status(500).json({ message: 'Error interno al obtener etiquetas.' });
        }
    },

    /**
     * GET /api/metadata/categorias
     * Obtiene la lista de categorías
     */
    async getCategorias(req, res) {
        try {
            const lang = req.query.lang || 'es';
            const categorias = await CategoriasModel.findAll(lang);
            return res.json(categorias);
        } catch (error) {
            console.error('Error en getCategorias:', error);
            return res.status(500).json({ message: 'Error interno al obtener categorías.' });
        }
    },

    /**
     * POST /api/metadata/tags
     * Crea un tag
     */
    async createTag(req, res) {
        try {
            const { slug, nombre_es, nombre_en } = req.body;
            if (!slug || !nombre_es) {
                return res.status(400).json({ message: 'Slug y Nombre (ES) son requeridos.' });
            }
            const userId = req.user ? req.user.id : null;
            const id = await TagsModel.create(slug, nombre_es, nombre_en || nombre_es, userId);
            return res.status(201).json({ message: 'Tag creado', id });
        } catch (error) {
            console.error('Error createTag:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'El slug ya existe.' });
            }
            return res.status(500).json({ message: 'Error interno.' });
        }
    },

    /**
     * DELETE /api/metadata/tags/:id
     * Elimina un tag
     */
    async deleteTag(req, res) {
        try {
            const { id } = req.params;
            const success = await TagsModel.delete(id);
            if (!success) {
                return res.status(404).json({ message: 'Tag no encontrado' });
            }
            return res.json({ message: 'Tag eliminado' });
        } catch (error) {
            console.error('Error deleteTag:', error);
            return res.status(500).json({ message: 'Error interno.' });
        }
    },

    /**
     * POST /api/metadata/categorias
     * Crea una categoría
     */
    async createCategoria(req, res) {
        try {
            const { slug, nombre_es, nombre_en } = req.body;
            if (!slug || !nombre_es) {
                return res.status(400).json({ message: 'Slug y Nombre (ES) son requeridos.' });
            }
            const userId = req.user ? req.user.id : null;
            const id = await CategoriasModel.create(slug, nombre_es, nombre_en || nombre_es, userId);
            return res.status(201).json({ message: 'Categoría creada', id });
        } catch (error) {
            console.error('Error createCategoria:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'El slug ya existe.' });
            }
            return res.status(500).json({ message: 'Error interno.' });
        }
    },

    /**
     * DELETE /api/metadata/categorias/:id
     * Elimina una categoría
     */
    async deleteCategoria(req, res) {
        try {
            const { id } = req.params;
            const success = await CategoriasModel.delete(id);
            if (!success) {
                return res.status(404).json({ message: 'Categoría no encontrada' });
            }
            return res.json({ message: 'Categoría eliminada' });
        } catch (error) {
            console.error('Error deleteCategoria:', error);
            return res.status(500).json({ message: 'Error interno.' });
        }
    }
};

module.exports = MetadataController;
