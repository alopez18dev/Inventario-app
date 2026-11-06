import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import categoriasRoutes from './routes/categorias.js';
import productosRoutes from './routes/productos.js';
import movimientosRoutes from './routes/movimientos.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/categorias', categoriasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/movimientos', movimientosRoutes);
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(cookieParser());

app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS hora');
        res.json({ estado: 'ok', hora_db: result.rows[0].hora });
    } catch (error) {
        console.error(error);
        res.status(500).json({ estado: 'error', mensaje: 'No se pudo conectar a la base de datos' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});