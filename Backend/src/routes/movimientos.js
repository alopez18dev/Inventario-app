import { Router } from 'express';
import pool from '../db.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();

router.post('/', verificarToken, async (req, res) => {
    const { producto_id, tipo, cantidad, nota } = req.body;
    const productoId = Number(producto_id);
    const cant = Number(cantidad);

    if (!Number.isInteger(productoId)) {
        return res.status(400).json({ mensaje: 'producto_id inválido' });
    }
    if (!['entrada', 'salida'].includes(tipo)) {
        return res.status(400).json({ mensaje: "El tipo debe ser 'entrada' o 'salida'" });
    }
    if (!Number.isInteger(cant) || cant <= 0 || cant > 1000000) {
        return res.status(400).json({ mensaje: 'La cantidad debe ser un entero entre 1 y 1.000.000' });
    }
    if (nota !== undefined && nota !== null && typeof nota !== 'string') {
        return res.status(400).json({ mensaje: 'La nota debe ser texto' });
    }

    const client = await pool.connect();
    try {
    await client.query('BEGIN');

        const producto = await client.query(
        'SELECT id, stock FROM productos WHERE id = $1 FOR UPDATE',
        [productoId]
        );
        if (producto.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const stockActual = producto.rows[0].stock;
        if (tipo === 'salida' && cant > stockActual) {
        await client.query('ROLLBACK');
        return res.status(400).json({ mensaje: `Stock insuficiente. Disponible: ${stockActual}` });
        }

        const nuevoStock = tipo === 'entrada' ? stockActual + cant : stockActual - cant;

        await client.query('UPDATE productos SET stock = $1 WHERE id = $2', [nuevoStock, productoId]);

        const movimiento = await client.query(
        `INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, nota)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, producto_id, tipo, cantidad, nota, fecha`,
        [productoId, req.usuario.id, tipo, cant, nota?.trim() || null]
        );

        await client.query('COMMIT');
        res.status(201).json({ ...movimiento.rows[0], stock_resultante: nuevoStock });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar el movimiento' });
    } finally {
        client.release();
    }
});

router.get('/', verificarToken, async (req, res) => {
    try {
        const { producto_id, tipo } = req.query;
        const limite = Math.min(Math.max(Number.parseInt(req.query.limite, 10) || 50, 1), 200);
        const condiciones = [];
        const valores = [];

        if (req.usuario.rol !== 'admin') {
        valores.push(req.usuario.id);
        condiciones.push(`m.usuario_id = $${valores.length}`);
        }
        if (producto_id) {
        if (!Number.isInteger(Number(producto_id))) {
            return res.status(400).json({ mensaje: 'producto_id inválido' });
        }
        valores.push(Number(producto_id));
        condiciones.push(`m.producto_id = $${valores.length}`);
        }
        if (tipo) {
        if (!['entrada', 'salida'].includes(tipo)) {
            return res.status(400).json({ mensaje: "El tipo debe ser 'entrada' o 'salida'" });
        }
        valores.push(tipo);
        condiciones.push(`m.tipo = $${valores.length}`);
        }

        valores.push(limite);
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const result = await pool.query(
        `SELECT m.id, m.tipo, m.cantidad, m.nota, m.fecha,
            m.producto_id, p.nombre AS producto,
            m.usuario_id, u.nombre AS usuario
        FROM movimientos m
        JOIN productos p ON p.id = m.producto_id
        JOIN usuarios u ON u.id = m.usuario_id
        ${where}
        ORDER BY m.fecha DESC, m.id DESC
        LIMIT $${valores.length}`,
        valores
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los movimientos' });
    }
});

export default router;