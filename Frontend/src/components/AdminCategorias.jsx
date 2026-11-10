import { useState, useEffect } from 'react';
import { peticion } from '../api.js';
import Modal from './Modal.jsx';

function FormularioCategoria({ categoria, onGuardado, onCancelar }) {
    const [nombre, setNombre] = useState(categoria?.nombre ?? '');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    async function manejarEnvio(evento) {
        evento.preventDefault();
        setError('');
        setGuardando(true);

        try {
        if (categoria) {
            await peticion(`/categorias/${categoria.id}`, { metodo: 'PUT', cuerpo: { nombre } });
        } else {
            await peticion('/categorias', { metodo: 'POST', cuerpo: { nombre } });
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
            maxLength={80}
            required
            />
        </label>

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

function AdminCategorias() {
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [recarga, setRecarga] = useState(0);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [categoriaEditando, setCategoriaEditando] = useState(null);

    const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [errorEliminar, setErrorEliminar] = useState('');

    useEffect(() => {
        let cancelado = false;

        async function cargar() {
        try {
            const lista = await peticion('/categorias');
            if (!cancelado) {
            setCategorias(lista);
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

    function abrirNueva() {
        setCategoriaEditando(null);
        setModalAbierto(true);
    }

    function abrirEdicion(categoria) {
        setCategoriaEditando(categoria);
        setModalAbierto(true);
    }

    function cerrarModal() {
        setModalAbierto(false);
    }

    function alGuardar() {
        setModalAbierto(false);
        setRecarga((n) => n + 1);
    }

    function pedirEliminar(categoria) {
        setErrorEliminar('');
        setCategoriaAEliminar(categoria);
    }

    function cerrarEliminar() {
        setCategoriaAEliminar(null);
        setErrorEliminar('');
    }

    async function confirmarEliminacion() {
        setEliminando(true);
        setErrorEliminar('');
        try {
        await peticion(`/categorias/${categoriaAEliminar.id}`, { metodo: 'DELETE' });
        setCategoriaAEliminar(null);
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
            {categorias.length} {categorias.length === 1 ? 'categoría' : 'categorías'}
            </span>
            <button type="button" onClick={abrirNueva}>
            + Nueva categoría
            </button>
        </div>

        {error && <p className="mensaje-error">{error}</p>}

        {cargando ? (
            <p className="texto-suave">Cargando...</p>
        ) : categorias.length === 0 ? (
            <p className="texto-suave">Aún no hay categorías. Crea la primera con «Nueva categoría».</p>
        ) : (
            <div className="tabla-contenedor">
            <table className="tabla">
                <thead>
                <tr>
                    <th>Nombre</th>
                    <th className="num">Acciones</th>
                </tr>
                </thead>
                <tbody>
                {categorias.map((c) => (
                    <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td className="num">
                        <div className="acciones">
                        <button
                            type="button"
                            className="boton-secundario boton-pequeno"
                            onClick={() => abrirEdicion(c)}
                        >
                            Editar
                        </button>
                        <button
                            type="button"
                            className="boton-peligro boton-pequeno"
                            onClick={() => pedirEliminar(c)}
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
            titulo={categoriaEditando ? 'Editar categoría' : 'Nueva categoría'}
            onCerrar={cerrarModal}
            cerrarAlClicFuera={false}
        >
            <FormularioCategoria
            categoria={categoriaEditando}
            onGuardado={alGuardar}
            onCancelar={cerrarModal}
            />
        </Modal>

        <Modal
            abierto={categoriaAEliminar !== null}
            titulo="Eliminar categoría"
            onCerrar={cerrarEliminar}
        >
            <p>
            ¿Seguro que quieres eliminar <strong>{categoriaAEliminar?.nombre}</strong>? Los productos
            de esta categoría quedarán sin categoría.
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

export default AdminCategorias;