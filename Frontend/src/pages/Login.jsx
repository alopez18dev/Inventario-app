import { useState } from 'react';
import { peticion } from '../api.js';

function Login({ onLogin }) {
    const [modo, setModo] = useState('login');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [verPassword, setVerPassword] = useState(false);

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

            <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <div className="campo-password">
                <input
                id="password"
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={esRegistro ? 'new-password' : 'current-password'}
                minLength={8}
                required
                />
                <button
                type="button"
                className="boton-ojo"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={verPassword}
                >
                {verPassword ? (
                    <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                ) : (
                    <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
                </button>
            </div>
            </div>

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