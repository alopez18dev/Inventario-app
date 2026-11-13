import { useState } from 'react';
import { peticion } from '../api.js';

function Login({ onLogin }) {
    const [modo, setModo] = useState('login');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const esRegistro = modo === 'registro';

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError('');
        setCargando(true);

        try {
        if (esRegistro) {
            await peticion('/auth/register', {
            metodo: 'POST',
            cuerpo: { nombre, email, password },
            });
        }
        const datos = await peticion('/auth/login', {
            metodo: 'POST',
            cuerpo: { email, password },
        });
        onLogin(datos.usuario);
        } catch (err) {
        setError(err.message);
        } finally {
        setCargando(false);
        }
    }

    function cambiarModo() {
        setModo(esRegistro ? 'login' : 'registro');
        setError('');
    }

    return (
        <main className="auth">
        <form className="auth-tarjeta" onSubmit={manejarEnvio}>
            <h1>{esRegistro ? 'Crear cuenta' : 'Iniciar sesión'}</h1>

            {esRegistro && (
            <label>
                Nombre
                <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                />
            </label>
            )}

            <label>
            Correo electrónico
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            </label>

            <label>
            Contraseña
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
            />
            </label>

            {error && <p className="mensaje-error">{error}</p>}

            <button type="submit" disabled={cargando}>
            {cargando ? 'Cargando...' : esRegistro ? 'Registrarme' : 'Entrar'}
            </button>

            <p className="auth-cambio">
            {esRegistro ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
            <button type="button" className="enlace" onClick={cambiarModo}>
                {esRegistro ? 'Inicia sesión' : 'Regístrate'}
            </button>
            </p>
        </form>
        </main>
    );
}

export default Login;