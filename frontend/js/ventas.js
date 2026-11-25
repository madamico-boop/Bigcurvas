const formulario =
    document.getElementById('ventaForm');

const mensaje =
    document.getElementById('mensajeVenta');

const clienteSelect =
    document.getElementById('cliente');

const buscarClienteVenta =
    document.getElementById('buscarClienteVenta');

const canalVenta =
    document.getElementById('canalVenta');

const productoSelect =
    document.getElementById('producto');

const buscarProductoVenta =
    document.getElementById('buscarProductoVenta');

const colorSelect =
    document.getElementById('color');

const tallaSelect =
    document.getElementById('talla');

const sucursalSelect =
    document.getElementById('sucursal');

const cantidadInput =
    document.getElementById('cantidad');

const disminuirCantidadSeleccion =
    document.getElementById('disminuirCantidadSeleccion');

const aumentarCantidadSeleccion =
    document.getElementById('aumentarCantidadSeleccion');

const stockDisponible =
    document.getElementById('stockDisponible');

const tablaCarrito =
    document.getElementById('tablaCarrito');

const totalVenta =
    document.getElementById('totalVenta');

const resumenCarrito =
    document.getElementById('resumenCarrito');

const confirmarVenta =
    document.getElementById('confirmarVenta');

const vaciarCarrito =
    document.getElementById('vaciarCarrito');

const sucursalVentaResumen =
    document.getElementById('sucursalVentaResumen');

const botonAgregarVenta =
    formulario.querySelector('.boton-agregar-venta');


let clientesVenta = [];

let opcionesVenta = [];

let carrito = [];

let sucursalVenta = null;


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


function formatearDinero(valor) {

    return Number(valor)
        .toLocaleString(
            'es-CL',
            {
                style: 'currency',
                currency: 'CLP',
                maximumFractionDigits: 0
            }
        );

}


// =====================================
// CLIENTES
// =====================================

function mostrarClientes() {

    const texto =
        buscarClienteVenta.value
            .trim()
            .toLowerCase();

    const seleccionado =
        clienteSelect.value;

    const filtrados =
        clientesVenta.filter(cliente => {

            const nombre =
                String(cliente.nombre)
                    .toLowerCase();

            const rut =
                String(cliente.rut || '')
                    .toLowerCase();

            return (
                !texto ||
                nombre.includes(texto) ||
                rut.includes(texto) ||
                String(cliente.id_cliente) ===
                    seleccionado
            );

        });

    clienteSelect.innerHTML =
        '<option value="">Venta sin cliente</option>';

    filtrados.forEach(cliente => {

        const opcion =
            document.createElement('option');

        opcion.value =
            cliente.id_cliente;

        opcion.textContent =
            cliente.rut
                ? cliente.nombre +
                    ' - ' +
                    cliente.rut
                : cliente.nombre;

        clienteSelect.appendChild(
            opcion
        );

    });

    if (
        seleccionado &&
        [
            ...clienteSelect.options
        ].some(
            opcion =>
                opcion.value ===
                seleccionado
        )
    ) {

        clienteSelect.value =
            seleccionado;

    }

}


async function cargarClientes() {

    try {

        const respuesta =
            await fetch(
                '/api/clientes/opciones',
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

        clientesVenta =
            await respuesta.json();

        if (!respuesta.ok) {

            console.error(
                clientesVenta.mensaje
            );

            clientesVenta = [];

        }

        mostrarClientes();

    } catch (error) {

        console.error(
            'Error al cargar clientes:',
            error
        );

    }

}


buscarClienteVenta.addEventListener(
    'input',
    mostrarClientes
);


// =====================================
// PRODUCTOS DISPONIBLES
// =====================================

function productosDisponibles() {

    let opciones =
        opcionesVenta;

    if (sucursalVenta) {

        opciones =
            opciones.filter(
                item =>
                    item.sucursal ===
                    sucursalVenta
            );

    }

    return [
        ...new Set(
            opciones.map(
                item =>
                    item.producto
            )
        )
    ].sort();

}


function mostrarProductos() {

    const texto =
        buscarProductoVenta.value
            .trim()
            .toLowerCase();

    const seleccionado =
        productoSelect.value;

    const productos =
        productosDisponibles()
            .filter(
                producto =>
                    !texto ||
                    producto
                        .toLowerCase()
                        .includes(texto) ||
                    producto ===
                        seleccionado
            );

    productoSelect.innerHTML =
        '<option value="">Seleccione un producto</option>';

    productos.forEach(producto => {

        const opcion =
            document.createElement(
                'option'
            );

        opcion.value =
            producto;

        opcion.textContent =
            producto;

        productoSelect.appendChild(
            opcion
        );

    });

    if (
        seleccionado &&
        productos.includes(
            seleccionado
        )
    ) {

        productoSelect.value =
            seleccionado;

    }

}


async function cargarOpcionesVenta() {

    try {

        const respuesta =
            await fetch(
                '/api/opciones-venta',
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

        opcionesVenta =
            await respuesta.json();

        if (!respuesta.ok) {

            console.error(
                opcionesVenta.mensaje
            );

            opcionesVenta = [];

        }

        mostrarProductos();

    } catch (error) {

        console.error(
            'Error al cargar productos:',
            error
        );

    }

}


buscarProductoVenta.addEventListener(
    'input',
    () => {

        productoSelect.value =
            '';

        reiniciarSelectoresVariante();

        mostrarProductos();

    }
);


// =====================================
// REINICIAR SELECTORES
// =====================================

function reiniciarSelectoresVariante() {

    colorSelect.innerHTML =
        '<option value="">Seleccione un color</option>';

    tallaSelect.innerHTML =
        '<option value="">Seleccione una talla</option>';

    sucursalSelect.innerHTML =
        '<option value="">Seleccione una sucursal</option>';

    colorSelect.disabled =
        true;

    tallaSelect.disabled =
        true;

    sucursalSelect.disabled =
        true;

    cantidadInput.value =
        1;

    cantidadInput.removeAttribute(
        'max'
    );

    stockDisponible.textContent =
        'Stock disponible: -';

    stockDisponible.classList.remove(
        'stock-agotado'
    );

    botonAgregarVenta.disabled =
        false;

}


// =====================================
// PRODUCTO → COLOR
// =====================================

productoSelect.addEventListener(
    'change',
    () => {

        colorSelect.innerHTML =
            '<option value="">Seleccione un color</option>';

        tallaSelect.innerHTML =
            '<option value="">Seleccione una talla</option>';

        sucursalSelect.innerHTML =
            '<option value="">Seleccione una sucursal</option>';

        tallaSelect.disabled =
            true;

        sucursalSelect.disabled =
            true;

        cantidadInput.value =
            1;

        stockDisponible.textContent =
            'Stock disponible: -';

        botonAgregarVenta.disabled =
            false;

        if (!productoSelect.value) {

            colorSelect.disabled =
                true;

            return;

        }

        let opciones =
            opcionesVenta.filter(
                item =>
                    item.producto ===
                    productoSelect.value
            );

        if (sucursalVenta) {

            opciones =
                opciones.filter(
                    item =>
                        item.sucursal ===
                        sucursalVenta
                );

        }

        const colores = [
            ...new Set(
                opciones.map(
                    item =>
                        item.color
                )
            )
        ].sort();

        colores.forEach(color => {

            const opcion =
                document.createElement(
                    'option'
                );

            opcion.value =
                color;

            opcion.textContent =
                color;

            colorSelect.appendChild(
                opcion
            );

        });

        colorSelect.disabled =
            false;

    }
);


// =====================================
// COLOR → TALLA
// =====================================

colorSelect.addEventListener(
    'change',
    () => {

        tallaSelect.innerHTML =
            '<option value="">Seleccione una talla</option>';

        sucursalSelect.innerHTML =
            '<option value="">Seleccione una sucursal</option>';

        sucursalSelect.disabled =
            true;

        cantidadInput.value =
            1;

        stockDisponible.textContent =
            'Stock disponible: -';

        botonAgregarVenta.disabled =
            false;

        if (!colorSelect.value) {

            tallaSelect.disabled =
                true;

            return;

        }

        let opciones =
            opcionesVenta.filter(
                item =>
                    item.producto ===
                        productoSelect.value &&
                    item.color ===
                        colorSelect.value
            );

        if (sucursalVenta) {

            opciones =
                opciones.filter(
                    item =>
                        item.sucursal ===
                        sucursalVenta
                );

        }

        const tallas = [
            ...new Set(
                opciones.map(
                    item =>
                        item.talla
                )
            )
        ].sort();

        tallas.forEach(talla => {

            const opcion =
                document.createElement(
                    'option'
                );

            opcion.value =
                talla;

            opcion.textContent =
                talla;

            tallaSelect.appendChild(
                opcion
            );

        });

        tallaSelect.disabled =
            false;

    }
);


// =====================================
// TALLA → SUCURSAL
// =====================================

tallaSelect.addEventListener(
    'change',
    () => {

        sucursalSelect.innerHTML =
            '<option value="">Seleccione una sucursal</option>';

        stockDisponible.textContent =
            'Stock disponible: -';

        cantidadInput.value =
            1;

        botonAgregarVenta.disabled =
            false;

        if (!tallaSelect.value) {

            sucursalSelect.disabled =
                true;

            return;

        }

        let opciones =
            opcionesVenta.filter(
                item =>
                    item.producto ===
                        productoSelect.value &&
                    item.color ===
                        colorSelect.value &&
                    item.talla ===
                        tallaSelect.value
            );

        if (sucursalVenta) {

            opciones =
                opciones.filter(
                    item =>
                        item.sucursal ===
                        sucursalVenta
                );

        }

        opciones.forEach(item => {

            const opcion =
                document.createElement(
                    'option'
                );

            opcion.value =
                item.sucursal;

            opcion.textContent =
                item.sucursal +
                ' (' +
                item.stock_actual +
                ' disponibles)';

            sucursalSelect.appendChild(
                opcion
            );

        });

        sucursalSelect.disabled =
            false;

    }
);


// =====================================
// ITEM SELECCIONADO Y STOCK
// =====================================

function obtenerItemSeleccionado() {

    return opcionesVenta.find(
        item =>
            item.producto ===
                productoSelect.value &&
            item.color ===
                colorSelect.value &&
            item.talla ===
                tallaSelect.value &&
            item.sucursal ===
                sucursalSelect.value
    );

}


function cantidadActualEnCarrito(
    item
) {

    const existente =
        carrito.find(
            producto =>
                producto.id_variante ===
                    item.id_variante &&
                producto.id_sucursal ===
                    item.id_sucursal
        );

    return existente
        ? existente.cantidad
        : 0;

}


function actualizarStockDisponible() {

    const item =
        obtenerItemSeleccionado();

    if (!item) {

        stockDisponible.textContent =
            'Stock disponible: -';

        cantidadInput.removeAttribute(
            'max'
        );

        stockDisponible.classList.remove(
            'stock-agotado'
        );

        botonAgregarVenta.disabled =
            false;

        return;

    }

    const disponible =
        Number(item.stock_actual) -
        cantidadActualEnCarrito(
            item
        );

    stockDisponible.textContent =
        disponible > 0
            ? 'Stock disponible para agregar: ' +
                disponible
            : 'Todo el stock disponible ya está en el carrito';

    cantidadInput.max =
        Math.max(
            disponible,
            1
        );

    stockDisponible.classList.toggle(
        'stock-agotado',
        disponible <= 0
    );

    botonAgregarVenta.disabled =
        disponible <= 0;

    if (
        Number(cantidadInput.value) >
        disponible &&
        disponible > 0
    ) {

        cantidadInput.value =
            disponible;

    }

}


sucursalSelect.addEventListener(
    'change',
    () => {

        cantidadInput.value =
            1;

        actualizarStockDisponible();

    }
);


// =====================================
// SELECTOR DE CANTIDAD
// =====================================

disminuirCantidadSeleccion.addEventListener(
    'click',
    () => {

        const actual =
            Number(
                cantidadInput.value
            ) || 1;

        cantidadInput.value =
            Math.max(
                1,
                actual - 1
            );

    }
);


aumentarCantidadSeleccion.addEventListener(
    'click',
    () => {

        const item =
            obtenerItemSeleccionado();

        const actual =
            Number(
                cantidadInput.value
            ) || 1;

        if (!item) {

            cantidadInput.value =
                actual + 1;

            return;

        }

        const disponible =
            Number(item.stock_actual) -
            cantidadActualEnCarrito(
                item
            );

        cantidadInput.value =
            Math.min(
                Math.max(
                    disponible,
                    1
                ),
                actual + 1
            );

    }
);


// =====================================
// AGREGAR AL CARRITO
// =====================================

formulario.addEventListener(
    'submit',
    event => {

        event.preventDefault();

        const item =
            obtenerItemSeleccionado();

        if (!item) {

            mensaje.textContent =
                'Seleccione una variante válida';

            return;

        }

        const cantidad =
            Number(
                cantidadInput.value
            );

        if (
            !Number.isInteger(
                cantidad
            ) ||
            cantidad <= 0
        ) {

            mensaje.textContent =
                'Ingrese una cantidad válida';

            return;

        }

        const existente =
            carrito.find(
                producto =>
                    producto.id_variante ===
                        item.id_variante &&
                    producto.id_sucursal ===
                        item.id_sucursal
            );

        const cantidadActual =
            existente
                ? existente.cantidad
                : 0;

        if (
            cantidadActual +
            cantidad >
            Number(
                item.stock_actual
            )
        ) {

            mensaje.textContent =
                'La cantidad supera el stock disponible';

            return;

        }

        if (!sucursalVenta) {

            sucursalVenta =
                item.sucursal;

        }

        if (
            item.sucursal !==
            sucursalVenta
        ) {

            mensaje.textContent =
                'Todos los productos de la venta deben pertenecer a la misma sucursal';

            return;

        }

        if (existente) {

            existente.cantidad +=
                cantidad;

        } else {

            carrito.push({

                id_variante:
                    item.id_variante,

                id_sucursal:
                    item.id_sucursal,

                producto:
                    item.producto,

                color:
                    item.color,

                talla:
                    item.talla,

                sucursal:
                    item.sucursal,

                precio:
                    Number(
                        item.precio
                    ),

                stock_actual:
                    Number(
                        item.stock_actual
                    ),

                cantidad:
                    cantidad

            });

        }

        mensaje.textContent =
            '';

        mostrarCarrito();

        limpiarSeleccionProducto();

    }
);


// =====================================
// CARRITO
// =====================================

function cambiarCantidadCarrito(
    indice,
    cambio
) {

    const item =
        carrito[indice];

    if (!item) {

        return;

    }

    const nuevaCantidad =
        item.cantidad +
        cambio;

    if (
        nuevaCantidad < 1
    ) {

        return;

    }

    if (
        nuevaCantidad >
        item.stock_actual
    ) {

        mensaje.textContent =
            'No hay más stock disponible para este producto';

        return;

    }

    item.cantidad =
        nuevaCantidad;

    mensaje.textContent =
        '';

    mostrarCarrito();

    actualizarStockDisponible();

}


function eliminarItemCarrito(
    indice
) {

    carrito.splice(
        indice,
        1
    );

    if (
        carrito.length === 0
    ) {

        sucursalVenta =
            null;

    }

    mensaje.textContent =
        '';

    mostrarCarrito();

    mostrarProductos();

    limpiarSeleccionProducto();

}


function mostrarCarrito() {

    tablaCarrito.innerHTML =
        '';

    let total =
        0;

    let unidades =
        0;

    if (
        carrito.length === 0
    ) {

        tablaCarrito.innerHTML =
            '<tr>' +
                '<td colspan="7" class="sin-resultados">' +
                    'No hay productos agregados' +
                '</td>' +
            '</tr>';

    }

    carrito.forEach(
        (item, indice) => {

            const fila =
                document.createElement(
                    'tr'
                );

            const subtotal =
                item.precio *
                item.cantidad;

            total +=
                subtotal;

            unidades +=
                item.cantidad;

            fila.innerHTML =
                '<td>' +
                    escaparHtml(
                        item.producto
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        item.color
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        item.talla
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        item.sucursal
                    ) +
                '</td>' +
                '<td>' +
                    '<div class="cantidad-carrito">' +
                        '<button type="button" class="disminuir-item" data-indice="' +
                            indice +
                        '">−</button>' +
                        '<strong>' +
                            item.cantidad +
                        '</strong>' +
                        '<button type="button" class="aumentar-item" data-indice="' +
                            indice +
                        '"' +
                        (
                            item.cantidad >=
                            item.stock_actual
                                ? ' disabled'
                                : ''
                        ) +
                        '>+</button>' +
                    '</div>' +
                '</td>' +
                '<td>' +
                    formatearDinero(
                        subtotal
                    ) +
                '</td>' +
                '<td>' +
                    '<button type="button" class="eliminar-item" data-indice="' +
                        indice +
                    '">' +
                        'Quitar' +
                    '</button>' +
                '</td>';

            tablaCarrito.appendChild(
                fila
            );

        }
    );

    document
        .querySelectorAll(
            '.disminuir-item'
        )
        .forEach(boton => {

            boton.addEventListener(
                'click',
                () =>
                    cambiarCantidadCarrito(
                        Number(
                            boton.dataset.indice
                        ),
                        -1
                    )
            );

        });

    document
        .querySelectorAll(
            '.aumentar-item'
        )
        .forEach(boton => {

            boton.addEventListener(
                'click',
                () =>
                    cambiarCantidadCarrito(
                        Number(
                            boton.dataset.indice
                        ),
                        1
                    )
            );

        });

    document
        .querySelectorAll(
            '.eliminar-item'
        )
        .forEach(boton => {

            boton.addEventListener(
                'click',
                () =>
                    eliminarItemCarrito(
                        Number(
                            boton.dataset.indice
                        )
                    )
            );

        });

    totalVenta.textContent =
        'Total: ' +
        formatearDinero(
            total
        );

    resumenCarrito.textContent =
        carrito.length === 0
            ? 'No hay productos agregados'
            : carrito.length +
                (
                    carrito.length === 1
                        ? ' producto · '
                        : ' productos · '
                ) +
                unidades +
                (
                    unidades === 1
                        ? ' unidad'
                        : ' unidades'
                );

    sucursalVentaResumen.textContent =
        sucursalVenta ||
        'Se define al agregar el primer producto';

    confirmarVenta.disabled =
        carrito.length === 0;

    vaciarCarrito.disabled =
        carrito.length === 0;

}


// =====================================
// LIMPIAR SELECCIÓN
// =====================================

function limpiarSeleccionProducto() {

    buscarProductoVenta.value =
        '';

    productoSelect.value =
        '';

    reiniciarSelectoresVariante();

    mostrarProductos();

}


// =====================================
// VACIAR CARRITO
// =====================================

vaciarCarrito.addEventListener(
    'click',
    () => {

        if (
            carrito.length === 0
        ) {

            return;

        }

        const confirmar =
            confirm(
                '¿Vaciar todos los productos de la venta?'
            );

        if (!confirmar) {

            return;

        }

        carrito = [];

        sucursalVenta =
            null;

        mensaje.textContent =
            '';

        mostrarCarrito();

        limpiarSeleccionProducto();

    }
);


// =====================================
// CONFIRMAR VENTA
// =====================================

confirmarVenta.addEventListener(
    'click',
    async () => {

        if (
            carrito.length === 0
        ) {

            mensaje.textContent =
                'Debe agregar al menos un producto';

            return;

        }

        const venta = {

            id_cliente:
                clienteSelect.value
                    ? Number(
                        clienteSelect.value
                    )
                    : null,

            canal:
                canalVenta.value,

            items:
                carrito.map(
                    item => ({

                        id_variante:
                            item.id_variante,

                        id_sucursal:
                            item.id_sucursal,

                        cantidad:
                            item.cantidad

                    })
                )

        };

        confirmarVenta.disabled =
            true;

        vaciarCarrito.disabled =
            true;

        mensaje.textContent =
            'Registrando venta...';

        try {

            const respuesta =
                await fetch(
                    '/api/ventas',
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
                                venta
                            )

                    }
                );

            if (
                respuesta.status === 401
            ) {

                window.location.href =
                    'index.html';

                return;

            }

            const resultado =
                await respuesta.json();

            mensaje.textContent =
                resultado.mensaje;

            if (
                respuesta.ok
            ) {

                carrito = [];

                sucursalVenta =
                    null;

                clienteSelect.value =
                    '';

                buscarClienteVenta.value =
                    '';

                canalVenta.value =
                    'Local';

                mostrarClientes();

                mostrarCarrito();

                limpiarSeleccionProducto();

                await cargarOpcionesVenta();

                if (
                    resultado.total !==
                    undefined
                ) {

                    mensaje.textContent =
                        resultado.mensaje +
                        '. Total: ' +
                        formatearDinero(
                            resultado.total
                        );

                }

            } else {

                confirmarVenta.disabled =
                    false;

                vaciarCarrito.disabled =
                    false;

            }

        } catch (error) {

            console.error(
                'Error al registrar venta:',
                error
            );

            mensaje.textContent =
                'Error al registrar la venta';

            confirmarVenta.disabled =
                false;

            vaciarCarrito.disabled =
                false;

        }

    }
);


// =====================================
// INICIO
// =====================================

async function iniciar() {

    await Promise.all([
        cargarClientes(),
        cargarOpcionesVenta()
    ]);

    mostrarCarrito();

}


iniciar();
