const formulario = document.getElementById('filtrosReporte');
const desdeInput = document.getElementById('desde');
const hastaInput = document.getElementById('hasta');
const sucursalSelect = document.getElementById('sucursalReporte');
const categoriaSelect = document.getElementById('categoriaReporte');
const usuarioSelect = document.getElementById('usuarioReporte');
const campoUsuarioReporte = document.getElementById('campoUsuarioReporte');
const limpiarFiltros = document.getElementById('limpiarFiltros');
const mensaje = document.getElementById('mensajeReporte');
const tabla = document.getElementById('tablaReporte');
const tablaStockCritico = document.getElementById('tablaStockCritico');
const contadorDetalleReporte = document.getElementById('contadorDetalleReporte');
const exportarExcel = document.getElementById('exportarExcel');
const exportarPdf = document.getElementById('exportarPdf');

let graficoDias = null;
let graficoProductos = null;
let datosReporteActual = null;
let usuarioActual = null;


// ==============================
// UTILIDADES
// ==============================

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


function fechaLocalISO(fecha = new Date()) {

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;

}


function formatearFechaPdf(fecha) {

    return new Date(fecha)
        .toLocaleDateString(
            'es-CL'
        );

}


function obtenerFechaArchivo() {

    return fechaLocalISO(
        new Date()
    );

}


function mostrarMensaje(
    texto,
    tipo = ''
) {

    mensaje.textContent =
        texto;

    mensaje.classList.remove(
        'mensaje-exito',
        'mensaje-error'
    );

    if (tipo) {

        mensaje.classList.add(
            tipo === 'exito'
                ? 'mensaje-exito'
                : 'mensaje-error'
        );

    }

}


// ==============================
// USUARIO ACTUAL
// ==============================

async function cargarUsuarioActual() {

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

    if (
        usuarioActual.rol ===
        'administrador'
    ) {

        campoUsuarioReporte.hidden =
            false;

    }

    return true;

}


// ==============================
// CARGAR FILTROS
// ==============================

async function cargarFiltros() {

    try {

        const solicitudes = [
            fetch(
                '/api/sucursales',
                {
                    credentials: 'include'
                }
            ),
            fetch(
                '/api/categorias',
                {
                    credentials: 'include'
                }
            )
        ];

        if (
            usuarioActual &&
            usuarioActual.rol ===
                'administrador'
        ) {

            solicitudes.push(
                fetch(
                    '/api/reportes/vendedores',
                    {
                        credentials: 'include'
                    }
                )
            );

        }

        const respuestas =
            await Promise.all(
                solicitudes
            );

        if (
            respuestas.some(
                respuesta =>
                    !respuesta.ok
            )
        ) {

            throw new Error(
                'No se pudieron cargar los filtros'
            );

        }

        const sucursales =
            await respuestas[0].json();

        const categorias =
            await respuestas[1].json();

        sucursales.forEach(
            sucursal => {

                const opcion =
                    document.createElement(
                        'option'
                    );

                opcion.value =
                    sucursal.id_sucursal;

                opcion.textContent =
                    sucursal.nombre;

                sucursalSelect
                    .appendChild(
                        opcion
                    );

            }
        );

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

            }
        );

        if (
            respuestas[2]
        ) {

            const usuarios =
                await respuestas[2].json();

            usuarios.forEach(
                usuario => {

                    const opcion =
                        document.createElement(
                            'option'
                        );

                    opcion.value =
                        usuario.id_usuario;

                    opcion.textContent =
                        usuario.nombre;

                    usuarioSelect
                        .appendChild(
                            opcion
                        );

                }
            );

        }

    } catch (error) {

        console.error(
            'Error al cargar filtros:',
            error
        );

        mostrarMensaje(
            'No se pudieron cargar los filtros del reporte.',
            'error'
        );

    }

}


// ==============================
// FILTROS RÁPIDOS
// ==============================

function aplicarPeriodoRapido(
    periodo
) {

    const hoy =
        new Date();

    if (
        periodo === 'todo'
    ) {

        desdeInput.value =
            '';

        hastaInput.value =
            '';

    } else if (
        periodo === 'hoy'
    ) {

        const fecha =
            fechaLocalISO(
                hoy
            );

        desdeInput.value =
            fecha;

        hastaInput.value =
            fecha;

    } else if (
        periodo === '7dias'
    ) {

        const desde =
            new Date(
                hoy
            );

        desde.setDate(
            hoy.getDate() - 6
        );

        desdeInput.value =
            fechaLocalISO(
                desde
            );

        hastaInput.value =
            fechaLocalISO(
                hoy
            );

    } else if (
        periodo === 'mes'
    ) {

        const primerDia =
            new Date(
                hoy.getFullYear(),
                hoy.getMonth(),
                1
            );

        desdeInput.value =
            fechaLocalISO(
                primerDia
            );

        hastaInput.value =
            fechaLocalISO(
                hoy
            );

    }

    cargarReporte();

}


document
    .querySelectorAll(
        '.filtro-rapido-reporte'
    )
    .forEach(
        boton => {

            boton.addEventListener(
                'click',
                () => {

                    aplicarPeriodoRapido(
                        boton.dataset.periodo
                    );

                }
            );

        }
    );


// ==============================
// CARGAR REPORTE
// ==============================

async function cargarReporte() {

    try {

        mostrarMensaje(
            ''
        );

        if (
            desdeInput.value &&
            hastaInput.value &&
            desdeInput.value >
                hastaInput.value
        ) {

            mostrarMensaje(
                'La fecha inicial no puede ser posterior a la fecha final.',
                'error'
            );

            return;

        }

        const parametros =
            new URLSearchParams();

        if (
            desdeInput.value
        ) {

            parametros.append(
                'desde',
                desdeInput.value
            );

        }

        if (
            hastaInput.value
        ) {

            parametros.append(
                'hasta',
                hastaInput.value
            );

        }

        if (
            sucursalSelect.value
        ) {

            parametros.append(
                'id_sucursal',
                sucursalSelect.value
            );

        }

        if (
            categoriaSelect.value
        ) {

            parametros.append(
                'id_categoria',
                categoriaSelect.value
            );

        }

        if (
            usuarioActual &&
            usuarioActual.rol ===
                'administrador' &&
            usuarioSelect.value
        ) {

            parametros.append(
                'id_usuario',
                usuarioSelect.value
            );

        }

        const url =
            parametros.toString()
                ? (
                    '/api/reportes?' +
                    parametros.toString()
                )
                : '/api/reportes';

        const respuesta =
            await fetch(
                url,
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

        const datos =
            await respuesta.json();

        if (!respuesta.ok) {

            mostrarMensaje(
                datos.mensaje ||
                    'Error al generar reporte.',
                'error'
            );

            return;

        }

        datosReporteActual =
            datos;

        mostrarResumen(
            datos.resumen
        );

        mostrarGraficos(
            datos
        );

        mostrarDetalle(
            datos.detalle
        );

        mostrarStockCritico(
            datos.stockCritico
        );

    } catch (error) {

        console.error(
            'Error al generar reporte:',
            error
        );

        mostrarMensaje(
            'Error al generar reporte.',
            'error'
        );

    }

}


// ==============================
// RESUMEN
// ==============================

function mostrarResumen(
    resumen
) {

    document
        .getElementById(
            'reporteTotal'
        )
        .textContent =
            formatearDinero(
                resumen.total
            );

    document
        .getElementById(
            'reporteVentas'
        )
        .textContent =
            resumen.cantidadVentas;

    document
        .getElementById(
            'reporteUnidades'
        )
        .textContent =
            resumen.unidades;

    document
        .getElementById(
            'reporteTicket'
        )
        .textContent =
            formatearDinero(
                resumen.ticketPromedio
            );

    document
        .getElementById(
            'reporteStockCritico'
        )
        .textContent =
            resumen.cantidadStockCritico;

}


// ==============================
// GRÁFICOS
// ==============================

function mostrarGraficos(
    datos
) {

    if (
        graficoDias
    ) {

        graficoDias.destroy();

    }

    if (
        graficoProductos
    ) {

        graficoProductos.destroy();

    }

    const fechas =
        datos.ventasPorDia.map(
            item => {

                const fechaTexto =
                    String(
                        item.fecha
                    ).slice(0, 10);

                const [
                    anio,
                    mes,
                    dia
                ] =
                    fechaTexto.split(
                        '-'
                    );

                return (
                    dia +
                    '/' +
                    mes
                );

            }
        );

    graficoDias =
        new Chart(
            document.getElementById(
                'graficoReporteDias'
            ),
            {
                type: 'line',
                data: {
                    labels:
                        fechas,
                    datasets: [
                        {
                            label:
                                'Ventas',
                            data:
                                datos.ventasPorDia.map(
                                    item =>
                                        Number(
                                            item.total
                                        )
                                )
                        }
                    ]
                },
                options: {
                    responsive:
                        true,
                    plugins: {
                        legend: {
                            display:
                                false
                        }
                    }
                }
            }
        );

    graficoProductos =
        new Chart(
            document.getElementById(
                'graficoReporteProductos'
            ),
            {
                type: 'bar',
                data: {
                    labels:
                        datos.productosMasVendidos.map(
                            item =>
                                item.producto
                        ),
                    datasets: [
                        {
                            label:
                                'Unidades vendidas',
                            data:
                                datos.productosMasVendidos.map(
                                    item =>
                                        Number(
                                            item.cantidad
                                        )
                                )
                        }
                    ]
                },
                options: {
                    responsive:
                        true,
                    plugins: {
                        legend: {
                            display:
                                false
                        }
                    }
                }
            }
        );

}


// ==============================
// DETALLE DE VENTAS
// ==============================

function mostrarDetalle(
    detalles
) {

    tabla.innerHTML =
        '';

    contadorDetalleReporte
        .textContent =
            detalles.length === 1
                ? '1 registro'
                : (
                    detalles.length +
                    ' registros'
                );

    if (
        detalles.length === 0
    ) {

        tabla.innerHTML =
            '<tr>' +
                '<td colspan="11" class="sin-resultados">' +
                    'No existen ventas para los filtros seleccionados.' +
                '</td>' +
            '</tr>';

        return;

    }

    detalles.forEach(
        detalle => {

            const fila =
                document.createElement(
                    'tr'
                );

            const fecha =
                new Date(
                    detalle.fecha
                ).toLocaleString(
                    'es-CL'
                );

            fila.innerHTML =
                '<td>' +
                    escaparHtml(
                        fecha
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        detalle.cliente
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        detalle.sucursal
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        detalle.vendedor
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        detalle.canal ||
                        '-'
                    ) +
                '</td>' +
                '<td>' +
                    escaparHtml(
                        detalle.categoria
                    ) +
                '</td>' +
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
                '<td><strong>' +
                    formatearDinero(
                        detalle.subtotal
                    ) +
                '</strong></td>';

            tabla.appendChild(
                fila
            );

        }
    );

}


// ==============================
// STOCK CRÍTICO
// ==============================

function mostrarStockCritico(
    registros
) {

    tablaStockCritico.innerHTML =
        '';

    if (
        registros.length === 0
    ) {

        tablaStockCritico.innerHTML =
            '<tr>' +
                '<td colspan="6" class="sin-resultados">' +
                    'No hay variantes con stock crítico para los filtros seleccionados.' +
                '</td>' +
            '</tr>';

        return;

    }

    registros.forEach(
        item => {

            const fila =
                document.createElement(
                    'tr'
                );

            fila.classList.add(
                Number(
                    item.stock_actual
                ) === 0
                    ? 'fila-sin-stock'
                    : 'fila-stock-bajo'
            );

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
                '<td><strong>' +
                    escaparHtml(
                        item.stock_actual
                    ) +
                '</strong></td>' +
                '<td>' +
                    escaparHtml(
                        item.stock_minimo
                    ) +
                '</td>';

            tablaStockCritico
                .appendChild(
                    fila
                );

        }
    );

}


// ==============================
// TEXTO DE FILTROS
// ==============================

function obtenerTextoFiltros() {

    const desde =
        desdeInput.value ||
        'Inicio';

    const hasta =
        hastaInput.value ||
        'Actualidad';

    const sucursal =
        sucursalSelect.options[
            sucursalSelect.selectedIndex
        ].text;

    const categoria =
        categoriaSelect.options[
            categoriaSelect.selectedIndex
        ].text;

    const usuario =
        usuarioActual &&
        usuarioActual.rol ===
            'administrador'
            ? usuarioSelect.options[
                usuarioSelect.selectedIndex
            ].text
            : usuarioActual.nombre;

    return (
        'Periodo: ' +
        desde +
        ' a ' +
        hasta +
        ' | Sucursal: ' +
        sucursal +
        ' | Categoria: ' +
        categoria +
        ' | Registrado por: ' +
        usuario
    );

}


// ==============================
// FORMULARIO
// ==============================

formulario.addEventListener(
    'submit',
    event => {

        event.preventDefault();

        cargarReporte();

    }
);


limpiarFiltros.addEventListener(
    'click',
    () => {

        formulario.reset();

        mostrarMensaje(
            ''
        );

        cargarReporte();

    }
);


// ==============================
// EXPORTAR EXCEL
// ==============================

exportarExcel.addEventListener(
    'click',
    () => {

        if (
            !datosReporteActual ||
            (
                datosReporteActual.detalle.length === 0 &&
                datosReporteActual.stockCritico.length === 0
            )
        ) {

            mostrarMensaje(
                'No existen datos para exportar.',
                'error'
            );

            return;

        }

        const resumen = [
            {
                Indicador:
                    'Total vendido',
                Valor:
                    datosReporteActual.resumen.total
            },
            {
                Indicador:
                    'Cantidad de ventas',
                Valor:
                    datosReporteActual.resumen.cantidadVentas
            },
            {
                Indicador:
                    'Unidades vendidas',
                Valor:
                    datosReporteActual.resumen.unidades
            },
            {
                Indicador:
                    'Ticket promedio',
                Valor:
                    datosReporteActual.resumen.ticketPromedio
            },
            {
                Indicador:
                    'Stock crítico',
                Valor:
                    datosReporteActual.resumen.cantidadStockCritico
            }
        ];

        const detalle =
            datosReporteActual.detalle.map(
                item => ({
                    Venta:
                        item.id_venta,
                    Fecha:
                        new Date(
                            item.fecha
                        ).toLocaleString(
                            'es-CL'
                        ),
                    Cliente:
                        item.cliente,
                    Sucursal:
                        item.sucursal,
                    Registrado_por:
                        item.vendedor,
                    Canal:
                        item.canal,
                    Categoria:
                        item.categoria,
                    Producto:
                        item.producto,
                    Color:
                        item.color,
                    Talla:
                        item.talla,
                    Cantidad:
                        Number(
                            item.cantidad
                        ),
                    Precio:
                        Number(
                            item.precio_unitario
                        ),
                    Subtotal:
                        Number(
                            item.subtotal
                        )
                })
            );

        const stock =
            datosReporteActual.stockCritico.map(
                item => ({
                    Producto:
                        item.producto,
                    Color:
                        item.color,
                    Talla:
                        item.talla,
                    Sucursal:
                        item.sucursal,
                    Stock_actual:
                        Number(
                            item.stock_actual
                        ),
                    Stock_minimo:
                        Number(
                            item.stock_minimo
                        )
                })
            );

        const libro =
            XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            libro,
            XLSX.utils.json_to_sheet(
                resumen
            ),
            'Resumen'
        );

        XLSX.utils.book_append_sheet(
            libro,
            XLSX.utils.json_to_sheet(
                detalle
            ),
            'Ventas'
        );

        XLSX.utils.book_append_sheet(
            libro,
            XLSX.utils.json_to_sheet(
                stock
            ),
            'Stock critico'
        );

        XLSX.writeFile(
            libro,
            'Reporte_Bigcurvas_' +
                obtenerFechaArchivo() +
                '.xlsx'
        );

    }
);


// ==============================
// EXPORTAR PDF
// ==============================

exportarPdf.addEventListener(
    'click',
    () => {

        if (
            !datosReporteActual ||
            (
                datosReporteActual.detalle.length === 0 &&
                datosReporteActual.stockCritico.length === 0
            )
        ) {

            mostrarMensaje(
                'No existen datos para exportar.',
                'error'
            );

            return;

        }

        const {
            jsPDF
        } = window.jspdf;

        const documento =
            new jsPDF({
                orientation:
                    'landscape',
                unit:
                    'mm',
                format:
                    'a4'
            });

        documento.setFontSize(
            18
        );

        documento.text(
            'Reporte de ventas - Bigcurvas',
            14,
            15
        );

        documento.setFontSize(
            9
        );

        documento.text(
            obtenerTextoFiltros(),
            14,
            23
        );

        documento.text(
            'Total vendido: ' +
                formatearDinero(
                    datosReporteActual.resumen.total
                ),
            14,
            31
        );

        documento.text(
            'Ventas: ' +
                datosReporteActual.resumen.cantidadVentas,
            80,
            31
        );

        documento.text(
            'Unidades: ' +
                datosReporteActual.resumen.unidades,
            120,
            31
        );

        documento.text(
            'Ticket promedio: ' +
                formatearDinero(
                    datosReporteActual.resumen.ticketPromedio
                ),
            165,
            31
        );

        documento.text(
            'Stock critico: ' +
                datosReporteActual.resumen.cantidadStockCritico,
            240,
            31
        );

        const filasVentas =
            datosReporteActual.detalle.map(
                item => [
                    formatearFechaPdf(
                        item.fecha
                    ),
                    item.cliente,
                    item.sucursal,
                    item.vendedor,
                    item.canal,
                    item.categoria,
                    item.producto,
                    item.color,
                    item.talla,
                    item.cantidad,
                    formatearDinero(
                        item.subtotal
                    )
                ]
            );

        documento.autoTable({
            startY:
                38,
            head: [[
                'Fecha',
                'Cliente',
                'Sucursal',
                'Registrado por',
                'Canal',
                'Categoria',
                'Producto',
                'Color',
                'Talla',
                'Cant.',
                'Subtotal'
            ]],
            body:
                filasVentas,
            styles: {
                fontSize:
                    7
            },
            headStyles: {
                fontSize:
                    7
            },
            margin: {
                left:
                    8,
                right:
                    8
            }
        });

        const inicioStock =
            documento.lastAutoTable
                ? documento.lastAutoTable.finalY + 10
                : 45;

        documento.setFontSize(
            12
        );

        documento.text(
            'Stock critico',
            14,
            inicioStock
        );

        const filasStock =
            datosReporteActual.stockCritico.map(
                item => [
                    item.producto,
                    item.color,
                    item.talla,
                    item.sucursal,
                    item.stock_actual,
                    item.stock_minimo
                ]
            );

        documento.autoTable({
            startY:
                inicioStock + 4,
            head: [[
                'Producto',
                'Color',
                'Talla',
                'Sucursal',
                'Stock actual',
                'Stock minimo'
            ]],
            body:
                filasStock,
            styles: {
                fontSize:
                    8
            },
            margin: {
                left:
                    10,
                right:
                    10
            }
        });

        documento.save(
            'Reporte_Bigcurvas_' +
                obtenerFechaArchivo() +
                '.pdf'
        );

    }
);


// ==============================
// INICIO
// ==============================

async function iniciar() {

    const autenticado =
        await cargarUsuarioActual();

    if (!autenticado) {

        return;

    }

    await cargarFiltros();

    await cargarReporte();

}


iniciar();
