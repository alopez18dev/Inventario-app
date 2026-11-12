import 'dotenv/config';
import pg from 'pg';

const configuracion = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: true }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    };

const pool = new pg.Pool({
    ...configuracion,
    max: 10,
    connectionTimeoutMillis: 15000,
});

pool.on('error', (error) => {
    console.error('Error en una conexión inactiva de la base de datos:', error.message);
});

export default pool;