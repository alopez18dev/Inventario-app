import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ mensaje: 'Token requerido' });
    }

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