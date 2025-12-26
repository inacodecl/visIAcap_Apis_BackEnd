const db = require('../config/db');

/**
 * Obtener lista de entrevistas públicas (solo visibles)
 */
exports.getEntrevistas = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM entrevistas WHERE visible = TRUE ORDER BY fecha_grabacion DESC');
        res.json(rows);
        console.log('DEBUG [getEntrevistas]: Entrevistas obtenidas correctamente', { rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener entrevistas' });
    }
};

/**
 * Obtener TODAS las entrevistas (Admin)
 */
exports.getAllEntrevistas = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM entrevistas ORDER BY fecha_grabacion DESC');
        res.json(rows);
        console.log('DEBUG [getAllEntrevistas]: Entrevistas obtenidas correctamente', { rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener listado completo de entrevistas' });
    }
};

/**
 * Crear nueva entrevista (Admin)
 */
exports.createEntrevista = async (req, res) => {
    const { titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible } = req.body;

    if (!titulo || !entrevistado || !url_video || !url_imagen) {
        return res.status(400).json({ message: 'Faltan campos obligatorios (titulo, entrevistado, video, imagen)' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO entrevistas (titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion || new Date(), visible !== undefined ? visible : true]
        );
        res.status(201).json({ id: result.insertId, message: 'Entrevista creada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear la entrevista' });
    }
};

/**
 * Actualizar entrevista completa (PUT)
 */
exports.updateEntrevista = async (req, res) => {
    const { id } = req.params;
    const { titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE entrevistas SET titulo=?, entrevistado=?, descripcion=?, url_video=?, url_imagen=?, fecha_grabacion=?, visible=? WHERE id=?',
            [titulo, entrevistado, descripcion, url_video, url_imagen, fecha_grabacion, visible, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Entrevista no encontrada' });
        }

        res.json({ message: 'Entrevista actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar entrevista' });
    }
};

/**
 * Actualización parcial (PATCH)
 */
exports.patchEntrevista = async (req, res) => {
    const { id } = req.params;
    const fields = req.body;

    // Lista de campos permitidos para evitar inyección o campos no deseados
    const allowedFields = ['titulo', 'entrevistado', 'descripcion', 'url_video', 'url_imagen', 'fecha_grabacion', 'visible'];
    const updates = [];
    const values = [];

    for (const key in fields) {
        if (allowedFields.includes(key)) {
            updates.push(`${key} = ?`);
            values.push(fields[key]);
        }
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: 'No se enviaron campos válidos para actualizar' });
    }

    values.push(id);

    const query = `UPDATE entrevistas SET ${updates.join(', ')} WHERE id = ?`;

    try {
        const [result] = await db.query(query, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Entrevista no encontrada' });
        }
        res.json({ message: 'Entrevista actualizada parcialmente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar entrevista (PATCH)' });
    }
};

/**
 * Eliminar entrevista
 */
exports.deleteEntrevista = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM entrevistas WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Entrevista no encontrada' });
        }
        res.json({ message: 'Entrevista eliminada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar entrevista' });
    }
};
