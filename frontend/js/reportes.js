const formulario =
    document.getElementById(
        'filtrosReporte'
    );

const desdeInput =
    document.getElementById(
        'desde'
    );

const hastaInput =
    document.getElementById(
        'hasta'
    );

const sucursalSelect =
    document.getElementById(
        'sucursalReporte'
    );

const categoriaSelect =
    document.getElementById(
        'categoriaReporte'
    );

const limpiarFiltros =
    document.getElementById(
        'limpiarFiltros'
    );

const mensaje =
    document.getElementById(
        'mensajeReporte'
    );

const tabla =
    document.getElementById(
        'tablaReporte'
    );

const exportarExcel =
    document.getElementById(
        'exportarExcel'
    );

const exportarPdf =
    document.getElementById(
        'exportarPdf'
    );


let graficoDias = null;

let graficoProductos = null;

let datosReporteActual = null;


// ==============================
// DINERO
// ==============================

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


// ==============================
// CARGAR FILTROS
// ==============================

async function cargarFiltros() {

    try {

        const [
            respuestaSucursales,
            respuestaCategorias
        ] = await Promise.all([

            fetch('/api/sucursales'),

            fetch('/api/categorias')

        ]);


        const sucursales =
            await respuestaSucursales.json();

        const categorias =
            await respuestaCategorias.json();


        sucursales.forEach(sucursal => {

            const opcion =
                document.createElement(
                    'option'
                );

            opcion.value =
                sucursal.id_sucursal;

            opcion.textContent =
                sucursal.nombre;

            sucursalSelect.appendChild(
                opcion
            );

        });


        categorias.forEach(categoria => {

            const opcion =
                document.createElement(
                    'option'
                );

            opcion.value =
                categoria.id_categoria;

            opcion.textContent =
                categoria.nombre;

            categoriaSelect.appendChild(
                opcion
            );

        });


    } catch (error) {

        console.error(
            'Error al cargar filtros:',
            error
        );

    }

}


// ==============================
// CARGAR REPORTE
// ==============================

async function cargarReporte() {

    try {

        mensaje.textContent = '';


        if (
            desdeInput.value &&
            hastaInput.value &&
            desdeInput.value >
                hastaInput.value
        ) {

            mensaje.textContent =
                'La fecha inicial no puede ser posterior a la fecha final';

            return;

        }


        const parametros =
            new URLSearchParams();


        if (desdeInput.value) {

            parametros.append(
                'desde',
                desdeInput.value
            );

        }


        if (hastaInput.value) {

            parametros.append(
                'hasta',
                hastaInput.value
            );

        }


        if (sucursalSelect.value) {

            parametros.append(
                'id_sucursal',
                sucursalSelect.value
            );

        }


        if (categoriaSelect.value) {

            parametros.append(
                'id_categoria',
                categoriaSelect.value
            );

        }


        const url =
            parametros.toString()
                ? `/api/reportes?${parametros}`
                : '/api/reportes';


        const respuesta =
            await fetch(url);


        const datos =
            await respuesta.json();


        if (!respuesta.ok) {

            mensaje.textContent =
                datos.mensaje ||
                'Error al generar reporte';

            return;

        }

        datosReporteActual = datos;


        mostrarResumen(
            datos.resumen
        );


        mostrarGraficos(
            datos
        );


        mostrarDetalle(
            datos.detalle
        );


    } catch (error) {

        console.error(
            'Error:',
            error
        );

        mensaje.textContent =
            'Error al generar reporte';

    }

}


// ==============================
// RESUMEN
// ==============================

function mostrarResumen(resumen) {

    document.getElementById(
        'reporteTotal'
    ).textContent =
        formatearDinero(
            resumen.total
        );


    document.getElementById(
        'reporteVentas'
    ).textContent =
        resumen.cantidadVentas;


    document.getElementById(
        'reporteUnidades'
    ).textContent =
        resumen.unidades;


    document.getElementById(
        'reporteTicket'
    ).textContent =
        formatearDinero(
            resumen.ticketPromedio
        );

}


// ==============================
// GRÁFICOS
// ==============================

function mostrarGraficos(datos) {

    if (graficoDias) {

        graficoDias.destroy();

    }


    if (graficoProductos) {

        graficoProductos.destroy();

    }


    const fechas =
        datos.ventasPorDia.map(item => {

            const fechaTexto =
                String(
                    item.fecha
                ).slice(0, 10);

            const [
                anio,
                mes,
                dia
            ] =
                fechaTexto.split('-');

            return `${dia}/${mes}`;

        });


    graficoDias = new Chart(

        document.getElementById(
            'graficoReporteDias'
        ),

        {

            type: 'line',

            data: {

                labels:
                    fechas,

                datasets: [{

                    label:
                        'Ventas',

                    data:
                        datos.ventasPorDia.map(
                            item =>
                                Number(
                                    item.total
                                )
                        )

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        display: false
                    }

                }

            }

        }

    );


    graficoProductos = new Chart(

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

                datasets: [{

                    label:
                        'Unidades vendidas',

                    data:
                        datos.productosMasVendidos.map(
                            item =>
                                Number(
                                    item.cantidad
                                )
                        )

                }]

            },

            options: {

                responsive: true,

                plugins: {

                    legend: {
                        display: false
                    }

                }

            }

        }

    );

}


// ==============================
// DETALLE
// ==============================

function mostrarDetalle(detalles) {

    tabla.innerHTML = '';


    if (detalles.length === 0) {

        tabla.innerHTML = `
            <tr>

                <td colspan="9">
                    No existen ventas para los filtros seleccionados
                </td>

            </tr>
        `;

        return;

    }


    detalles.forEach(detalle => {

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


        fila.innerHTML = `

            <td>
                ${fecha}
            </td>

            <td>
                ${detalle.cliente}
            </td>

            <td>
                ${detalle.sucursal}
            </td>

            <td>
                ${detalle.categoria}
            </td>

            <td>
                ${detalle.producto}
            </td>

            <td>
                ${detalle.color}
            </td>

            <td>
                ${detalle.talla}
            </td>

            <td>
                ${detalle.cantidad}
            </td>

            <td>
                ${formatearDinero(
                    detalle.subtotal
                )}
            </td>

        `;


        tabla.appendChild(
            fila
        );

    });

}

function obtenerFechaArchivo() {

    const fecha =
        new Date();

    const anio =
        fecha.getFullYear();

    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            '0'
        );

    const dia =
        String(
            fecha.getDate()
        ).padStart(
            2,
            '0'
        );


    return `${anio}-${mes}-${dia}`;

}


function formatearFechaPdf(fecha) {

    return new Date(
        fecha
    ).toLocaleDateString(
        'es-CL'
    );

}


function obtenerTextoFiltros() {

    const desde =
        desdeInput.value ||
        'Inicio';

    const hasta =
        hastaInput.value ||
        'Actualidad';


    const sucursal =
        sucursalSelect
            .options[
                sucursalSelect.selectedIndex
            ]
            .text;


    const categoria =
        categoriaSelect
            .options[
                categoriaSelect.selectedIndex
            ]
            .text;


    return (
        `Periodo: ${desde} a ${hasta} | ` +
        `Sucursal: ${sucursal} | ` +
        `Categoria: ${categoria}`
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


// ==============================
// LIMPIAR
// ==============================

limpiarFiltros.addEventListener(
    'click',
    () => {

        formulario.reset();

        mensaje.textContent = '';

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
            datosReporteActual.detalle.length === 0
        ) {

            mensaje.textContent =
                'No existen datos para exportar';

            return;

        }


        const resumen = [
            {
                Indicador:
                    'Total vendido',

                Valor:
                    datosReporteActual
                        .resumen
                        .total
            },

            {
                Indicador:
                    'Cantidad de ventas',

                Valor:
                    datosReporteActual
                        .resumen
                        .cantidadVentas
            },

            {
                Indicador:
                    'Unidades vendidas',

                Valor:
                    datosReporteActual
                        .resumen
                        .unidades
            },

            {
                Indicador:
                    'Ticket promedio',

                Valor:
                    datosReporteActual
                        .resumen
                        .ticketPromedio
            }
        ];


        const detalle =
            datosReporteActual
                .detalle
                .map(item => ({

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

                }));


        const libro =
            XLSX.utils.book_new();


        const hojaResumen =
            XLSX.utils.json_to_sheet(
                resumen
            );


        const hojaDetalle =
            XLSX.utils.json_to_sheet(
                detalle
            );


        XLSX.utils.book_append_sheet(
            libro,
            hojaResumen,
            'Resumen'
        );


        XLSX.utils.book_append_sheet(
            libro,
            hojaDetalle,
            'Ventas'
        );


        XLSX.writeFile(
            libro,
            `Reporte_Bigcurvas_${obtenerFechaArchivo()}.xlsx`
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
            datosReporteActual.detalle.length === 0
        ) {

            mensaje.textContent =
                'No existen datos para exportar';

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


        documento.setFontSize(18);

        documento.text(
            'Reporte de ventas - Bigcurvas',
            14,
            15
        );


        documento.setFontSize(10);


        const filtros =
            obtenerTextoFiltros();


        documento.text(
            filtros,
            14,
            23
        );


        documento.text(
            `Total vendido: ${formatearDinero(
                datosReporteActual
                    .resumen
                    .total
            )}`,
            14,
            31
        );


        documento.text(
            `Ventas: ${
                datosReporteActual
                    .resumen
                    .cantidadVentas
            }`,
            80,
            31
        );


        documento.text(
            `Unidades: ${
                datosReporteActual
                    .resumen
                    .unidades
            }`,
            120,
            31
        );


        documento.text(
            `Ticket promedio: ${formatearDinero(
                datosReporteActual
                    .resumen
                    .ticketPromedio
            )}`,
            165,
            31
        );


        const filas =
            datosReporteActual
                .detalle
                .map(item => [

                    formatearFechaPdf(
                        item.fecha
                    ),

                    item.cliente,

                    item.sucursal,

                    item.categoria,

                    item.producto,

                    item.color,

                    item.talla,

                    item.cantidad,

                    formatearDinero(
                        item.subtotal
                    )

                ]);


        documento.autoTable({

            startY: 38,

            head: [[
                'Fecha',
                'Cliente',
                'Sucursal',
                'Categoria',
                'Producto',
                'Color',
                'Talla',
                'Cant.',
                'Subtotal'
            ]],

            body:
                filas,

            styles: {
                fontSize: 8
            },

            headStyles: {
                fontSize: 8
            },

            margin: {
                left: 10,
                right: 10
            }

        });


        documento.save(
            `Reporte_Bigcurvas_${obtenerFechaArchivo()}.pdf`
        );

    }
);


// ==============================
// INICIO
// ==============================

async function iniciar() {

    await cargarFiltros();

    await cargarReporte();

}


iniciar();