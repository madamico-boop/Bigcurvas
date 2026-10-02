const formulario = document.getElementById('ventaForm');
const mensaje = document.getElementById('mensajeVenta');

const productoSelect = document.getElementById('producto');
const colorSelect = document.getElementById('color');
const tallaSelect = document.getElementById('talla');
const sucursalSelect = document.getElementById('sucursal');

const cantidadInput = document.getElementById('cantidad');
const stockDisponible = document.getElementById('stockDisponible');

let opcionesVenta = [];


// ===============================
// CARGAR DATOS DESDE POSTGRESQL
// ===============================

async function cargarOpcionesVenta() {

    try {

        const respuesta = await fetch('/api/opciones-venta');

        opcionesVenta = await respuesta.json();

        const productos = [
            ...new Set(
                opcionesVenta.map(item => item.producto)
            )
        ];

        productos.forEach(producto => {

            const opcion = document.createElement('option');

            opcion.value = producto;
            opcion.textContent = producto;

            productoSelect.appendChild(opcion);

        });

    } catch (error) {

        console.error(error);

        mensaje.textContent =
            'Error al cargar los productos';

    }

}


// ===============================
// PRODUCTO → COLORES
// ===============================

productoSelect.addEventListener('change', () => {

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

    const producto = productoSelect.value;

    if (!producto) {

        colorSelect.disabled = true;
        return;

    }

    const colores = [
        ...new Set(
            opcionesVenta
                .filter(item =>
                    item.producto === producto
                )
                .map(item => item.color)
        )
    ];

    colores.forEach(color => {

        const opcion = document.createElement('option');

        opcion.value = color;
        opcion.textContent = color;

        colorSelect.appendChild(opcion);

    });

    colorSelect.disabled = false;

});


// ===============================
// COLOR → TALLAS
// ===============================

colorSelect.addEventListener('change', () => {

    tallaSelect.innerHTML =
        '<option value="">Seleccione una talla</option>';

    sucursalSelect.innerHTML =
        '<option value="">Seleccione una sucursal</option>';

    sucursalSelect.disabled = true;

    stockDisponible.textContent =
        'Stock disponible: -';

    const producto = productoSelect.value;
    const color = colorSelect.value;

    if (!color) {

        tallaSelect.disabled = true;
        return;

    }

    const tallas = [
        ...new Set(
            opcionesVenta
                .filter(item =>
                    item.producto === producto &&
                    item.color === color
                )
                .map(item => item.talla)
        )
    ];

    tallas.forEach(talla => {

        const opcion = document.createElement('option');

        opcion.value = talla;
        opcion.textContent = talla;

        tallaSelect.appendChild(opcion);

    });

    tallaSelect.disabled = false;

});


// ===============================
// TALLA → SUCURSALES
// ===============================

tallaSelect.addEventListener('change', () => {

    sucursalSelect.innerHTML =
        '<option value="">Seleccione una sucursal</option>';

    stockDisponible.textContent =
        'Stock disponible: -';

    const producto = productoSelect.value;
    const color = colorSelect.value;
    const talla = tallaSelect.value;

    if (!talla) {

        sucursalSelect.disabled = true;
        return;

    }

    const sucursales = opcionesVenta.filter(item =>
        item.producto === producto &&
        item.color === color &&
        item.talla === talla
    );

    sucursales.forEach(item => {

        const opcion = document.createElement('option');

        opcion.value = item.sucursal;

        opcion.textContent =
            `${item.sucursal} (${item.stock_actual} disponibles)`;

        sucursalSelect.appendChild(opcion);

    });

    sucursalSelect.disabled = false;

});


// ===============================
// SUCURSAL → MOSTRAR STOCK
// ===============================

sucursalSelect.addEventListener('change', () => {

    const item = opcionesVenta.find(item =>
        item.producto === productoSelect.value &&
        item.color === colorSelect.value &&
        item.talla === tallaSelect.value &&
        item.sucursal === sucursalSelect.value
    );

    if (!item) {

        stockDisponible.textContent =
            'Stock disponible: -';

        cantidadInput.removeAttribute('max');

        return;

    }

    stockDisponible.textContent =
        `Stock disponible: ${item.stock_actual}`;

    cantidadInput.max = item.stock_actual;

});


// ===============================
// REGISTRAR VENTA
// ===============================

formulario.addEventListener('submit', async (event) => {

    event.preventDefault();

    const venta = {
        producto: productoSelect.value,
        color: colorSelect.value,
        talla: tallaSelect.value,
        sucursal: sucursalSelect.value,

        cantidad: Number(
            cantidadInput.value
        )
    };

    const respuesta = await fetch('/api/ventas', {

        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify(venta)

    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {

        mensaje.textContent =
            `${resultado.mensaje}. Stock restante: ${resultado.stockActual}`;

        // Volvemos a consultar PostgreSQL
        // para obtener el stock actualizado

        productoSelect.innerHTML =
            '<option value="">Seleccione un producto</option>';

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

        stockDisponible.textContent =
            'Stock disponible: -';

        await cargarOpcionesVenta();

    } else {

        mensaje.textContent = resultado.mensaje;

    }

});


// Cargar productos al abrir la página
cargarOpcionesVenta();