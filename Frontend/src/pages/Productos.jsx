import { useState, useEffect } from 'react';
import { peticion } from '../api.js';

const formatoPrecio = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

function Productos() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [buscar, setBuscar] = useState('');
    const [categoriaId, setCategoriaId] = useState('');
    const [soloStockBajo, setSoloStockBajo] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        peticion('/categorias')
        .then(setCategorias)
        .catch((err) => setError(err.message));
    }, []);

    useEffect(() => {
        let cancelado = false;

        const temporizador = setTimeout(async () => {
        setCargando(true);
        setError('');

        const params = new URLSearchParams();
        if (buscar.trim()) params.set('buscar', buscar.trim());
        if (categoriaId) params.set('categoria_id', categoriaId);
        if (soloStockBajo) params.set('stock_bajo', 'true');
        const consulta = params.toString();

        try {
            const datos = await peticion(`/productos${consulta ? `?${consulta}` : ''}`);
            if (!cancelado) setProductos(datos);
        } catch (err) {
            if (!cancelado) setError(err.message);
        } finally {
            if (!cancelado) setCargando(false);
        }
        }, 300);

        return () => {
        cancelado = true;
        clearTimeout(temporizador);
        };
    }, [buscar, categoriaId, soloStockBajo]);

    return (
        <section>
        <div className="encabezado-pagina">
            <h1>Productos</h1>
            {!cargando && (
            <span className="texto-suave">
                {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
            </span>
            )}
        </div>

        <div className="filtros">
            <input
            type="search"
            placeholder="Buscar producto..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            />

            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                {c.nombre}
                </option>
            ))}
            </select>

            <label className="casilla">
            <input
                type="checkbox"
                checked={soloStockBajo}
                onChange={(e) => setSoloStockBajo(e.target.checked)}
            />
            Solo stock bajo
            </label>
        </div>

        {error && <p className="mensaje-error">{error}</p>}

        {cargando ? (
            <p className="texto-suave">Cargando...</p>
        ) : productos.length === 0 ? (
            <p className="texto-suave">No hay productos que coincidan con la búsqueda.</p>
        ) : (
            <div className="tabla-contenedor">
            <table className="tabla">
                <thead>
                <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="num">Precio</th>
                    <th className="num">Stock</th>
                    <th>Estado</th>
                </tr>
                </thead>
                <tbody>
                {productos.map((p) => (
                    <tr key={p.id} className={p.stock_bajo ? 'fila-alerta' : ''}>
                    <td>{p.nombre}</td>
                    <td>{p.categoria ?? 'Sin categoría'}</td>
                    <td className="num">{formatoPrecio.format(Number(p.precio))}</td>
                    <td className="num">{p.stock}</td>
                    <td>
                        {p.stock_bajo ? (
                        <span className="etiqueta etiqueta-alerta">Stock bajo</span>
                        ) : (
                        <span className="etiqueta etiqueta-ok">OK</span>
                        )}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        </section>
    );
}

export default Productos;