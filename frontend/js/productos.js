const productoForm =
    document.getElementById('productoForm');

const tablaProductos =
    document.getElementById('tablaProductos');

const categoriaSelect =
    document.getElementById('categoriaProducto');

const mensajeProducto =
    document.getElementById('mensajeProducto');

const varianteForm =
    document.getElementById('varianteForm');

const productoVariante =
    document.getElementById('productoVariante');

const mensajeVariante =
    document.getElementById('mensajeVariante');

const editarProductoSection =
    document.getElementById('editarProductoSection');

const editarProductoForm =
    document.getElementById('editarProductoForm');

const editarCategoria =
    document.getElementById('editarCategoria');

const cancelarEdicion =
    document.getElementById('cancelarEdicion');

const mensajeEdicion =
    document.getElementById('mensajeEdicion');

const agregarProductoSection =
    document.getElementById(
        'agregarProductoSection'
    );

const agregarVarianteSection =
    document.getElementById(
        'agregarVarianteSection'
    );


let productoEditandoId = null;

let usuarioActual = null;


// =====================================
// CARGAR USUARIO ACTUAL
// =====================================

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
// APLICAR PERMISOS VISUALES
// =====================================

function aplicarPermisos() {

    if (esAdministrador()) {

        agregarProductoSection.hidden =
            false;

        agregarVarianteSection.hidden =
            false;

        return;

    }


    // ===============================
    // VENDEDORA
    // ===============================

    agregarProductoSection.hidden =
        true;

    agregarVarianteSection.hidden =
        true;

    editarProductoSection.hidden =
        true;

}


// =====================================
// CARGAR CATEGORÍAS
// =====================================

async function cargarCategorias() {

    try {

        const respuesta =
            await fetch(
                '/api/categorias',
                {
                    credentials: 'include'
                }
            );


        if (respuesta.status === 401) {

            window.location.href =
                'index.html';

            return;

        }


        const categorias =
            await respuesta.json();


        if (!respuesta.ok) {

            console.error(
                categorias.mensaje
            );

            return;

        }


        categoriaSelect.innerHTML =
            '<option value="">Seleccione una categoría</option>';


        editarCategoria.innerHTML =
            '<option value="">Seleccione una categoría</option>';


        categorias.forEach(
            categoria => {

                const opcion =
                    document.createElement(
                        'option'
                    );


                opcion.value =
                    categoria.id_categoria;


                opcion.textContent =
                    categoria.nombre;


                categoriaSelect
                    .appendChild(
                        opcion
                    );


                const opcionEditar =
                    document.createElement(
                        'option'
                    );


                opcionEditar.value =
                    categoria.id_categoria;


                opcionEditar.textContent =
                    categoria.nombre;


                editarCategoria
                    .appendChild(
                        opcionEditar
                    );

            }
        );


    } catch (error) {

        console.error(
            'Error al cargar categorías:',
            error
        );

    }

}


// =====================================
// CARGAR PRODUCTOS
// =====================================

async function cargarProductos() {

    try {

        const respuesta =
            await fetch(
                '/api/productos',
                {
                    credentials: 'include'
                }
            );


        if (respuesta.status === 401) {

            window.location.href =
                'index.html';

            return;

        }


        const productos =
            await respuesta.json();


        if (!respuesta.ok) {

            console.error(
                productos.mensaje
            );

            return;

        }


        tablaProductos.innerHTML =
            '';


        productoVariante.innerHTML =
            '<option value="">Seleccione un producto</option>';


        const admin =
            esAdministrador();


        productos.forEach(
            producto => {

                const fila =
                    document.createElement(
                        'tr'
                    );


                const precio =
                    Number(
                        producto.precio
                    ).toLocaleString(
                        'es-CL'
                    );


                // =====================================
                // TABLA
                // =====================================

                fila.innerHTML = `

                    <td>
                        ${producto.nombre}
                    </td>

                    <td>
                        ${producto.categoria}
                    </td>

                    <td>
                        $${precio}
                    </td>

                    <td>
                        ${
                            producto.activo
                                ? 'Activo'
                                : 'Inactivo'
                        }
                    </td>

                    <td>

                        ${
                            admin
                                ? `
                                    <button
                                        class="boton-editar"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        class="boton-estado"
                                    >
                                        ${
                                            producto.activo
                                                ? 'Desactivar'
                                                : 'Reactivar'
                                        }
                                    </button>
                                `
                                : '-'
                        }

                    </td>

                `;


                tablaProductos
                    .appendChild(
                        fila
                    );


                // =====================================
                // SOLO ADMINISTRADOR
                // =====================================

                if (admin) {

                    const botonEditar =
                        fila.querySelector(
                            '.boton-editar'
                        );


                    const botonEstado =
                        fila.querySelector(
                            '.boton-estado'
                        );


                    // ===============================
                    // EDITAR PRODUCTO
                    // ===============================

                    botonEditar.addEventListener(
                        'click',
                        () => {

                            productoEditandoId =
                                producto.id_producto;


                            document
                                .getElementById(
                                    'editarNombre'
                                )
                                .value =
                                    producto.nombre;


                            document
                                .getElementById(
                                    'editarDescripcion'
                                )
                                .value =
                                    producto.descripcion ||
                                    '';


                            editarCategoria.value =
                                producto.id_categoria;


                            document
                                .getElementById(
                                    'editarPrecio'
                                )
                                .value =
                                    producto.precio;


                            editarProductoSection
                                .hidden =
                                    false;


                            mensajeEdicion
                                .textContent =
                                    '';


                            editarProductoSection
                                .scrollIntoView({
                                    behavior:
                                        'smooth'
                                });

                        }
                    );


                    // ===============================
                    // ACTIVAR / DESACTIVAR
                    // ===============================

                    botonEstado.addEventListener(
                        'click',
                        async () => {

                            const nuevoEstado =
                                !producto.activo;


                            const confirmar =
                                confirm(

                                    nuevoEstado
                                        ? `¿Reactivar ${producto.nombre}?`
                                        : `¿Desactivar ${producto.nombre}?`

                                );


                            if (!confirmar) {

                                return;

                            }


                            try {

                                const respuestaEstado =
                                    await fetch(

                                        `/api/productos/${producto.id_producto}/estado`,

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
                                    await respuestaEstado
                                        .json();


                                mensajeProducto
                                    .textContent =
                                        resultado.mensaje;


                                if (
                                    respuestaEstado.ok
                                ) {

                                    await cargarProductos();

                                }


                            } catch (error) {

                                console.error(
                                    'Error al cambiar estado:',
                                    error
                                );

                            }

                        }
                    );

                }


                // =====================================
                // SELECT PARA CREAR VARIANTES
                // =====================================

                if (
                    admin &&
                    producto.activo
                ) {

                    const opcion =
                        document.createElement(
                            'option'
                        );


                    opcion.value =
                        producto.id_producto;


                    opcion.textContent =
                        producto.nombre;


                    productoVariante
                        .appendChild(
                            opcion
                        );

                }

            }
        );


    } catch (error) {

        console.error(
            'Error al cargar productos:',
            error
        );

    }

}


// =====================================
// AGREGAR PRODUCTO
// =====================================

productoForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        if (!esAdministrador()) {

            mensajeProducto
                .textContent =
                    'No tiene permisos para agregar productos';

            return;

        }


        const producto = {

            nombre:
                document
                    .getElementById(
                        'nombreProducto'
                    )
                    .value
                    .trim(),

            descripcion:
                document
                    .getElementById(
                        'descripcionProducto'
                    )
                    .value
                    .trim(),

            id_categoria:
                Number(
                    categoriaSelect.value
                ),

            precio:
                Number(
                    document
                        .getElementById(
                            'precioProducto'
                        )
                        .value
                )

        };


        try {

            const respuesta =
                await fetch(
                    '/api/productos',
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
                                producto
                            )

                    }
                );


            const resultado =
                await respuesta.json();


            mensajeProducto
                .textContent =
                    resultado.mensaje;


            if (respuesta.ok) {

                productoForm.reset();

                await cargarProductos();

            }


        } catch (error) {

            console.error(
                'Error al agregar producto:',
                error
            );

        }

    }
);


// =====================================
// AGREGAR VARIANTE
// =====================================

varianteForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        if (!esAdministrador()) {

            mensajeVariante
                .textContent =
                    'No tiene permisos para agregar variantes';

            return;

        }


        const variante = {

            id_producto:
                Number(
                    productoVariante.value
                ),

            color:
                document
                    .getElementById(
                        'colorVariante'
                    )
                    .value
                    .trim(),

            talla:
                document
                    .getElementById(
                        'tallaVariante'
                    )
                    .value
                    .trim(),

            sku:
                document
                    .getElementById(
                        'skuVariante'
                    )
                    .value
                    .trim(),

            stock_rancagua:
                Number(
                    document
                        .getElementById(
                            'stockRancagua'
                        )
                        .value
                ),

            minimo_rancagua:
                document
                    .getElementById(
                        'minimoRancagua'
                    )
                    .value,

            stock_bodega:
                Number(
                    document
                        .getElementById(
                            'stockBodega'
                        )
                        .value
                ),

            minimo_bodega:
                document
                    .getElementById(
                        'minimoBodega'
                    )
                    .value

        };


        try {

            const respuesta =
                await fetch(
                    '/api/variantes',
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
                                variante
                            )

                    }
                );


            const resultado =
                await respuesta.json();


            mensajeVariante
                .textContent =
                    resultado.mensaje;


            if (respuesta.ok) {

                varianteForm.reset();


                document
                    .getElementById(
                        'stockRancagua'
                    )
                    .value = 0;


                document
                    .getElementById(
                        'stockBodega'
                    )
                    .value = 0;


                await cargarProductos();

            }


        } catch (error) {

            console.error(
                'Error al agregar variante:',
                error
            );

        }

    }
);


// =====================================
// GUARDAR EDICIÓN DE PRODUCTO
// =====================================

editarProductoForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        if (!esAdministrador()) {

            mensajeEdicion
                .textContent =
                    'No tiene permisos para editar productos';

            return;

        }


        if (!productoEditandoId) {

            return;

        }


        const producto = {

            nombre:
                document
                    .getElementById(
                        'editarNombre'
                    )
                    .value
                    .trim(),

            descripcion:
                document
                    .getElementById(
                        'editarDescripcion'
                    )
                    .value
                    .trim(),

            id_categoria:
                Number(
                    editarCategoria.value
                ),

            precio:
                Number(
                    document
                        .getElementById(
                            'editarPrecio'
                        )
                        .value
                )

        };


        try {

            const respuesta =
                await fetch(
                    `/api/productos/${productoEditandoId}`,
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
                                producto
                            )

                    }
                );


            const resultado =
                await respuesta.json();


            mensajeEdicion
                .textContent =
                    resultado.mensaje;


            if (respuesta.ok) {

                await cargarProductos();


                productoEditandoId =
                    null;


                editarProductoSection
                    .hidden =
                        true;


                editarProductoForm
                    .reset();

            }


        } catch (error) {

            console.error(
                'Error al editar producto:',
                error
            );

        }

    }
);


// =====================================
// CANCELAR EDICIÓN
// =====================================

cancelarEdicion.addEventListener(
    'click',
    () => {

        productoEditandoId =
            null;


        editarProductoSection
            .hidden =
                true;


        editarProductoForm
            .reset();


        mensajeEdicion
            .textContent =
                '';

    }
);


// =====================================
// INICIAR PÁGINA
// =====================================

async function iniciar() {

    editarProductoSection.hidden =
        true;


    const autenticado =
        await cargarUsuario();


    if (!autenticado) {

        return;

    }


    aplicarPermisos();


    await cargarCategorias();

    await cargarProductos();

}


iniciar();