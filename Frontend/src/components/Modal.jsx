import { useEffect, useRef } from 'react';

function Modal({ abierto, titulo, onCerrar, cerrarAlClicFuera = true, children }) {
    const ref = useRef(null);

    useEffect(() => {
        const dialogo = ref.current;
        if (abierto && !dialogo.open) {
        dialogo.showModal();
        dialogo.querySelector('input, select, textarea')?.focus();
        } else if (!abierto && dialogo.open) {
        dialogo.close();
        }
    }, [abierto]);

    function manejarClicFondo(evento) {
    if (cerrarAlClicFuera && evento.target === ref.current) onCerrar();
    }

    return (
        <dialog ref={ref} className="modal" onClose={onCerrar} onClick={manejarClicFondo}>
        <div className="modal-contenido">
            <div className="modal-cabecera">
            <h2>{titulo}</h2>
            <button
                type="button"
                className="boton-secundario boton-pequeno"
                onClick={onCerrar}
                aria-label="Cerrar"
            >
                ✕
            </button>
            </div>
            {abierto && children}
        </div>
        </dialog>
    );
}

export default Modal;