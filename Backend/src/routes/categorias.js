import { Router } from 'express';
import pool from '../db.js';
import { verificarToken, soloAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', verificarToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener las categorías' });
    }
});

router.post('/', verificarToken, soloAdmin, async (req, res) => {
    try {
        const { nombre } = req.body;
        if (typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }

        const result = await pool.query(
        'INSERT INTO categorias (nombre) VALUES ($1) RETURNING id, nombre',
        [nombre.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
        return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear la categoría' });
    }
});

router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { nombre } = req.body;
        if (!Number.isInteger(id)) {
        return res.status(400).json({ mensaje: 'ID inválido' });
        }
        if (typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }

        const result = await pool.query(
        'UPDATE categorias SET nombre = $1 WHERE id = $2 RETURNING id, nombre',
        [nombre.trim(), id]
        );
        if (result.rowCount === 0) {
        return res.status(404).json({ mensaje: 'Categoría no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
        return res.status(409).json({ mensaje: 'Ya existe una categoría con ese nombre' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar la categoría' });
    }
});

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
        return res.status(400).json({ mensaje: 'ID inválido' });
        }

        const result = await pool.query('DELETE FROM categorias WHERE id = $1', [id]);
        if (result.rowCount === 0) {
        return res.status(404).json({ mensaje: 'Categoría no encontrada' });
        }
        res.json({ mensaje: 'Categoría eliminada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar la categoría' });
    }
});

export default router;