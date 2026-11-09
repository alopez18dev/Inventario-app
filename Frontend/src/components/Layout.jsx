import { NavLink, Outlet } from 'react-router-dom';

function Layout({ usuario, onLogout }) {
    return (
        <>
        <header className="barra">
            <div className="barra-contenido">
            <span className="marca">Inventario</span>

            <nav className="barra-nav">
                    <NavLink to="/" end>
                        Productos
                    </NavLink>
                <NavLink to="/movimientos">Movimientos</NavLink>
            </nav>

            <div className="barra-usuario">
                <span>{usuario.nombre}</span>
                <span className="etiqueta">{usuario.rol}</span>
                <button className="boton-secundario" onClick={onLogout}>
                Cerrar sesión
                </button>
            </div>
            </div>
        </header>

        <main className="contenedor">
            <Outlet />
        </main>
        </>
    );
}

export default Layout;