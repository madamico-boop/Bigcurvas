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

const buscarCliente =
    document.getElementById('buscarCliente');

const filtroEstadoCliente =
    document.getElementById('filtroEstadoCliente');

const limpiarFiltrosClientes =
    document.getElementById('limpiarFiltrosClientes');

const contadorClientes =
    document.getElementById('contadorClientes');


let clienteEditandoId = null;

let usuarioActual = null;

let clientesCompletos = [];


// =====================================
// UTILIDADES
// =====================================

function escaparHtml(valor) {

    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

}


function obtenerValor(id) {

    return document
        .getElementById(id)
        .value
        .trim();

}


function mostrarMensaje(
    elemento,
    texto,
    tipo = ''
) {

    elemento.textContent =
        texto;

    elemento.classList.remove(
        'mensaje-exito',
        'mensaje-error'
    );

    if (tipo) {

        elemento.classList.add(
            tipo === 'exito'
                ? 'mensaje-exito'
                : 'mensaje-error'
        );

    }

}


function limpiarRut(rut) {

    return String(rut || '')
        .replace(/[^0-9kK]/g, '')
        .toUpperCase()
        .slice(0, 9);

}


function formatearRut(rut) {

    const limpio =
        limpiarRut(rut);

    if (
        limpio.length < 2
    ) {

        return limpio;

    }

    const cuerpo =
        limpio.slice(0, -1);

    const digito =
        limpio.slice(-1);

    const cuerpoFormateado =
        cuerpo.replace(
            /\B(?=(\d{3})+(?!\d))/g,
            '.'
        );

    return (
        cuerpoFormateado +
        '-' +
        digito
    );

}


function prepararCampoRut(
    elemento
) {

    elemento.addEventListener(
        'input',
        () => {

            const limpio =
                limpiarRut(
                    elemento.value
                );

            elemento.value =
                limpio;

        }
    );

    elemento.addEventListener(
        'blur',
        () => {

            elemento.value =
                formatearRut(
                    elemento.value
                );

        }
    );

    elemento.addEventListener(
        'focus',
        () => {

            elemento.value =
                limpiarRut(
                    elemento.value
                );

        }
    );

}


function rutValido(rut) {

    if (!rut) {

        return true;

    }

    const limpio =
        limpiarRut(rut);

    if (
        !/^\d{7,8}[0-9K]$/.test(
            limpio
        )
    ) {

        return false;

    }

    const cuerpo =
        limpio.slice(0, -1);

    const digito =
        limpio.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (
        let i = cuerpo.length - 1;
        i >= 0;
        i -= 1
    ) {

        suma +=
            Number(cuerpo[i]) *
            multiplicador;

        multiplicador =
            multiplicador === 7
                ? 2
                : multiplicador + 1;

    }

    const resultado =
        11 - (suma % 11);

    const esperado =
        resultado === 11
            ? '0'
            : resultado === 10
                ? 'K'
                : String(resultado);

    return digito === esperado;

}


function correoValido(correo) {

    if (!correo) {

        return true;

    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(correo);

}


function validarCliente(cliente) {

    if (
        !cliente.nombre ||
        cliente.nombre.length < 2
    ) {

        return 'Ingresa un nombre válido.';

    }

    if (
        cliente.rut &&
        !rutValido(cliente.rut)
    ) {

        return 'El RUT ingresado no es válido.';

    }

    if (
        cliente.correo &&
        !correoValido(
            cliente.correo
        )
    ) {

        return 'El correo ingresado no es válido.';

    }

    return '';

}


function leerClienteFormulario(
    editar = false
) {

    const prefijo =
        editar
            ? 'editar'
            : '';

    const id = nombre =>
        prefijo
            ? (
                'editar' +
                nombre.charAt(0).toUpperCase() +
                nombre.slice(1)
            )
            : nombre;

    return {
        nombre:
            obtenerValor(
                id('nombreCliente')
            ),
        rut:
            formatearRut(
                obtenerValor(
                    id('rutCliente')
                )
            ),
        telefono:
            obtenerValor(
                id('telefonoCliente')
            ),
        correo:
            obtenerValor(
                id('correoCliente')
            ),
        direccion:
            obtenerValor(
                id('direccionCliente')
            ),
        comuna:
            obtenerValor(
                id('comunaCliente')
            )
    };

}


// =====================================
// CARGAR USUARIO ACTUAL
// =====================================

async function cargarUsuario() {

    try {

        const respuesta =
            await fetch(
                '/api/auth/me',
                {
                    credentials:
                        'include'
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


// =====================================
// SABER SI ES ADMINISTRADOR
// =====================================

function esAdministrador() {

    return (
        usuarioActual &&
        usuarioActual.rol ===
            'administrador'
    );

}


// =====================================
// FILTROS
// =====================================

function aplicarFiltros() {

    const texto =
        buscarCliente.value
            .trim()
            .toLowerCase();

    const estado =
        filtroEstadoCliente.value;

    const filtrados =
        clientesCompletos.filter(
            cliente => {

                const valoresBusqueda = [
                    cliente.nombre,
                    cliente.rut,
                    cliente.telefono,
                    cliente.correo,
                    cliente.comuna
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();

                const coincideTexto =
                    !texto ||
                    valoresBusqueda.includes(
                        texto
                    );

                const coincideEstado =
                    !estado ||
                    (
                        estado === 'activo' &&
                        cliente.activo
                    ) ||
                    (
                        estado === 'inactivo' &&
                        !cliente.activo
                    );

                return (
                    coincideTexto &&
                    coincideEstado
                );

            }
        );

    mostrarClientes(
        filtrados
    );

}


// =====================================
// MOSTRAR CLIENTES
// =====================================

function mostrarClientes(clientes) {

    tablaClientes.innerHTML =
        '';

    contadorClientes.textContent =
        clientes.length === 1
            ? '1 cliente'
            : clientes.length +
                ' clientes';

    if (
        clientes.length === 0
    ) {

        tablaClientes.innerHTML =
            '<tr>' +
                '<td colspan="7" class="sin-resultados">' +
                    'No hay clientes que coincidan con los filtros seleccionados.' +
                '</td>' +
            '</tr>';

        return;

    }

    const admin =
        esAdministrador();

    clientes.forEach(
        cliente => {

            const fila =
                document.createElement(
                    'tr'
                );

            fila.innerHTML =
                '<td>' +
                    '<strong>' +
                        escaparHtml(
                            cliente.nombre
                        ) +
                    '</strong>' +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        cliente.rut ||
                        '-'
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        cliente.telefono ||
                        '-'
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        cliente.correo ||
                        '-'
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        cliente.comuna ||
                        '-'
                    ) +
                '</td>' +
                '<td>' +
                    '<span class="estado-cliente ' +
                        (
                            cliente.activo
                                ? 'estado-cliente-activo'
                                : 'estado-cliente-inactivo'
                        ) +
                    '">' +
                        (
                            cliente.activo
                                ? 'Activo'
                                : 'Inactivo'
                        ) +
                    '</span>' +
                '</td>' +
                '<td>' +
                    '<div class="acciones-cliente">' +
                        '<button type="button" class="boton-editar">' +
                            'Editar' +
                        '</button>' +
                        (
                            admin
                                ? (
                                    '<button type="button" class="boton-estado">' +
                                        (
                                            cliente.activo
                                                ? 'Desactivar'
                                                : 'Reactivar'
                                        ) +
                                    '</button>'
                                )
                                : ''
                        ) +
                    '</div>' +
                '</td>';

            tablaClientes
                .appendChild(
                    fila
                );

            const botonEditar =
                fila.querySelector(
                    '.boton-editar'
                );

            botonEditar.addEventListener(
                'click',
                () => {

                    abrirEdicion(
                        cliente
                    );

                }
            );

            if (admin) {

                const botonEstado =
                    fila.querySelector(
                        '.boton-estado'
                    );

                botonEstado
                    .addEventListener(
                        'click',
                        () =>
                            cambiarEstadoCliente(
                                cliente
                            )
                    );

            }

        }
    );

}


// =====================================
// CARGAR CLIENTES
// =====================================

async function cargarClientes() {

    try {

        const respuesta =
            await fetch(
                '/api/clientes',
                {
                    credentials:
                        'include'
                }
            );

        if (
            respuesta.status === 401
        ) {

            window.location.href =
                'index.html';

            return;

        }

        const clientes =
            await respuesta.json();

        if (!respuesta.ok) {

            console.error(
                clientes.mensaje
            );

            return;

        }

        clientesCompletos =
            clientes;

        aplicarFiltros();

    } catch (error) {

        console.error(
            'Error al cargar clientes:',
            error
        );

    }

}


// =====================================
// ABRIR EDICIÓN
// =====================================

function abrirEdicion(cliente) {

    clienteEditandoId =
        cliente.id_cliente;

    document
        .getElementById(
            'editarNombreCliente'
        )
        .value =
            cliente.nombre ||
            '';

    document
        .getElementById(
            'editarRutCliente'
        )
        .value =
            formatearRut(
                cliente.rut ||
                ''
            );

    document
        .getElementById(
            'editarTelefonoCliente'
        )
        .value =
            cliente.telefono ||
            '';

    document
        .getElementById(
            'editarCorreoCliente'
        )
        .value =
            cliente.correo ||
            '';

    document
        .getElementById(
            'editarDireccionCliente'
        )
        .value =
            cliente.direccion ||
            '';

    document
        .getElementById(
            'editarComunaCliente'
        )
        .value =
            cliente.comuna ||
            '';

    editarClienteSection.hidden =
        false;

    mostrarMensaje(
        mensajeEdicionCliente,
        ''
    );

    editarClienteSection
        .scrollIntoView({
            behavior:
                'smooth',
            block:
                'start'
        });

}


// =====================================
// ACTIVAR / DESACTIVAR
// SOLO ADMIN
// =====================================

async function cambiarEstadoCliente(
    cliente
) {

    const nuevoEstado =
        !cliente.activo;

    const confirmar =
        confirm(
            nuevoEstado
                ? (
                    '¿Reactivar a ' +
                    cliente.nombre +
                    '?'
                )
                : (
                    '¿Desactivar a ' +
                    cliente.nombre +
                    '?'
                )
        );

    if (!confirmar) {

        return;

    }

    try {

        const respuesta =
            await fetch(
                '/api/clientes/' +
                    cliente.id_cliente +
                    '/estado',
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
                        JSON.stringify({
                            activo:
                                nuevoEstado
                        })
                }
            );

        const resultado =
            await respuesta.json();

        mostrarMensaje(
            mensajeCliente,
            resultado.mensaje,
            respuesta.ok
                ? 'exito'
                : 'error'
        );

        if (respuesta.ok) {

            await cargarClientes();

        }

    } catch (error) {

        console.error(
            'Error al cambiar estado del cliente:',
            error
        );

        mostrarMensaje(
            mensajeCliente,
            'Error al cambiar el estado del cliente.',
            'error'
        );

    }

}


// =====================================
// AGREGAR CLIENTE
// ADMIN Y VENDEDORA
// =====================================

clienteForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();

        const cliente =
            leerClienteFormulario();

        const errorValidacion =
            validarCliente(
                cliente
            );

        if (errorValidacion) {

            mostrarMensaje(
                mensajeCliente,
                errorValidacion,
                'error'
            );

            return;

        }

        try {

            const respuesta =
                await fetch(
                    '/api/clientes',
                    {
                        method:
                            'POST',
                        credentials:
                            'include',
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body:
                            JSON.stringify(
                                cliente
                            )
                    }
                );

            const resultado =
                await respuesta.json();

            mostrarMensaje(
                mensajeCliente,
                resultado.mensaje,
                respuesta.ok
                    ? 'exito'
                    : 'error'
            );

            if (respuesta.ok) {

                clienteForm.reset();

                await cargarClientes();

            }

        } catch (error) {

            console.error(
                'Error al agregar cliente:',
                error
            );

            mostrarMensaje(
                mensajeCliente,
                'Error al agregar cliente.',
                'error'
            );

        }

    }
);


// =====================================
// EDITAR CLIENTE
// ADMIN Y VENDEDORA
// =====================================

editarClienteForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();

        if (!clienteEditandoId) {

            return;

        }

        const cliente =
            leerClienteFormulario(
                true
            );

        const errorValidacion =
            validarCliente(
                cliente
            );

        if (errorValidacion) {

            mostrarMensaje(
                mensajeEdicionCliente,
                errorValidacion,
                'error'
            );

            return;

        }

        try {

            const respuesta =
                await fetch(
                    '/api/clientes/' +
                        clienteEditandoId,
                    {
                        method:
                            'PUT',
                        credentials:
                            'include',
                        headers: {
                            'Content-Type':
                                'application/json'
                        },
                        body:
                            JSON.stringify(
                                cliente
                            )
                    }
                );

            const resultado =
                await respuesta.json();

            mostrarMensaje(
                mensajeEdicionCliente,
                resultado.mensaje,
                respuesta.ok
                    ? 'exito'
                    : 'error'
            );

            if (respuesta.ok) {

                await cargarClientes();

                clienteEditandoId =
                    null;

                editarClienteSection
                    .hidden =
                        true;

                editarClienteForm
                    .reset();

            }

        } catch (error) {

            console.error(
                'Error al editar cliente:',
                error
            );

            mostrarMensaje(
                mensajeEdicionCliente,
                'Error al editar cliente.',
                'error'
            );

        }

    }
);


// =====================================
// CANCELAR EDICIÓN
// =====================================

cancelarCliente.addEventListener(
    'click',
    () => {

        clienteEditandoId =
            null;

        editarClienteSection
            .hidden =
                true;

        editarClienteForm
            .reset();

        mostrarMensaje(
            mensajeEdicionCliente,
            ''
        );

    }
);


// =====================================
// FILTROS
// =====================================

buscarCliente.addEventListener(
    'input',
    aplicarFiltros
);

filtroEstadoCliente
    .addEventListener(
        'change',
        aplicarFiltros
    );

limpiarFiltrosClientes
    .addEventListener(
        'click',
        () => {

            buscarCliente.value =
                '';

            filtroEstadoCliente.value =
                '';

            aplicarFiltros();

        }
    );


// =====================================
// FORMATO AUTOMÁTICO DE RUT
// =====================================

prepararCampoRut(
    document.getElementById(
        'rutCliente'
    )
);

prepararCampoRut(
    document.getElementById(
        'editarRutCliente'
    )
);


// =====================================
// INICIAR
// =====================================

async function iniciar() {

    editarClienteSection.hidden =
        true;

    const autenticado =
        await cargarUsuario();

    if (!autenticado) {

        return;

    }

    await cargarClientes();

}


iniciar();
