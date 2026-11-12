import rateLimit from 'express-rate-limit';

const mensaje = { mensaje: 'Demasiados intentos. Inténtalo de nuevo más tarde.' };
const enProduccion = process.env.NODE_ENV === 'production';

export const limitadorLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: enProduccion ? 10 : 100,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: mensaje,
});

export const limitadorRegistro = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: enProduccion ? 5 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: mensaje,
});