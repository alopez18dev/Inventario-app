import { Router } from 'express';
import pool from '../db.js';
import { verificarToken, soloAdmin } from '../middleware/auth.js';

const router = Router();

function validarProducto(body) {
    const { nombre, precio, categoria_id = null, stock_minimo = 5 } = body;

    if (typeof nombre !== 'string' || !nombre.trim()) {
        return { error: 'El nombre es obligatorio' };
    }

    const precioNum = Number(precio);
    if (precio === undefined || precio === '' || Number.isNaN(precioNum) || precioNum < 0) {
        return { error: 'El precio debe ser un número mayor o igual a 0' };
    }

    const minimo = Number(stock_minimo);
    if (!Number.isInteger(minimo) || minimo < 0) {
        return { error: 'El stock mínimo debe ser un entero mayor o igual a 0' };
    }

    if (categoria_id !== null && !Number.isInteger(Number(categoria_id))) {
        return { error: 'La categoría es inválida' };
    }

    return {
        datos: {
        nombre: nombre.trim(),
        precio: precioNum,
        categoria_id: categoria_id === null ? null : Number(categoria_id),
        stock_minimo: minimo,
        },
    };
}

const SELECT_PRODUCTO = `
    SELECT p.id, p.nombre, p.precio, p.stock, p.stock_minimo,
            p.categoria_id, c.nombre AS categoria,
            (p.stock <= p.stock_minimo) AS stock_bajo
    FROM productos p
    LEFT JOIN categorias c ON c.id = p.categoria_id
`;

router.get('/', verificarToken, async (req, res) => {
    try {
        const { buscar, categoria_id, stock_bajo } = req.query;
        const condiciones = [];
        const valores = [];

        if (buscar) {
        valores.push(`%${buscar}%`);
        condiciones.push(`p.nombre ILIKE $${valores.length}`);
        }
        if (categoria_id) {
        if (!Number.isInteger(Number(categoria_id))) {
            return res.status(400).json({ mensaje: 'categoria_id inválido' });
        }
        valores.push(Number(categoria_id));
        condiciones.push(`p.categoria_id = $${valores.length}`);
        }
        if (stock_bajo === 'true') {
        condiciones.push('p.stock <= p.stock_minimo');
        }

        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        const result = await pool.query(`${SELECT_PRODUCTO} ${where} ORDER BY p.nombre`, valores);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los productos' });
    }
});

router.get('/:id', verificarToken, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
        return res.status(400).json({ mensaje: 'ID inválido' });
        }

        const result = await pool.query(`${SELECT_PRODUCTO} WHERE p.id = $1`, [id]);
        if (result.rowCount === 0) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el producto' });
    }
});

router.post('/', verificarToken, soloAdmin, async (req, res) => {
    try {
        const { error, datos } = validarProducto(req.body);
        if (error) {
        return res.status(400).json({ mensaje: error });
        }

        const result = await pool.query(
        `INSERT INTO productos (nombre, precio, categoria_id, stock_minimo)
        VALUES ($1, $2, $3, $4)
        RETURNING id`,
        [datos.nombre, datos.precio, datos.categoria_id, datos.stock_minimo]
        );

        const producto = await pool.query(`${SELECT_PRODUCTO} WHERE p.id = $1`, [result.rows[0].id]);
        res.status(201).json(producto.rows[0]);
    } catch (error) {
        if (error.code === '23503') {
        return res.status(400).json({ mensaje: 'La categoría indicada no existe' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al crear el producto' });
    }
});

router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
        return res.status(400).json({ mensaje: 'ID inválido' });
        }

        const { error, datos } = validarProducto(req.body);
        if (error) {
        return res.status(400).json({ mensaje: error });
        }

        const result = await pool.query(
        `UPDATE productos
        SET nombre = $1, precio = $2, categoria_id = $3, stock_minimo = $4
        WHERE id = $5
        RETURNING id`,
        [datos.nombre, datos.precio, datos.categoria_id, datos.stock_minimo, id]
        );
        if (result.rowCount === 0) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const producto = await pool.query(`${SELECT_PRODUCTO} WHERE p.id = $1`, [id]);
        res.json(producto.rows[0]);
    } catch (error) {
        if (error.code === '23503') {
        return res.status(400).json({ mensaje: 'La categoría indicada no existe' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al actualizar el producto' });
    }
});

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
        return res.status(400).json({ mensaje: 'ID inválido' });
        }

        const result = await pool.query('DELETE FROM productos WHERE id = $1', [id]);
        if (result.rowCount === 0) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto eliminado' });
    } catch (error) {
        if (error.code === '23503') {
        return res.status(409).json({ mensaje: 'No se puede eliminar: el producto tiene movimientos registrados' });
        }
        console.error(error);
        res.status(500).json({ mensaje: 'Error al eliminar el producto' });
    }
});

export default router;