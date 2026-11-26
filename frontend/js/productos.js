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


const buscarProducto =
    document.getElementById('buscarProducto');

const filtroCategoriaProducto =
    document.getElementById('filtroCategoriaProducto');

const filtroEstadoProducto =
    document.getElementById('filtroEstadoProducto');

const limpiarFiltrosProductos =
    document.getElementById('limpiarFiltrosProductos');

const contadorProductos =
    document.getElementById('contadorProductos');

const variantesProductoSection =
    document.getElementById('variantesProductoSection');

const productoVariantesSeleccionado =
    document.getElementById('productoVariantesSeleccionado');

const tablaVariantesProducto =
    document.getElementById('tablaVariantesProducto');

const cerrarVariantesProducto =
    document.getElementById('cerrarVariantesProducto');

const editarVarianteSection =
    document.getElementById('editarVarianteSection');

const editarVarianteForm =
    document.getElementById('editarVarianteForm');

const editarVarianteProductoNombre =
    document.getElementById('editarVarianteProductoNombre');

const cancelarEdicionVariante =
    document.getElementById('cancelarEdicionVariante');

const mensajeEdicionVariante =
    document.getElementById('mensajeEdicionVariante');

let productoEditandoId = null;

let varianteEditandoId = null;

let productoVariantesActual = null;

let usuarioActual = null;

let productosCompletos = [];


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

    editarVarianteSection.hidden =
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

function escaparHtml(valor) {

    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

}


function cargarCategoriasFiltroProductos() {

    const valorActual =
        filtroCategoriaProducto.value;

    const categorias =
        [
            ...new Set(
                productosCompletos.map(
                    producto => producto.categoria
                )
            )
        ].sort();

    filtroCategoriaProducto.innerHTML =
        '<option value="">Todas las categorías</option>';

    categorias.forEach(categoria => {

        const opcion =
            document.createElement('option');

        opcion.value = categoria;
        opcion.textContent = categoria;

        filtroCategoriaProducto
            .appendChild(opcion);

    });

    if (categorias.includes(valorActual)) {

        filtroCategoriaProducto.value =
            valorActual;

    }

}


function aplicarFiltrosProductos() {

    const texto =
        buscarProducto.value
            .trim()
            .toLowerCase();

    const categoria =
        filtroCategoriaProducto.value;

    const estado =
        filtroEstadoProducto.value;

    const filtrados =
        productosCompletos.filter(
            producto => {

                const coincideTexto =
                    !texto ||
                    String(producto.nombre)
                        .toLowerCase()
                        .includes(texto);

                const coincideCategoria =
                    !categoria ||
                    producto.categoria ===
                        categoria;

                const coincideEstado =
                    !estado ||
                    (
                        estado === 'activo'
                            ? producto.activo
                            : !producto.activo
                    );

                return (
                    coincideTexto &&
                    coincideCategoria &&
                    coincideEstado
                );

            }
        );

    mostrarProductos(filtrados);

}


async function mostrarVariantesProducto(producto) {

    productoVariantesActual =
        producto;

    productoVariantesSeleccionado
        .textContent =
            producto.nombre;

    tablaVariantesProducto.innerHTML =
        '<tr><td colspan="6" class="sin-resultados">Cargando variantes...</td></tr>';

    variantesProductoSection.hidden =
        false;

    variantesProductoSection
        .scrollIntoView({
            behavior: 'smooth'
        });

    try {

        const respuesta =
            await fetch(
                '/api/productos/' +
                producto.id_producto +
                '/variantes',
                {
                    credentials: 'include'
                }
            );

        if (respuesta.status === 401) {

            window.location.href =
                'index.html';

            return;

        }

        const variantes =
            await respuesta.json();

        if (!respuesta.ok) {

            tablaVariantesProducto.innerHTML =
                '<tr><td colspan="6" class="sin-resultados">' +
                escaparHtml(
                    variantes.mensaje ||
                    'Error al cargar variantes'
                ) +
                '</td></tr>';

            return;

        }

        if (variantes.length === 0) {

            tablaVariantesProducto.innerHTML =
                '<tr><td colspan="6" class="sin-resultados">Este producto todavía no tiene variantes registradas.</td></tr>';

            return;

        }

        tablaVariantesProducto.innerHTML =
            '';

        variantes.forEach(variante => {

            const fila =
                document.createElement('tr');

            const accion =
                esAdministrador()
                    ? (
                        '<button type="button" class="boton-editar-variante">' +
                            'Editar' +
                        '</button>'
                    )
                    : '-';

            fila.innerHTML =
                '<td>' +
                    escaparHtml(variante.color) +
                '</td>' +
                '<td>' +
                    escaparHtml(variante.talla) +
                '</td>' +
                '<td>' +
                    escaparHtml(variante.sku || '-') +
                '</td>' +
                '<td>' +
                    escaparHtml(variante.stock_rancagua) +
                '</td>' +
                '<td>' +
                    escaparHtml(variante.stock_bodega) +
                '</td>' +
                '<td>' +
                    accion +
                '</td>';

            tablaVariantesProducto
                .appendChild(fila);

            if (
                esAdministrador()
            ) {

                fila.querySelector(
                    '.boton-editar-variante'
                ).addEventListener(
                    'click',
                    () =>
                        abrirEdicionVariante(
                            variante,
                            producto
                        )
                );

            }

        });

    } catch (error) {

        console.error(
            'Error al cargar variantes:',
            error
        );

        tablaVariantesProducto.innerHTML =
            '<tr><td colspan="6" class="sin-resultados">Error al cargar variantes.</td></tr>';

    }

}


function abrirEdicionVariante(
    variante,
    producto
) {

    if (!esAdministrador()) {

        return;

    }

    varianteEditandoId =
        variante.id_variante;

    editarVarianteProductoNombre
        .textContent =
            producto.nombre;

    document
        .getElementById(
            'editarColorVariante'
        )
        .value =
            variante.color ||
            '';

    document
        .getElementById(
            'editarTallaVariante'
        )
        .value =
            variante.talla ||
            '';

    document
        .getElementById(
            'editarSkuVariante'
        )
        .value =
            variante.sku ||
            '';

    document
        .getElementById(
            'editarStockRancagua'
        )
        .value =
            variante.stock_rancagua;

    document
        .getElementById(
            'editarMinimoRancagua'
        )
        .value =
            variante.minimo_rancagua ??
            '';

    document
        .getElementById(
            'editarStockBodega'
        )
        .value =
            variante.stock_bodega;

    document
        .getElementById(
            'editarMinimoBodega'
        )
        .value =
            variante.minimo_bodega ??
            '';

    mensajeEdicionVariante
        .textContent =
            '';

    editarVarianteSection.hidden =
        false;

    editarVarianteSection
        .scrollIntoView({
            behavior:
                'smooth',
            block:
                'start'
        });

}


function mostrarProductos(productos) {

    tablaProductos.innerHTML =
        '';

    contadorProductos.textContent =
        'Mostrando ' +
        productos.length +
        ' de ' +
        productosCompletos.length +
        ' productos';

    if (productos.length === 0) {

        tablaProductos.innerHTML =
            '<tr><td colspan="6" class="sin-resultados">No hay productos que coincidan con los filtros seleccionados.</td></tr>';

        return;

    }

    const admin =
        esAdministrador();

    productos.forEach(producto => {

        const fila =
            document.createElement('tr');

        const precio =
            Number(producto.precio)
                .toLocaleString('es-CL');

        const estadoTexto =
            producto.activo
                ? 'Activo'
                : 'Inactivo';

        const estadoClase =
            producto.activo
                ? 'estado-producto-activo'
                : 'estado-producto-inactivo';

        let acciones = '-';

        if (admin) {

            acciones =
                '<button type="button" class="boton-editar">Editar</button>' +
                '<button type="button" class="boton-estado">' +
                    (
                        producto.activo
                            ? 'Desactivar'
                            : 'Reactivar'
                    ) +
                '</button>';

        }

        fila.innerHTML =
            '<td>' +
                escaparHtml(producto.nombre) +
            '</td>' +
            '<td>' +
                escaparHtml(producto.categoria) +
            '</td>' +
            '<td>$' +
                precio +
            '</td>' +
            '<td><span class="estado-producto ' +
                estadoClase +
                '">' +
                estadoTexto +
            '</span></td>' +
            '<td><button type="button" class="boton-variantes">Ver variantes</button></td>' +
            '<td>' +
                acciones +
            '</td>';

        tablaProductos
            .appendChild(fila);

        const botonVariantes =
            fila.querySelector(
                '.boton-variantes'
            );

        botonVariantes.addEventListener(
            'click',
            () =>
                mostrarVariantesProducto(
                    producto
                )
        );

        if (!admin) {

            return;

        }

        const botonEditar =
            fila.querySelector(
                '.boton-editar'
            );

        const botonEstado =
            fila.querySelector(
                '.boton-estado'
            );

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

                editarProductoSection.hidden =
                    false;

                mensajeEdicion.textContent =
                    '';

                editarProductoSection
                    .scrollIntoView({
                        behavior: 'smooth'
                    });

            }
        );

        botonEstado.addEventListener(
            'click',
            async () => {

                const nuevoEstado =
                    !producto.activo;

                const confirmar =
                    confirm(
                        nuevoEstado
                            ? '¿Reactivar ' +
                                producto.nombre +
                                '?'
                            : '¿Desactivar ' +
                                producto.nombre +
                                '?'
                    );

                if (!confirmar) {

                    return;

                }

                try {

                    const respuestaEstado =
                        await fetch(
                            '/api/productos/' +
                            producto.id_producto +
                            '/estado',
                            {
                                method: 'PATCH',
                                credentials: 'include',
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

                    if (respuestaEstado.ok) {

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

    });

}


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

        productosCompletos =
            productos;

        productoVariante.innerHTML =
            '<option value="">Seleccione un producto</option>';

        if (esAdministrador()) {

            productosCompletos
                .filter(
                    producto =>
                        producto.activo
                )
                .forEach(producto => {

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

                });

        }

        cargarCategoriasFiltroProductos();
        aplicarFiltrosProductos();

    } catch (error) {

        console.error(
            'Error al cargar productos:',
            error
        );

    }

}


buscarProducto.addEventListener(
    'input',
    aplicarFiltrosProductos
);

filtroCategoriaProducto.addEventListener(
    'change',
    aplicarFiltrosProductos
);

filtroEstadoProducto.addEventListener(
    'change',
    aplicarFiltrosProductos
);

limpiarFiltrosProductos.addEventListener(
    'click',
    () => {

        buscarProducto.value = '';
        filtroCategoriaProducto.value = '';
        filtroEstadoProducto.value = '';

        aplicarFiltrosProductos();

    }
);

cerrarVariantesProducto.addEventListener(
    'click',
    () => {

        variantesProductoSection.hidden =
            true;

        tablaVariantesProducto.innerHTML =
            '';

        productoVariantesSeleccionado
            .textContent = '';

        productoVariantesActual =
            null;

    }
);

// =====================================
// EDITAR VARIANTE
// =====================================

editarVarianteForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();

        if (
            !esAdministrador() ||
            !varianteEditandoId
        ) {

            return;

        }

        const datos = {
            color:
                document
                    .getElementById(
                        'editarColorVariante'
                    )
                    .value
                    .trim(),

            talla:
                document
                    .getElementById(
                        'editarTallaVariante'
                    )
                    .value
                    .trim(),

            sku:
                document
                    .getElementById(
                        'editarSkuVariante'
                    )
                    .value
                    .trim(),

            stock_rancagua:
                Number(
                    document
                        .getElementById(
                            'editarStockRancagua'
                        )
                        .value
                ),

            minimo_rancagua:
                document
                    .getElementById(
                        'editarMinimoRancagua'
                    )
                    .value,

            stock_bodega:
                Number(
                    document
                        .getElementById(
                            'editarStockBodega'
                        )
                        .value
                ),

            minimo_bodega:
                document
                    .getElementById(
                        'editarMinimoBodega'
                    )
                    .value
        };

        if (
            !datos.color ||
            !datos.talla
        ) {

            mensajeEdicionVariante
                .textContent =
                    'Color y talla son obligatorios.';

            return;

        }

        try {

            const respuesta =
                await fetch(
                    '/api/variantes/' +
                    varianteEditandoId,
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
                                datos
                            )
                    }
                );

            const resultado =
                await respuesta.json();

            mensajeEdicionVariante
                .textContent =
                    resultado.mensaje;

            if (
                respuesta.ok
            ) {

                varianteEditandoId =
                    null;

                editarVarianteForm
                    .reset();

                editarVarianteSection.hidden =
                    true;

                if (
                    productoVariantesActual
                ) {

                    await mostrarVariantesProducto(
                        productoVariantesActual
                    );

                }

            }

        } catch (error) {

            console.error(
                'Error al editar variante:',
                error
            );

            mensajeEdicionVariante
                .textContent =
                    'Error al editar variante.';

        }

    }
);


cancelarEdicionVariante.addEventListener(
    'click',
    () => {

        varianteEditandoId =
            null;

        editarVarianteForm
            .reset();

        editarVarianteSection.hidden =
            true;

        mensajeEdicionVariante
            .textContent =
                '';

    }
);


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

    editarVarianteSection.hidden =
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