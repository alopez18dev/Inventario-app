import { useState } from 'react';
import AdminProductos from '../components/AdminProductos.jsx';
import AdminCategorias from '../components/AdminCategorias.jsx';

function Administracion() {
    const [pestana, setPestana] = useState('productos');

    return (
        <section>
        <div className="encabezado-pagina">
            <h1>Administración</h1>
        </div>

        <div className="pestanas" role="tablist">
            <button
            type="button"
            role="tab"
            aria-selected={pestana === 'productos'}
            className={pestana === 'productos' ? 'pestana activa' : 'pestana'}
            onClick={() => setPestana('productos')}
            >
            Productos
            </button>
            <button
            type="button"
            role="tab"
            aria-selected={pestana === 'categorias'}
            className={pestana === 'categorias' ? 'pestana activa' : 'pestana'}
            onClick={() => setPestana('categorias')}
            >
            Categorías
            </button>
        </div>

        {pestana === 'productos' ? <AdminProductos /> : <AdminCategorias />}
        </section>
    );
}

export default Administracion;