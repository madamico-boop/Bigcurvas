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

let usuarioActual = null;


// ===============================
// CARGAR USUARIO ACTUAL
// ===============================

async function cargarUsuario() {

    try {

        const respuesta =
            await fetch(
                '/api/auth/me',
                {
                    credentials: 'include'
                }
            );


        if (!respuesta.ok) {

            window.location.href =
                'index.html';

            return false;

        }


        const datos =
            await respuesta.json();


        usuarioActual =
            datos.usuario;


        return true;


    } catch (error) {

        console.error(
            'Error al obtener usuario:',
            error
        );


        window.location.href =
            'index.html';


        return false;

    }

}


// ===============================
// CARGAR INVENTARIO
// ===============================

async function cargarInventario() {

    try {

        const respuesta =
            await fetch(
                '/api/inventario',
                {
                    credentials: 'include'
                }
            );


        if (respuesta.status === 401) {

            window.location.href =
                'index.html';

            return;

        }


        const inventario =
            await respuesta.json();


        if (!respuesta.ok) {

            console.error(
                inventario.mensaje
            );

            return;

        }


        tablaInventario.innerHTML = '';


        const esAdmin =
            usuarioActual &&
            usuarioActual.rol ===
                'administrador';


        inventario.forEach(item => {

            let estado =
                'Disponible';


            if (
                Number(item.stock_actual) === 0
            ) {

                estado =
                    'Sin stock';


            } else if (

                item.stock_minimo !== null &&

                Number(item.stock_actual) <=
                Number(item.stock_minimo)

            ) {

                estado =
                    'Stock bajo';

            }


            const fila =
                document.createElement(
                    'tr'
                );


            fila.innerHTML = `

                <td>
                    ${item.producto}
                </td>

                <td>
                    ${item.color}
                </td>

                <td>
                    ${item.talla}
                </td>

                <td>
                    ${item.sucursal}
                </td>

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

                    ${
                        esAdmin
                            ? `
                                <button
                                    class="boton-editar-inventario"
                                >
                                    Editar
                                </button>
                            `
                            : '-'
                    }

                </td>

            `;


            tablaInventario.appendChild(
                fila
            );


            // ===============================
            // SOLO ADMIN PUEDE EDITAR
            // ===============================

            if (!esAdmin) {

                return;

            }


            const botonEditar =
                fila.querySelector(
                    '.boton-editar-inventario'
                );


            botonEditar.addEventListener(
                'click',
                () => {

                    inventarioEditandoId =
                        item.id_inventario;


                    inventarioSeleccionado
                        .textContent =
                            `${item.producto} / ${item.color} / ${item.talla} / ${item.sucursal}`;


                    editarStockActual.value =
                        item.stock_actual;


                    editarStockMinimo.value =
                        item.stock_minimo === null
                            ? ''
                            : item.stock_minimo;


                    mensajeInventario
                        .textContent = '';


                    editarInventarioSection
                        .hidden = false;


                    editarInventarioSection
                        .scrollIntoView({
                            behavior:
                                'smooth'
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
    async event => {

        event.preventDefault();


        // Seguridad adicional en frontend

        if (
            !usuarioActual ||
            usuarioActual.rol !==
                'administrador'
        ) {

            mensajeInventario
                .textContent =
                    'No tiene permisos para editar inventario';

            return;

        }


        if (!inventarioEditandoId) {

            return;

        }


        const datos = {

            stock_actual:
                Number(
                    editarStockActual.value
                ),

            stock_minimo:
                editarStockMinimo.value

        };


        try {

            const respuesta =
                await fetch(
                    `/api/inventario/${inventarioEditandoId}`,
                    {

                        method:
                            'PATCH',

                        credentials:
                            'include',

                        headers: {

                            'Content-Type':
                                'application/json'

                        },

                        body:
                            JSON.stringify(
                                datos
                            )

                    }
                );


            const resultado =
                await respuesta.json();


            mensajeInventario
                .textContent =
                    resultado.mensaje;


            if (respuesta.ok) {

                await cargarInventario();


                inventarioEditandoId =
                    null;


                editarInventarioSection
                    .hidden = true;

            }


        } catch (error) {

            console.error(
                'Error al actualizar inventario:',
                error
            );


            mensajeInventario
                .textContent =
                    'Error al actualizar inventario';

        }

    }
);


// ===============================
// CANCELAR EDICIÓN
// ===============================

cancelarInventario.addEventListener(
    'click',
    () => {

        inventarioEditandoId =
            null;


        editarInventarioSection
            .hidden = true;


        editarInventarioForm
            .reset();


        mensajeInventario
            .textContent = '';

    }
);


// ===============================
// INICIO
// ===============================

async function iniciar() {

    // Siempre ocultamos inicialmente
    // el formulario de edición.

    editarInventarioSection.hidden =
        true;


    const autenticado =
        await cargarUsuario();


    if (!autenticado) {

        return;

    }


    await cargarInventario();

}


iniciar();