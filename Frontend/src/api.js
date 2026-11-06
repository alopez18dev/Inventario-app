const API_URL = import.meta.env.VITE_API_URL;

export async function peticion(ruta, { metodo = 'GET', cuerpo } = {}) {
    const headers = {};
    if (cuerpo) headers['Content-Type'] = 'application/json';

    let respuesta;
    try {
        respuesta = await fetch(`${API_URL}${ruta}`, {
        method: metodo,
        headers,
        body: cuerpo ? JSON.stringify(cuerpo) : undefined,
        credentials: 'include',
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor');
    }

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'Error en la petición');
    }
    return datos;
}