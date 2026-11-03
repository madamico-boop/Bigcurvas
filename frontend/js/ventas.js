const formulario =
    document.getElementById('ventaForm');

const mensaje =
    document.getElementById('mensajeVenta');

const clienteSelect =
    document.getElementById('cliente');

const productoSelect =
    document.getElementById('producto');

const colorSelect =
    document.getElementById('color');

const tallaSelect =
    document.getElementById('talla');

const sucursalSelect =
    document.getElementById('sucursal');

const cantidadInput =
    document.getElementById('cantidad');

const stockDisponible =
    document.getElementById('stockDisponible');

const tablaCarrito =
    document.getElementById('tablaCarrito');

const totalVenta =
    document.getElementById('totalVenta');

const confirmarVenta =
    document.getElementById('confirmarVenta');


let opcionesVenta = [];

let carrito = [];

let sucursalVenta = null;


// =====================================
// CLIENTES
// =====================================

async function cargarClientes() {

    try {

        const respuesta =
            await fetch('/api/clientes/opciones');

        const clientes =
            await respuesta.json();

        clienteSelect.innerHTML =
            '<option value="">Venta sin cliente</option>';


        clientes.forEach(cliente => {

                const opcion =
                    document.createElement('option');

                opcion.value =
                    cliente.id_cliente;

                opcion.textContent =
                    cliente.rut
                        ? `${cliente.nombre} - ${cliente.rut}`
                        : cliente.nombre;

                clienteSelect.appendChild(opcion);

            });

    } catch (error) {

        console.error(
            'Error al cargar clientes:',
            error
        );

    }

}


// =====================================
// OPCIONES DE PRODUCTOS
// =====================================

async function cargarOpcionesVenta() {

    try {

        const respuesta =
            await fetch('/api/opciones-venta');

        opcionesVenta =
            await respuesta.json();


        productoSelect.innerHTML =
            '<option value="">Seleccione un producto</option>';


        const productos = [
            ...new Set(
                opcionesVenta.map(
                    item => item.producto
                )
            )
        ];


        productos.forEach(producto => {

            const opcion =
                document.createElement('option');

            opcion.value = producto;

            opcion.textContent = producto;

            productoSelect.appendChild(opcion);

        });

    } catch (error) {

        console.error(
            'Error al cargar productos:',
            error
        );

    }

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


        tallaSelect.disabled = true;
        sucursalSelect.disabled = true;

        stockDisponible.textContent =
            'Stock disponible: -';


        if (!productoSelect.value) {

            colorSelect.disabled = true;

            return;

        }


        const colores = [
            ...new Set(
                opcionesVenta
                    .filter(item =>
                        item.producto ===
                        productoSelect.value
                    )
                    .map(item => item.color)
            )
        ];


        colores.forEach(color => {

            const opcion =
                document.createElement('option');

            opcion.value = color;
            opcion.textContent = color;

            colorSelect.appendChild(opcion);

        });


        colorSelect.disabled = false;

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


        sucursalSelect.disabled = true;

        stockDisponible.textContent =
            'Stock disponible: -';


        if (!colorSelect.value) {

            tallaSelect.disabled = true;

            return;

        }


        const tallas = [
            ...new Set(
                opcionesVenta
                    .filter(item =>
                        item.producto ===
                            productoSelect.value &&
                        item.color ===
                            colorSelect.value
                    )
                    .map(item => item.talla)
            )
        ];


        tallas.forEach(talla => {

            const opcion =
                document.createElement('option');

            opcion.value = talla;
            opcion.textContent = talla;

            tallaSelect.appendChild(opcion);

        });


        tallaSelect.disabled = false;

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


        if (!tallaSelect.value) {

            sucursalSelect.disabled = true;

            return;

        }


        let opciones = opcionesVenta.filter(item =>
            item.producto === productoSelect.value &&
            item.color === colorSelect.value &&
            item.talla === tallaSelect.value
        );


        // Si ya agregamos productos,
        // toda la venta debe seguir usando
        // la misma sucursal.

        if (sucursalVenta) {

            opciones = opciones.filter(item =>
                item.sucursal === sucursalVenta
            );

        }


        opciones.forEach(item => {

            const opcion =
                document.createElement('option');

            opcion.value =
                item.sucursal;

            opcion.textContent =
                `${item.sucursal} (${item.stock_actual} disponibles)`;

            sucursalSelect.appendChild(opcion);

        });


        sucursalSelect.disabled = false;

    }
);


// =====================================
// MOSTRAR STOCK
// =====================================

sucursalSelect.addEventListener(
    'change',
    () => {

        const item =
            obtenerItemSeleccionado();


        if (!item) {

            stockDisponible.textContent =
                'Stock disponible: -';

            cantidadInput.removeAttribute('max');

            return;

        }


        stockDisponible.textContent =
            `Stock disponible: ${item.stock_actual}`;


        cantidadInput.max =
            item.stock_actual;

    }
);


// =====================================
// OBTENER ITEM SELECCIONADO
// =====================================

function obtenerItemSeleccionado() {

    return opcionesVenta.find(item =>
        item.producto === productoSelect.value &&
        item.color === colorSelect.value &&
        item.talla === tallaSelect.value &&
        item.sucursal === sucursalSelect.value
    );

}


// =====================================
// AGREGAR AL CARRITO
// =====================================

formulario.addEventListener(
    'submit',
    (event) => {

        event.preventDefault();


        const item =
            obtenerItemSeleccionado();


        if (!item) {

            mensaje.textContent =
                'Seleccione una variante válida';

            return;

        }


        const cantidad =
            Number(cantidadInput.value);


        if (
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {

            mensaje.textContent =
                'Ingrese una cantidad válida';

            return;

        }


        const existente =
            carrito.find(producto =>
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
            cantidadActual + cantidad >
            item.stock_actual
        ) {

            mensaje.textContent =
                'La cantidad supera el stock disponible';

            return;

        }


        if (!sucursalVenta) {

            sucursalVenta =
                item.sucursal;

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
                    Number(item.precio),

                cantidad:
                    cantidad

            });

        }


        mensaje.textContent = '';


        mostrarCarrito();

        limpiarSeleccionProducto();

    }
);


// =====================================
// MOSTRAR CARRITO
// =====================================

function mostrarCarrito() {

    tablaCarrito.innerHTML = '';


    let total = 0;


    if (carrito.length === 0) {

        tablaCarrito.innerHTML = `
            <tr>
                <td colspan="7">
                    No hay productos agregados
                </td>
            </tr>
        `;

    }


    carrito.forEach(
        (item, indice) => {

            const fila =
                document.createElement('tr');


            const subtotal =
                item.precio *
                item.cantidad;


            total += subtotal;


            fila.innerHTML = `
                <td>${item.producto}</td>

                <td>${item.color}</td>

                <td>${item.talla}</td>

                <td>${item.sucursal}</td>

                <td>${item.cantidad}</td>

                <td>
                    $${subtotal.toLocaleString('es-CL')}
                </td>

                <td>
                    <button
                        class="eliminar-item"
                        data-indice="${indice}"
                    >
                        Quitar
                    </button>
                </td>
            `;


            tablaCarrito.appendChild(fila);

        }
    );


    document
        .querySelectorAll('.eliminar-item')
        .forEach(boton => {

            boton.addEventListener(
                'click',
                () => {

                    const indice =
                        Number(
                            boton.dataset.indice
                        );


                    carrito.splice(
                        indice,
                        1
                    );


                    if (
                        carrito.length === 0
                    ) {

                        sucursalVenta = null;

                    }


                    mostrarCarrito();

                    limpiarSeleccionProducto();

                }
            );

        });


    totalVenta.textContent =
        `Total: $${total.toLocaleString('es-CL')}`;

}


// =====================================
// LIMPIAR SELECTORES
// =====================================

function limpiarSeleccionProducto() {

    productoSelect.value = '';


    colorSelect.innerHTML =
        '<option value="">Seleccione un color</option>';

    tallaSelect.innerHTML =
        '<option value="">Seleccione una talla</option>';

    sucursalSelect.innerHTML =
        '<option value="">Seleccione una sucursal</option>';


    colorSelect.disabled = true;
    tallaSelect.disabled = true;
    sucursalSelect.disabled = true;


    cantidadInput.value = '';

    cantidadInput.removeAttribute('max');


    stockDisponible.textContent =
        'Stock disponible: -';

}


// =====================================
// CONFIRMAR VENTA
// =====================================

confirmarVenta.addEventListener(
    'click',
    async () => {

        if (carrito.length === 0) {

            mensaje.textContent =
                'Debe agregar al menos un producto';

            return;

        }


        const venta = {

            id_cliente:
                clienteSelect.value
                    ? Number(clienteSelect.value)
                    : null,

            items:
                carrito.map(item => ({

                    id_variante:
                        item.id_variante,

                    id_sucursal:
                        item.id_sucursal,

                    cantidad:
                        item.cantidad

                }))

        };


        const respuesta =
            await fetch(
                '/api/ventas',
                {

                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(venta)

                }
            );


        const resultado =
            await respuesta.json();


        mensaje.textContent =
            resultado.mensaje;


        if (respuesta.ok) {

            carrito = [];

            sucursalVenta = null;

            clienteSelect.value = '';


            mostrarCarrito();

            limpiarSeleccionProducto();


            // Volver a consultar stock
            // actualizado desde PostgreSQL

            await cargarOpcionesVenta();


            if (
                resultado.total !== undefined
            ) {

                mensaje.textContent =
                    `${resultado.mensaje}. Total: $${Number(
                        resultado.total
                    ).toLocaleString('es-CL')}`;

            }

        }

    }
);


cargarClientes();
cargarOpcionesVenta();
mostrarCarrito();