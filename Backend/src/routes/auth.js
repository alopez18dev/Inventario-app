import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { verificarToken } from '../middleware/auth.js';
import { limitadorLogin, limitadorRegistro } from '../middleware/limites.js';

const router = Router();

const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

const opcionesCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
};

router.post('/register', limitadorRegistro, async (req, res) => {
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

router.post('/login', limitadorLogin, async (req, res) => {
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

        res.cookie('token', token, { ...opcionesCookie, maxAge: DURACION_SESION_MS });

        res.json({
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al iniciar sesión' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token', opcionesCookie);
    res.json({ mensaje: 'Sesión cerrada' });
});

router.get('/perfil', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
        'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1',
        [req.usuario.id]
        );
        if (result.rowCount === 0) {
        return res.status(401).json({ mensaje: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el perfil' });
    }
});

export default router;