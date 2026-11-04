import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'Token requerido' });
    }

    const token = header.split(' ')[1];

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
}

export function soloAdmin(req, res, next) {
    if (req.usuario.rol !== 'admin') {
        return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
    }
    next();
}