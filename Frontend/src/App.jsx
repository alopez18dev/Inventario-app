import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Layout from './components/Layout.jsx';
import Productos from './pages/Productos.jsx';
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
    <Routes>
      <Route element={<Layout usuario={usuario} onLogout={cerrarSesion} />}>
        <Route path="/" element={<Productos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;