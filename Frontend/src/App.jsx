import { useState, useEffect } from 'react';
import Login from './pages/login.jsx';
import { peticion } from './api.js';

function App() {
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    peticion('/auth/perfil')
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setVerificando(false));
  }, []);

  async function cerrarSesion() {
    try {
      await peticion('/auth/logout', { metodo: 'POST' });
    } catch {
      // si falla el aviso al servidor, igual cerramos la sesión en pantalla
    }
    setUsuario(null);
  }

  if (verificando) {
    return <p className="cargando">Cargando...</p>;
  }

  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  return (
    <main className="inicio">
      <h1>Hola, {usuario.nombre}</h1>
      <p>Tu rol es: {usuario.rol}</p>
      <button onClick={cerrarSesion}>Cerrar sesión</button>
    </main>
  );
}

export default App;