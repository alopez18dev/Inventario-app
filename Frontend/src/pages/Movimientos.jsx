import { useState, useEffect } from 'react';
import { peticion } from '../api.js';

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
});

function Movimientos({ usuario }) {
    const [productos, setProductos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [recarga, setRecarga] = useState(0);

    const [productoId, setProductoId] = useState('');
    const [tipo, setTipo] = useState('entrada');
    const [cantidad, setCantidad] = useState('');
    const [nota, setNota] = useState('');
    const [enviando, setEnviando] = useState(false);

    const [error, setError] = useState('');
    const [exito, setExito] = useState('');

    const esAdmin = usuario.rol === 'admin';

    useEffect(() => {
        let cancelado = false;

        async function cargar() {
        try {
            const [listaProductos, listaMovimientos] = await Promise.all([
            peticion('/productos'),
            peticion('/movimientos'),
            ]);
            if (!cancelado) {
            setProductos(listaProductos);
            setMovimientos(listaMovimientos);
            }
        } catch (err) {
            if (!cancelado) setError(err.message);
        } finally {
            if (!cancelado) setCargando(false);
        }
        }

        cargar();
        return () => {
        cancelado = true;
        };
    }, [recarga]);

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError('');
        setExito('');
        setEnviando(true);

        try {
        const resultado = await peticion('/movimientos', {
            metodo: 'POST',
            cuerpo: {
            producto_id: Number(productoId),
            tipo,
            cantidad: Number(cantidad),
            nota,
            },
        });

        const producto = productos.find((p) => p.id === Number(productoId));
        setExito(
            `Movimiento registrado. Nuevo stock de ${producto?.nombre}: ${resultado.stock_resultante}`
        );
        setCantidad('');
        setNota('');
        setRecarga((n) => n + 1);
        } catch (err) {
        setError(err.message);
        } finally {
        setEnviando(false);
        }
    }

    return (
        <section>
        <div className="encabezado-pagina">
            <h1>Movimientos</h1>
        </div>

        <div className="tarjeta">
            <h2>Registrar movimiento</h2>

            {error && <p className="mensaje-error">{error}</p>}
            {exito && <p className="mensaje-exito">{exito}</p>}

            <form className="formulario-movimiento" onSubmit={manejarEnvio}>
            <label>
                Producto
                <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                required
                >
                <option value="" disabled>
                    Selecciona un producto
                </option>
                {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                    {`${p.nombre} (stock: ${p.stock})`}
                    </option>
                ))}
                </select>
            </label>

            <label>
                Tipo
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="entrada">Entrada (suma stock)</option>
                <option value="salida">Salida (resta stock)</option>
                </select>
            </label>

            <label>
                Cantidad
                <input
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
                />
            </label>

            <label>
                Nota (opcional)
                <input
                type="text"
                maxLength={200}
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                />
            </label>

            <button type="submit" disabled={enviando}>
                {enviando ? 'Registrando...' : 'Registrar'}
            </button>
            </form>
        </div>

        <div className="encabezado-pagina">
            <h2 className="subtitulo">
            {esAdmin ? 'Historial de movimientos' : 'Mis movimientos'}
            </h2>
            <span className="texto-suave">Se muestran los 50 más recientes</span>
        </div>

        {cargando ? (
            <p className="texto-suave">Cargando...</p>
        ) : movimientos.length === 0 ? (
            <p className="texto-suave">Todavía no hay movimientos registrados.</p>
        ) : (
            <div className="tabla-contenedor">
            <table className="tabla">
                <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th className="num">Cantidad</th>
                    <th>Nota</th>
                    {esAdmin && <th>Usuario</th>}
                </tr>
                </thead>
                <tbody>
                {movimientos.map((m) => (
                    <tr key={m.id}>
                    <td>{formatoFecha.format(new Date(m.fecha))}</td>
                    <td>{m.producto}</td>
                    <td>
                        <span
                        className={`etiqueta ${
                            m.tipo === 'entrada' ? 'etiqueta-ok' : 'etiqueta-salida'
                        }`}
                        >
                        {m.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </span>
                    </td>
                    <td className="num">{m.cantidad}</td>
                    <td className="celda-nota">{m.nota ?? '—'}</td>
                    {esAdmin && <td>{m.usuario}</td>}
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}
        </section>
    );
}

export default Movimientos;