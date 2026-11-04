import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ mensaje: 'Nombre, email y contraseña son obligatorios' });
        }
        if (password.length < 8) {
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const emailLimpio = email.trim().toLowerCase();

        const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [emailLimpio]);
        if (existe.rows.length > 0) {
            return res.status(409).json({ mensaje: 'Ya existe un usuario con ese email' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, nombre, email, rol`,
            [nombre.trim(), emailLimpio, passwordHash]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al registrar el usuario' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ mensaje: 'Email y contraseña son obligatorios' });
        }

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email.trim().toLowerCase()]
        );
        const usuario = result.rows[0];

        if (!usuario) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
        }

        const passwordValida = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValida) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al iniciar sesión' });
    }
    });

    router.get('/perfil', verificarToken, (req, res) => {
    res.json(req.usuario);
});

export default router;