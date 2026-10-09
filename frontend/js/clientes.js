const clienteForm =
    document.getElementById('clienteForm');

const tablaClientes =
    document.getElementById('tablaClientes');

const mensajeCliente =
    document.getElementById('mensajeCliente');

const editarClienteSection =
    document.getElementById('editarClienteSection');

const editarClienteForm =
    document.getElementById('editarClienteForm');

const cancelarCliente =
    document.getElementById('cancelarCliente');

const mensajeEdicionCliente =
    document.getElementById('mensajeEdicionCliente');

let clienteEditandoId = null;


// ==============================
// CARGAR CLIENTES
// ==============================

async function cargarClientes() {

    try {

        const respuesta =
            await fetch('/api/clientes');

        const clientes =
            await respuesta.json();

        tablaClientes.innerHTML = '';


        clientes.forEach(cliente => {

            const fila =
                document.createElement('tr');

            fila.innerHTML = `
                <td>${cliente.nombre}</td>

                <td>
                    ${cliente.rut || '-'}
                </td>

                <td>
                    ${cliente.telefono || '-'}
                </td>

                <td>
                    ${cliente.correo || '-'}
                </td>

                <td>
                    ${cliente.comuna || '-'}
                </td>

                <td>
                    ${cliente.activo
                        ? 'Activo'
                        : 'Inactivo'}
                </td>

                <td>

                    <button class="boton-editar">
                        Editar
                    </button>

                    <button class="boton-estado">
                        ${cliente.activo
                            ? 'Desactivar'
                            : 'Reactivar'}
                    </button>

                </td>
            `;


            tablaClientes.appendChild(fila);


            // EDITAR

            const botonEditar =
                fila.querySelector('.boton-editar');

            botonEditar.addEventListener(
                'click',
                () => {

                    clienteEditandoId =
                        cliente.id_cliente;


                    document
                        .getElementById('editarNombreCliente')
                        .value =
                            cliente.nombre || '';


                    document
                        .getElementById('editarRutCliente')
                        .value =
                            cliente.rut || '';


                    document
                        .getElementById('editarTelefonoCliente')
                        .value =
                            cliente.telefono || '';


                    document
                        .getElementById('editarCorreoCliente')
                        .value =
                            cliente.correo || '';


                    document
                        .getElementById('editarDireccionCliente')
                        .value =
                            cliente.direccion || '';


                    document
                        .getElementById('editarComunaCliente')
                        .value =
                            cliente.comuna || '';


                    editarClienteSection.hidden =
                        false;


                    mensajeEdicionCliente.textContent =
                        '';


                    editarClienteSection.scrollIntoView({
                        behavior: 'smooth'
                    });

                }
            );


            // ACTIVAR / DESACTIVAR

            const botonEstado =
                fila.querySelector('.boton-estado');


            botonEstado.addEventListener(
                'click',
                async () => {

                    const nuevoEstado =
                        !cliente.activo;


                    const confirmar = confirm(
                        nuevoEstado
                            ? `¿Reactivar a ${cliente.nombre}?`
                            : `¿Desactivar a ${cliente.nombre}?`
                    );


                    if (!confirmar) {
                        return;
                    }


                    const respuesta = await fetch(
                        `/api/clientes/${cliente.id_cliente}/estado`,
                        {

                            method: 'PATCH',

                            headers: {
                                'Content-Type':
                                    'application/json'
                            },

                            body:
                                JSON.stringify({
                                    activo: nuevoEstado
                                })

                        }
                    );


                    const resultado =
                        await respuesta.json();


                    mensajeCliente.textContent =
                        resultado.mensaje;


                    if (respuesta.ok) {

                        await cargarClientes();

                    }

                }
            );

        });

    } catch (error) {

        console.error(
            'Error al cargar clientes:',
            error
        );

    }

}


// ==============================
// AGREGAR CLIENTE
// ==============================

clienteForm.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();


        const cliente = {

            nombre:
                document
                    .getElementById('nombreCliente')
                    .value
                    .trim(),

            rut:
                document
                    .getElementById('rutCliente')
                    .value
                    .trim(),

            telefono:
                document
                    .getElementById('telefonoCliente')
                    .value
                    .trim(),

            correo:
                document
                    .getElementById('correoCliente')
                    .value
                    .trim(),

            direccion:
                document
                    .getElementById('direccionCliente')
                    .value
                    .trim(),

            comuna:
                document
                    .getElementById('comunaCliente')
                    .value
                    .trim()

        };


        const respuesta =
            await fetch('/api/clientes', {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(cliente)

            });


        const resultado =
            await respuesta.json();


        mensajeCliente.textContent =
            resultado.mensaje;


        if (respuesta.ok) {

            clienteForm.reset();

            await cargarClientes();

        }

    }
);


// ==============================
// EDITAR CLIENTE
// ==============================

editarClienteForm.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();


        if (!clienteEditandoId) {
            return;
        }


        const cliente = {

            nombre:
                document
                    .getElementById('editarNombreCliente')
                    .value
                    .trim(),

            rut:
                document
                    .getElementById('editarRutCliente')
                    .value
                    .trim(),

            telefono:
                document
                    .getElementById('editarTelefonoCliente')
                    .value
                    .trim(),

            correo:
                document
                    .getElementById('editarCorreoCliente')
                    .value
                    .trim(),

            direccion:
                document
                    .getElementById('editarDireccionCliente')
                    .value
                    .trim(),

            comuna:
                document
                    .getElementById('editarComunaCliente')
                    .value
                    .trim()

        };


        const respuesta = await fetch(
            `/api/clientes/${clienteEditandoId}`,
            {

                method: 'PUT',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(cliente)

            }
        );


        const resultado =
            await respuesta.json();


        mensajeEdicionCliente.textContent =
            resultado.mensaje;


        if (respuesta.ok) {

            await cargarClientes();

            clienteEditandoId = null;

            editarClienteSection.hidden =
                true;

        }

    }
);


// ==============================
// CANCELAR EDICIÓN
// ==============================

cancelarCliente.addEventListener(
    'click',
    () => {

        clienteEditandoId = null;

        editarClienteSection.hidden =
            true;

        editarClienteForm.reset();

        mensajeEdicionCliente.textContent = '';

    }
);


cargarClientes();