const tablaVentas =
    document.getElementById('tablaVentas');

const detalleVentaSection =
    document.getElementById('detalleVentaSection');

const tablaDetalleVenta =
    document.getElementById('tablaDetalleVenta');

const buscarVenta =
    document.getElementById('buscarVenta');

const filtroDesde =
    document.getElementById('filtroDesde');

const filtroHasta =
    document.getElementById('filtroHasta');

const filtroSucursalHistorial =
    document.getElementById('filtroSucursalHistorial');

const filtroClienteHistorial =
    document.getElementById('filtroClienteHistorial');

const filtroCanalHistorial =
    document.getElementById('filtroCanalHistorial');

const filtroEstadoPagoHistorial =
    document.getElementById('filtroEstadoPagoHistorial');

const limpiarFiltrosHistorial =
    document.getElementById('limpiarFiltrosHistorial');

const cantidadVentasHistorial =
    document.getElementById('cantidadVentasHistorial');

const totalHistorial =
    document.getElementById('totalHistorial');

const resumenDetalleVenta =
    document.getElementById('resumenDetalleVenta');

const detalleCliente =
    document.getElementById('detalleCliente');

const detalleSucursal =
    document.getElementById('detalleSucursal');

const detalleCanal =
    document.getElementById('detalleCanal');

const detalleEstado =
    document.getElementById('detalleEstado');

const detalleTotal =
    document.getElementById('detalleTotal');

const cerrarDetalleVenta =
    document.getElementById('cerrarDetalleVenta');


let ventasCompletas = [];


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


function obtenerFechaLocal(fecha) {

    const fechaVenta =
        new Date(fecha);

    return fechaVenta
        .toLocaleString(
            'es-CL'
        );

}


function obtenerFechaISO(fecha) {

    const fechaVenta =
        new Date(fecha);

    const anio =
        fechaVenta.getFullYear();

    const mes =
        String(
            fechaVenta.getMonth() + 1
        ).padStart(2, '0');

    const dia =
        String(
            fechaVenta.getDate()
        ).padStart(2, '0');

    return (
        anio +
        '-' +
        mes +
        '-' +
        dia
    );

}


// =====================================
// COMPROBAR SESIÓN
// =====================================

async function comprobarSesion() {

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

        return true;

    } catch (error) {

        console.error(
            'Error al comprobar sesión:',
            error
        );

        window.location.href =
            'index.html';

        return false;

    }

}


// =====================================
// OPCIONES DE FILTRO
// =====================================

function cargarOpcionesFiltros() {

    const sucursales = [
        ...new Set(
            ventasCompletas
                .map(
                    venta =>
                        venta.sucursal
                )
                .filter(Boolean)
        )
    ].sort();

    const clientes = [
        ...new Set(
            ventasCompletas
                .map(
                    venta =>
                        venta.cliente ||
                        'Sin cliente'
                )
        )
    ].sort();

    filtroSucursalHistorial.innerHTML =
        '<option value="">Todas las sucursales</option>';

    sucursales.forEach(sucursal => {

        const opcion =
            document.createElement(
                'option'
            );

        opcion.value =
            sucursal;

        opcion.textContent =
            sucursal;

        filtroSucursalHistorial
            .appendChild(opcion);

    });

    filtroClienteHistorial.innerHTML =
        '<option value="">Todos los clientes</option>';

    clientes.forEach(cliente => {

        const opcion =
            document.createElement(
                'option'
            );

        opcion.value =
            cliente;

        opcion.textContent =
            cliente;

        filtroClienteHistorial
            .appendChild(opcion);

    });

}


// =====================================
// FILTRAR VENTAS
// =====================================

function aplicarFiltros() {

    const texto =
        buscarVenta.value
            .trim()
            .toLowerCase();

    const desde =
        filtroDesde.value;

    const hasta =
        filtroHasta.value;

    const sucursal =
        filtroSucursalHistorial.value;

    const cliente =
        filtroClienteHistorial.value;

    const canal =
        filtroCanalHistorial.value;

    const estadoPago =
        filtroEstadoPagoHistorial.value;

    const filtradas =
        ventasCompletas.filter(
            venta => {

                const clienteVenta =
                    venta.cliente ||
                    'Sin cliente';

                const idVenta =
                    String(
                        venta.id_venta
                    );

                const fechaVenta =
                    obtenerFechaISO(
                        venta.fecha
                    );

                const coincideTexto =
                    !texto ||
                    idVenta.includes(
                        texto
                    ) ||
                    clienteVenta
                        .toLowerCase()
                        .includes(
                            texto
                        );

                const coincideDesde =
                    !desde ||
                    fechaVenta >=
                        desde;

                const coincideHasta =
                    !hasta ||
                    fechaVenta <=
                        hasta;

                const coincideSucursal =
                    !sucursal ||
                    venta.sucursal ===
                        sucursal;

                const coincideCliente =
                    !cliente ||
                    clienteVenta ===
                        cliente;

                const coincideCanal =
                    !canal ||
                    venta.canal ===
                        canal;

                const coincideEstadoPago =
                    !estadoPago ||
                    venta.estado_pago ===
                        estadoPago;

                return (
                    coincideTexto &&
                    coincideDesde &&
                    coincideHasta &&
                    coincideSucursal &&
                    coincideCliente &&
                    coincideCanal &&
                    coincideEstadoPago
                );

            }
        );

    mostrarVentas(
        filtradas
    );

}


// =====================================
// MOSTRAR VENTAS
// =====================================

function mostrarVentas(ventas) {

    tablaVentas.innerHTML =
        '';

    const total =
        ventas.reduce(
            (acumulado, venta) =>
                acumulado +
                Number(
                    venta.total
                ),
            0
        );

    cantidadVentasHistorial
        .textContent =
            ventas.length;

    totalHistorial
        .textContent =
            formatearDinero(
                total
            );

    if (
        ventas.length === 0
    ) {

        tablaVentas.innerHTML =
            '<tr>' +
                '<td colspan="8" class="sin-resultados">' +
                    'No hay ventas que coincidan con los filtros seleccionados.' +
                '</td>' +
            '</tr>';

        return;

    }

    ventas.forEach(
        venta => {

            const fila =
                document.createElement(
                    'tr'
                );

            const cliente =
                venta.cliente ||
                'Sin cliente';

            const estado =
                venta.estado_pago ||
                '-';

            const canalClase =
                venta.canal ===
                'Online'
                    ? 'canal-online'
                    : 'canal-local';

            const estadoClase =
                estado ===
                'Pendiente'
                    ? 'estado-pago-pendiente'
                    : 'estado-pago-pagado';

            fila.innerHTML =
                '<td>' +
                    '<strong>#' +
                        escaparHtml(
                            venta.id_venta
                        ) +
                    '</strong>' +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        obtenerFechaLocal(
                            venta.fecha
                        )
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        cliente
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        venta.sucursal
                    ) +
                '</td>' +
                '<td>' +
                    '<span class="canal-venta ' +
                        canalClase +
                    '">' +
                        escaparHtml(
                            venta.canal
                        ) +
                    '</span>' +
                '</td>' +
                '<td>' +
                    '<span class="estado-pago-historial ' +
                        estadoClase +
                    '">' +
                        escaparHtml(
                            estado
                        ) +
                    '</span>' +
                '</td>' +
                '<td>' +
                    '<strong>' +
                        formatearDinero(
                            venta.total
                        ) +
                    '</strong>' +
                '</td>' +
                '<td>' +
                    '<button type="button" class="boton-detalle">' +
                        'Ver detalle' +
                    '</button>' +
                '</td>';

            tablaVentas
                .appendChild(
                    fila
                );

            const botonDetalle =
                fila.querySelector(
                    '.boton-detalle'
                );

            botonDetalle
                .addEventListener(
                    'click',
                    () =>
                        cargarDetalleVenta(
                            venta
                        )
                );

        }
    );

}


// =====================================
// CARGAR HISTORIAL
// =====================================

async function cargarVentas() {

    try {

        const respuesta =
            await fetch(
                '/api/ventas',
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

        const ventas =
            await respuesta.json();

        if (!respuesta.ok) {

            console.error(
                ventas.mensaje
            );

            return;

        }

        ventasCompletas =
            ventas;

        cargarOpcionesFiltros();

        aplicarFiltros();

    } catch (error) {

        console.error(
            'Error al cargar historial:',
            error
        );

    }

}


// =====================================
// DETALLE DE VENTA
// =====================================

async function cargarDetalleVenta(
    venta
) {

    try {

        const respuesta =
            await fetch(
                '/api/ventas/' +
                venta.id_venta +
                '/detalle',
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

        const detalles =
            await respuesta.json();

        if (!respuesta.ok) {

            console.error(
                detalles.mensaje
            );

            return;

        }

        tablaDetalleVenta.innerHTML =
            '';

        if (
            detalles.length === 0
        ) {

            tablaDetalleVenta.innerHTML =
                '<tr>' +
                    '<td colspan="6" class="sin-resultados">' +
                        'Esta venta no tiene productos asociados.' +
                    '</td>' +
                '</tr>';

        }

        detalles.forEach(
            detalle => {

                const fila =
                    document.createElement(
                        'tr'
                    );

                fila.innerHTML =
                    '<td>' +
                        escaparHtml(
                            detalle.producto
                        ) +
                    '</td>' +
                    '<td>' +
                        escaparHtml(
                            detalle.color
                        ) +
                    '</td>' +
                    '<td>' +
                        escaparHtml(
                            detalle.talla
                        ) +
                    '</td>' +
                    '<td>' +
                        escaparHtml(
                            detalle.cantidad
                        ) +
                    '</td>' +
                    '<td>' +
                        formatearDinero(
                            detalle.precio_unitario
                        ) +
                    '</td>' +
                    '<td>' +
                        '<strong>' +
                            formatearDinero(
                                detalle.subtotal
                            ) +
                        '</strong>' +
                    '</td>';

                tablaDetalleVenta
                    .appendChild(
                        fila
                    );

            }
        );

        resumenDetalleVenta
            .textContent =
                'Venta #' +
                venta.id_venta +
                ' · ' +
                obtenerFechaLocal(
                    venta.fecha
                );

        detalleCliente
            .textContent =
                venta.cliente ||
                'Sin cliente';

        detalleSucursal
            .textContent =
                venta.sucursal ||
                '-';

        detalleCanal
            .textContent =
                venta.canal ||
                '-';

        detalleEstado
            .textContent =
                venta.estado_pago ||
                '-';

        detalleTotal
            .textContent =
                formatearDinero(
                    venta.total
                );

        detalleVentaSection.hidden =
            false;

        detalleVentaSection
            .scrollIntoView({
                behavior:
                    'smooth'
            });

    } catch (error) {

        console.error(
            'Error al cargar detalle:',
            error
        );

    }

}


// =====================================
// EVENTOS
// =====================================

[
    buscarVenta,
    filtroDesde,
    filtroHasta,
    filtroSucursalHistorial,
    filtroClienteHistorial,
    filtroCanalHistorial,
    filtroEstadoPagoHistorial
].forEach(control => {

    control.addEventListener(
        control.tagName === 'INPUT'
            ? 'input'
            : 'change',
        aplicarFiltros
    );

});


limpiarFiltrosHistorial
    .addEventListener(
        'click',
        () => {

            buscarVenta.value =
                '';

            filtroDesde.value =
                '';

            filtroHasta.value =
                '';

            filtroSucursalHistorial.value =
                '';

            filtroClienteHistorial.value =
                '';

            filtroCanalHistorial.value =
                '';

            filtroEstadoPagoHistorial.value =
                '';

            aplicarFiltros();

        }
    );


cerrarDetalleVenta
    .addEventListener(
        'click',
        () => {

            detalleVentaSection.hidden =
                true;

            tablaDetalleVenta.innerHTML =
                '';

        }
    );


// =====================================
// INICIAR
// =====================================

async function iniciar() {

    detalleVentaSection.hidden =
        true;

    const autenticado =
        await comprobarSesion();

    if (!autenticado) {

        return;

    }

    await cargarVentas();

}


iniciar();
