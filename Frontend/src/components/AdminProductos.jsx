import { useState, useEffect } from 'react';
import { peticion } from '../api.js';
import { formatoPrecio } from '../formato.js';
import Modal from './Modal.jsx';

function FormularioProducto({ producto, categorias, onGuardado, onCancelar }) {
    const [nombre, setNombre] = useState(producto?.nombre ?? '');
    const [precio, setPrecio] = useState(producto ? String(producto.precio) : '');
    const [categoriaId, setCategoriaId] = useState(
        producto?.categoria_id != null ? String(producto.categoria_id) : ''
    );
    const [stockMinimo, setStockMinimo] = useState(
        producto ? String(producto.stock_minimo) : '5'
    );
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError('');
        setGuardando(true);

        const cuerpo = {
        nombre,
        precio: Number(precio),
        categoria_id: categoriaId === '' ? null : Number(categoriaId),
        stock_minimo: Number(stockMinimo),
        };

        try {
        if (producto) {
            await peticion(`/productos/${producto.id}`, { metodo: 'PUT', cuerpo });
        } else {
            await peticion('/productos', { metodo: 'POST', cuerpo });
        }
        onGuardado();
        } catch (err) {
        setError(err.message);
        setGuardando(false);
        }
    }

    return (
        <form className="formulario" onSubmit={manejarEnvio}>
        {error && <p className="mensaje-error">{error}</p>}

        <label>
            Nombre
            <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={150}
            required
            />
        </label>

        <label>
            Categoría
            <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                {c.nombre}
                </option>
            ))}
            </select>
        </label>

        <div className="fila-doble">
            <label>
            Precio
            <input
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
            />
            </label>

            <label>
            Stock mínimo
            <input
                type="number"
                min="0"
                step="1"
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                required
            />
            </label>
        </div>

        <p className="texto-suave texto-pequeno">
            El stock actual no se edita aquí: cambia con las entradas y salidas de Movimientos.
        </p>

        <div className="modal-acciones">
            <button type="button" className="boton-secundario" onClick={onCancelar}>
            Cancelar
            </button>
            <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar'}
            </button>
        </div>
        </form>
    );
}

function AdminProductos() {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [recarga, setRecarga] = useState(0);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);

    const [productoAEliminar, setProductoAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [errorEliminar, setErrorEliminar] = useState('');

    useEffect(() => {
        let cancelado = false;

        async function cargar() {
        try {
            const [listaProductos, listaCategorias] = await Promise.all([
            peticion('/productos'),
            peticion('/categorias'),
            ]);
            if (!cancelado) {
            setProductos(listaProductos);
            setCategorias(listaCategorias);
            setError('');
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

    function abrirNuevo() {
        setProductoEditando(null);
        setModalAbierto(true);
    }

    function abrirEdicion(producto) {
        setProductoEditando(producto);
        setModalAbierto(true);
    }

    function cerrarModal() {
        setModalAbierto(false);
    }

    function alGuardar() {
        setModalAbierto(false);
        setRecarga((n) => n + 1);
    }

    function pedirEliminar(producto) {
        setErrorEliminar('');
        setProductoAEliminar(producto);
    }

    function cerrarEliminar() {
        setProductoAEliminar(null);
        setErrorEliminar('');
    }

    async function confirmarEliminacion() {
        setEliminando(true);
        setErrorEliminar('');
        try {
        await peticion(`/productos/${productoAEliminar.id}`, { metodo: 'DELETE' });
        setProductoAEliminar(null);
        setRecarga((n) => n + 1);
        } catch (err) {
        setErrorEliminar(err.message);
        } finally {
        setEliminando(false);
        }
    }

    return (
        <>
        <div className="barra-acciones">
            <span className="texto-suave">
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
            </span>
            <button type="button" onClick={abrirNuevo}>
            + Nuevo producto
            </button>
        </div>

        {error && <p className="mensaje-error">{error}</p>}

        {cargando ? (
            <p className="texto-suave">Cargando...</p>
        ) : productos.length === 0 ? (
            <p className="texto-suave">Aún no hay productos. Crea el primero con «Nuevo producto».</p>
        ) : (
            <div className="tabla-contenedor">
            <table className="tabla">
                <thead>
                <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th className="num">Precio</th>
                    <th className="num">Stock</th>
                    <th className="num">Acciones</th>
                </tr>
                </thead>
                <tbody>
                {productos.map((p) => (
                    <tr key={p.id}>
                    <td>{p.nombre}</td>
                    <td>{p.categoria ?? 'Sin categoría'}</td>
                    <td className="num">{formatoPrecio.format(Number(p.precio))}</td>
                    <td className="num">{p.stock}</td>
                    <td className="num">
                        <div className="acciones">
                        <button
                            type="button"
                            className="boton-secundario boton-pequeno"
                            onClick={() => abrirEdicion(p)}
                        >
                            Editar
                        </button>
                        <button
                            type="button"
                            className="boton-peligro boton-pequeno"
                            onClick={() => pedirEliminar(p)}
                        >
                            Eliminar
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        )}

        <Modal
            abierto={modalAbierto}
            titulo={productoEditando ? 'Editar producto' : 'Nuevo producto'}
            onCerrar={cerrarModal}
            cerrarAlClicFuera={false}
        >
            <FormularioProducto
            producto={productoEditando}
            categorias={categorias}
            onGuardado={alGuardar}
            onCancelar={cerrarModal}
            />
        </Modal>

        <Modal
            abierto={productoAEliminar !== null}
            titulo="Eliminar producto"
            onCerrar={cerrarEliminar}
        >
            <p>
            ¿Seguro que quieres eliminar <strong>{productoAEliminar?.nombre}</strong>? Esta acción no
            se puede deshacer.
            </p>
            {errorEliminar && <p className="mensaje-error">{errorEliminar}</p>}
            <div className="modal-acciones">
            <button type="button" className="boton-secundario" onClick={cerrarEliminar}>
                Cancelar
            </button>
            <button
                type="button"
                className="boton-peligro"
                onClick={confirmarEliminacion}
                disabled={eliminando}
            >
                {eliminando ? 'Eliminando...' : 'Eliminar'}
            </button>
            </div>
        </Modal>
        </>
    );
}

export default AdminProductos;