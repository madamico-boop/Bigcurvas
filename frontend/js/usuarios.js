const usuarioForm =
    document.getElementById('usuarioForm');

const tablaUsuarios =
    document.getElementById('tablaUsuarios');

const mensajeUsuario =
    document.getElementById('mensajeUsuario');

const editarUsuarioSection =
    document.getElementById('editarUsuarioSection');

const editarUsuarioForm =
    document.getElementById('editarUsuarioForm');

const cancelarEdicionUsuario =
    document.getElementById('cancelarEdicionUsuario');

const mensajeEdicionUsuario =
    document.getElementById('mensajeEdicionUsuario');

const passwordUsuarioSection =
    document.getElementById('passwordUsuarioSection');

const passwordUsuarioForm =
    document.getElementById('passwordUsuarioForm');

const passwordUsuarioTitulo =
    document.getElementById('passwordUsuarioTitulo');

const cancelarPasswordUsuario =
    document.getElementById('cancelarPasswordUsuario');

const mensajePasswordUsuario =
    document.getElementById('mensajePasswordUsuario');

const buscarUsuario =
    document.getElementById('buscarUsuario');

const filtroRolUsuario =
    document.getElementById('filtroRolUsuario');

const filtroEstadoUsuario =
    document.getElementById('filtroEstadoUsuario');

const limpiarFiltrosUsuarios =
    document.getElementById('limpiarFiltrosUsuarios');

const contadorUsuarios =
    document.getElementById('contadorUsuarios');


let usuariosCompletos = [];

let usuarioEditandoId = null;

let usuarioPasswordId = null;

let usuarioActual = null;


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


function correoValido(correo) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(correo);

}


function nombreRol(rol) {

    return rol === 'administrador'
        ? 'Administrador'
        : 'Vendedora';

}


// =====================================
// COMPROBAR ADMINISTRADOR
// =====================================

async function comprobarAdministrador() {

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

        if (
            !usuarioActual ||
            usuarioActual.rol !==
                'administrador'
        ) {

            window.location.href =
                'dashboard.html';

            return false;

        }

        return true;

    } catch (error) {

        console.error(
            'Error al comprobar permisos:',
            error
        );

        window.location.href =
            'index.html';

        return false;

    }

}


// =====================================
// FILTROS
// =====================================

function aplicarFiltros() {

    const texto =
        buscarUsuario.value
            .trim()
            .toLowerCase();

    const rol =
        filtroRolUsuario.value;

    const estado =
        filtroEstadoUsuario.value;

    const filtrados =
        usuariosCompletos.filter(
            usuario => {

                const coincideTexto =
                    !texto ||
                    (
                        usuario.nombre +
                        ' ' +
                        usuario.correo
                    )
                        .toLowerCase()
                        .includes(
                            texto
                        );

                const coincideRol =
                    !rol ||
                    usuario.rol ===
                        rol;

                const coincideEstado =
                    !estado ||
                    (
                        estado === 'activo' &&
                        usuario.activo
                    ) ||
                    (
                        estado === 'inactivo' &&
                        !usuario.activo
                    );

                return (
                    coincideTexto &&
                    coincideRol &&
                    coincideEstado
                );

            }
        );

    mostrarUsuarios(
        filtrados
    );

}


// =====================================
// MOSTRAR USUARIOS
// =====================================

function mostrarUsuarios(usuarios) {

    tablaUsuarios.innerHTML =
        '';

    contadorUsuarios.textContent =
        usuarios.length === 1
            ? '1 usuario'
            : usuarios.length +
                ' usuarios';

    if (
        usuarios.length === 0
    ) {

        tablaUsuarios.innerHTML =
            '<tr>' +
                '<td colspan="5" class="sin-resultados">' +
                    'No hay usuarios que coincidan con los filtros seleccionados.' +
                '</td>' +
            '</tr>';

        return;

    }

    usuarios.forEach(
        usuario => {

            const fila =
                document.createElement(
                    'tr'
                );

            const esCuentaActual =
                usuarioActual &&
                usuario.id_usuario ===
                    usuarioActual.id_usuario;

            fila.innerHTML =
                '<td>' +
                    '<strong>' +
                        escaparHtml(
                            usuario.nombre
                        ) +
                    '</strong>' +
                    (
                        esCuentaActual
                            ? '<span class="usuario-actual-etiqueta">Tú</span>'
                            : ''
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        usuario.correo
                    ) +
                '</td>' +
                '<td>' +
                    '<span class="rol-usuario rol-' +
                        escaparHtml(
                            usuario.rol
                        ) +
                    '">' +
                        escaparHtml(
                            nombreRol(
                                usuario.rol
                            )
                        ) +
                    '</span>' +
                '</td>' +
                '<td>' +
                    '<span class="estado-cliente ' +
                        (
                            usuario.activo
                                ? 'estado-cliente-activo'
                                : 'estado-cliente-inactivo'
                        ) +
                    '">' +
                        (
                            usuario.activo
                                ? 'Activo'
                                : 'Inactivo'
                        ) +
                    '</span>' +
                '</td>' +
                '<td>' +
                    '<div class="acciones-usuario">' +
                        '<button type="button" class="boton-editar">' +
                            'Editar' +
                        '</button>' +
                        '<button type="button" class="boton-password-usuario">' +
                            'Contraseña' +
                        '</button>' +
                        '<button type="button" class="boton-estado"' +
                            (
                                esCuentaActual &&
                                usuario.activo
                                    ? ' disabled'
                                    : ''
                            ) +
                        '>' +
                            (
                                usuario.activo
                                    ? 'Desactivar'
                                    : 'Reactivar'
                            ) +
                        '</button>' +
                    '</div>' +
                '</td>';

            tablaUsuarios
                .appendChild(
                    fila
                );

            fila.querySelector(
                '.boton-editar'
            ).addEventListener(
                'click',
                () =>
                    abrirEdicion(
                        usuario
                    )
            );

            fila.querySelector(
                '.boton-password-usuario'
            ).addEventListener(
                'click',
                () =>
                    abrirCambioPassword(
                        usuario
                    )
            );

            const botonEstado =
                fila.querySelector(
                    '.boton-estado'
                );

            if (
                !botonEstado.disabled
            ) {

                botonEstado
                    .addEventListener(
                        'click',
                        () =>
                            cambiarEstadoUsuario(
                                usuario
                            )
                    );

            }

        }
    );

}


// =====================================
// CARGAR USUARIOS
// =====================================

async function cargarUsuarios() {

    try {

        const respuesta =
            await fetch(
                '/api/usuarios',
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

        if (
            respuesta.status === 403
        ) {

            window.location.href =
                'dashboard.html';

            return;

        }

        const usuarios =
            await respuesta.json();

        if (!respuesta.ok) {

            mostrarMensaje(
                mensajeUsuario,
                usuarios.mensaje ||
                    'No se pudieron cargar los usuarios.',
                'error'
            );

            return;

        }

        usuariosCompletos =
            usuarios;

        aplicarFiltros();

    } catch (error) {

        console.error(
            'Error al cargar usuarios:',
            error
        );

        mostrarMensaje(
            mensajeUsuario,
            'Error al cargar usuarios.',
            'error'
        );

    }

}


// =====================================
// CREAR USUARIO
// =====================================

usuarioForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();

        const nombre =
            document
                .getElementById(
                    'nombreUsuario'
                )
                .value
                .trim();

        const correo =
            document
                .getElementById(
                    'correoUsuario'
                )
                .value
                .trim();

        const rol =
            document
                .getElementById(
                    'rolUsuario'
                )
                .value;

        const password =
            document
                .getElementById(
                    'passwordUsuario'
                )
                .value;

        if (
            nombre.length < 2
        ) {

            mostrarMensaje(
                mensajeUsuario,
                'Ingresa un nombre válido.',
                'error'
            );

            return;

        }

        if (
            !correoValido(
                correo
            )
        ) {

            mostrarMensaje(
                mensajeUsuario,
                'Ingresa un correo válido.',
                'error'
            );

            return;

        }

        if (
            password.length < 8
        ) {

            mostrarMensaje(
                mensajeUsuario,
                'La contraseña debe tener al menos 8 caracteres.',
                'error'
            );

            return;

        }

        try {

            const respuesta =
                await fetch(
                    '/api/usuarios',
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
                            JSON.stringify({
                                nombre,
                                correo,
                                rol,
                                password
                            })
                    }
                );

            const resultado =
                await respuesta.json();

            mostrarMensaje(
                mensajeUsuario,
                resultado.mensaje,
                respuesta.ok
                    ? 'exito'
                    : 'error'
            );

            if (respuesta.ok) {

                usuarioForm.reset();

                document
                    .getElementById(
                        'rolUsuario'
                    )
                    .value =
                        'vendedora';

                await cargarUsuarios();

            }

        } catch (error) {

            console.error(
                'Error al crear usuario:',
                error
            );

            mostrarMensaje(
                mensajeUsuario,
                'Error al crear usuario.',
                'error'
            );

        }

    }
);


// =====================================
// EDITAR USUARIO
// =====================================

function abrirEdicion(usuario) {

    usuarioEditandoId =
        usuario.id_usuario;

    document
        .getElementById(
            'editarNombreUsuario'
        )
        .value =
            usuario.nombre;

    document
        .getElementById(
            'editarCorreoUsuario'
        )
        .value =
            usuario.correo;

    document
        .getElementById(
            'editarRolUsuario'
        )
        .value =
            usuario.rol;

    editarUsuarioSection.hidden =
        false;

    passwordUsuarioSection.hidden =
        true;

    usuarioPasswordId =
        null;

    mostrarMensaje(
        mensajeEdicionUsuario,
        ''
    );

    editarUsuarioSection
        .scrollIntoView({
            behavior:
                'smooth',
            block:
                'start'
        });

}


editarUsuarioForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();

        if (!usuarioEditandoId) {

            return;

        }

        const nombre =
            document
                .getElementById(
                    'editarNombreUsuario'
                )
                .value
                .trim();

        const correo =
            document
                .getElementById(
                    'editarCorreoUsuario'
                )
                .value
                .trim();

        const rol =
            document
                .getElementById(
                    'editarRolUsuario'
                )
                .value;

        if (
            nombre.length < 2
        ) {

            mostrarMensaje(
                mensajeEdicionUsuario,
                'Ingresa un nombre válido.',
                'error'
            );

            return;

        }

        if (
            !correoValido(
                correo
            )
        ) {

            mostrarMensaje(
                mensajeEdicionUsuario,
                'Ingresa un correo válido.',
                'error'
            );

            return;

        }

        try {

            const respuesta =
                await fetch(
                    '/api/usuarios/' +
                        usuarioEditandoId,
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
                            JSON.stringify({
                                nombre,
                                correo,
                                rol
                            })
                    }
                );

            const resultado =
                await respuesta.json();

            mostrarMensaje(
                mensajeEdicionUsuario,
                resultado.mensaje,
                respuesta.ok
                    ? 'exito'
                    : 'error'
            );

            if (respuesta.ok) {

                usuarioEditandoId =
                    null;

                editarUsuarioForm
                    .reset();

                editarUsuarioSection.hidden =
                    true;

                await comprobarAdministrador();

                await cargarUsuarios();

            }

        } catch (error) {

            console.error(
                'Error al editar usuario:',
                error
            );

            mostrarMensaje(
                mensajeEdicionUsuario,
                'Error al editar usuario.',
                'error'
            );

        }

    }
);


cancelarEdicionUsuario
    .addEventListener(
        'click',
        () => {

            usuarioEditandoId =
                null;

            editarUsuarioForm.reset();

            editarUsuarioSection.hidden =
                true;

            mostrarMensaje(
                mensajeEdicionUsuario,
                ''
            );

        }
    );


// =====================================
// CAMBIAR CONTRASEÑA
// =====================================

function abrirCambioPassword(
    usuario
) {

    usuarioPasswordId =
        usuario.id_usuario;

    passwordUsuarioTitulo
        .textContent =
            'Nueva contraseña para ' +
            usuario.nombre +
            '.';

    passwordUsuarioForm.reset();

    mostrarMensaje(
        mensajePasswordUsuario,
        ''
    );

    passwordUsuarioSection.hidden =
        false;

    editarUsuarioSection.hidden =
        true;

    usuarioEditandoId =
        null;

    passwordUsuarioSection
        .scrollIntoView({
            behavior:
                'smooth',
            block:
                'start'
        });

}


passwordUsuarioForm
    .addEventListener(
        'submit',
        async event => {

            event.preventDefault();

            if (!usuarioPasswordId) {

                return;

            }

            const password =
                document
                    .getElementById(
                        'nuevaPasswordUsuario'
                    )
                    .value;

            const confirmar =
                document
                    .getElementById(
                        'confirmarPasswordUsuario'
                    )
                    .value;

            if (
                password.length < 8
            ) {

                mostrarMensaje(
                    mensajePasswordUsuario,
                    'La contraseña debe tener al menos 8 caracteres.',
                    'error'
                );

                return;

            }

            if (
                password !== confirmar
            ) {

                mostrarMensaje(
                    mensajePasswordUsuario,
                    'Las contraseñas no coinciden.',
                    'error'
                );

                return;

            }

            try {

                const respuesta =
                    await fetch(
                        '/api/usuarios/' +
                            usuarioPasswordId +
                            '/password',
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
                                    password
                                })
                        }
                    );

                const resultado =
                    await respuesta.json();

                mostrarMensaje(
                    mensajePasswordUsuario,
                    resultado.mensaje,
                    respuesta.ok
                        ? 'exito'
                        : 'error'
                );

                if (respuesta.ok) {

                    passwordUsuarioForm
                        .reset();

                }

            } catch (error) {

                console.error(
                    'Error al cambiar contraseña:',
                    error
                );

                mostrarMensaje(
                    mensajePasswordUsuario,
                    'Error al cambiar la contraseña.',
                    'error'
                );

            }

        }
    );


cancelarPasswordUsuario
    .addEventListener(
        'click',
        () => {

            usuarioPasswordId =
                null;

            passwordUsuarioForm.reset();

            passwordUsuarioSection.hidden =
                true;

            mostrarMensaje(
                mensajePasswordUsuario,
                ''
            );

        }
    );


// =====================================
// ACTIVAR / DESACTIVAR
// =====================================

async function cambiarEstadoUsuario(
    usuario
) {

    const nuevoEstado =
        !usuario.activo;

    const confirmar =
        confirm(
            nuevoEstado
                ? (
                    '¿Reactivar a ' +
                    usuario.nombre +
                    '?'
                )
                : (
                    '¿Desactivar a ' +
                    usuario.nombre +
                    '?'
                )
        );

    if (!confirmar) {

        return;

    }

    try {

        const respuesta =
            await fetch(
                '/api/usuarios/' +
                    usuario.id_usuario +
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
            mensajeUsuario,
            resultado.mensaje,
            respuesta.ok
                ? 'exito'
                : 'error'
        );

        if (respuesta.ok) {

            await cargarUsuarios();

        }

    } catch (error) {

        console.error(
            'Error al cambiar estado:',
            error
        );

        mostrarMensaje(
            mensajeUsuario,
            'Error al cambiar el estado del usuario.',
            'error'
        );

    }

}


// =====================================
// FILTROS
// =====================================

buscarUsuario.addEventListener(
    'input',
    aplicarFiltros
);

filtroRolUsuario.addEventListener(
    'change',
    aplicarFiltros
);

filtroEstadoUsuario.addEventListener(
    'change',
    aplicarFiltros
);

limpiarFiltrosUsuarios
    .addEventListener(
        'click',
        () => {

            buscarUsuario.value =
                '';

            filtroRolUsuario.value =
                '';

            filtroEstadoUsuario.value =
                '';

            aplicarFiltros();

        }
    );


// =====================================
// INICIAR
// =====================================

async function iniciar() {

    editarUsuarioSection.hidden =
        true;

    passwordUsuarioSection.hidden =
        true;

    const autorizado =
        await comprobarAdministrador();

    if (!autorizado) {

        return;

    }

    await cargarUsuarios();

}


iniciar();
