const tablaInventario =
    document.getElementById('tablaInventario');

const editarInventarioSection =
    document.getElementById('editarInventarioSection');

const editarInventarioForm =
    document.getElementById('editarInventarioForm');

const inventarioSeleccionado =
    document.getElementById('inventarioSeleccionado');

const editarStockActual =
    document.getElementById('editarStockActual');

const editarStockMinimo =
    document.getElementById('editarStockMinimo');

const cancelarInventario =
    document.getElementById('cancelarInventario');

const mensajeInventario =
    document.getElementById('mensajeInventario');


let inventarioEditandoId = null;


// ===============================
// CARGAR INVENTARIO
// ===============================

async function cargarInventario() {

    try {

        const respuesta =
            await fetch('/api/inventario');

        const inventario =
            await respuesta.json();

        tablaInventario.innerHTML = '';


        inventario.forEach(item => {

            let estado = 'Disponible';

            if (item.stock_actual === 0) {

                estado = 'Sin stock';

            } else if (
                item.stock_minimo !== null &&
                item.stock_actual <= item.stock_minimo
            ) {

                estado = 'Stock bajo';

            }


            const fila =
                document.createElement('tr');


            fila.innerHTML = `
                <td>${item.producto}</td>
                <td>${item.color}</td>
                <td>${item.talla}</td>
                <td>${item.sucursal}</td>

                <td>
                    ${item.stock_actual}
                </td>

                <td>
                    ${
                        item.stock_minimo === null
                            ? '-'
                            : item.stock_minimo
                    }
                </td>

                <td>
                    ${estado}
                </td>

                <td>
                    <button class="boton-editar-inventario">
                        Editar
                    </button>
                </td>
            `;


            tablaInventario.appendChild(fila);


            // ===============================
            // BOTÓN EDITAR
            // ===============================

            const botonEditar =
                fila.querySelector(
                    '.boton-editar-inventario'
                );


            botonEditar.addEventListener(
                'click',
                () => {

                    inventarioEditandoId =
                        item.id_inventario;


                    inventarioSeleccionado.textContent =
                        `${item.producto} / ${item.color} / ${item.talla} / ${item.sucursal}`;


                    editarStockActual.value =
                        item.stock_actual;


                    editarStockMinimo.value =
                        item.stock_minimo === null
                            ? ''
                            : item.stock_minimo;


                    mensajeInventario.textContent = '';


                    editarInventarioSection.hidden =
                        false;


                    editarInventarioSection.scrollIntoView({
                        behavior: 'smooth'
                    });

                }
            );

        });

    } catch (error) {

        console.error(
            'Error al cargar inventario:',
            error
        );

    }

}


// ===============================
// GUARDAR CAMBIOS
// ===============================

editarInventarioForm.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();


        if (!inventarioEditandoId) {
            return;
        }


        const datos = {

            stock_actual:
                Number(editarStockActual.value),

            stock_minimo:
                editarStockMinimo.value

        };


        const respuesta =
            await fetch(
                `/api/inventario/${inventarioEditandoId}`,
                {

                    method: 'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(datos)

                }
            );


        const resultado =
            await respuesta.json();


        mensajeInventario.textContent =
            resultado.mensaje;


        if (respuesta.ok) {

            await cargarInventario();

            inventarioEditandoId = null;

            editarInventarioSection.hidden =
                true;

        }

    }
);


// ===============================
// CANCELAR
// ===============================

cancelarInventario.addEventListener(
    'click',
    () => {

        inventarioEditandoId = null;

        editarInventarioSection.hidden =
            true;

        editarInventarioForm.reset();

        mensajeInventario.textContent = '';

    }
);


// Cargar inventario al abrir
cargarInventario();