async function cargarDashboard() {

    try {

        const respuesta =
            await fetch(
                '/api/dashboard',
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

            console.error(
                datos.mensaje
            );

            return;

        }


        document.getElementById(
            'bienvenidaDashboard'
        ).textContent =
            `Bienvenido/a, ${datos.nombre}`;


        if (
            datos.rol ===
            'vendedora'
        ) {

            mostrarDashboardVendedora(
                datos
            );

        } else {

            mostrarDashboardAdmin(
                datos
            );

        }


    } catch (error) {

        console.error(
            'Error al cargar dashboard:',
            error
        );

    }

}


// =====================================
// ADMINISTRADOR
// =====================================

function mostrarDashboardAdmin(datos) {

    document.getElementById(
        'dashboardAdmin'
    ).hidden = false;


    document.getElementById(
        'dashboardVendedora'
    ).hidden = true;


    document.getElementById(
        'ventasHoy'
    ).textContent =
        formatearDinero(
            datos.ventasHoy
        );


    document.getElementById(
        'ventasMes'
    ).textContent =
        formatearDinero(
            datos.ventasMes
        );


    document.getElementById(
        'stockTotal'
    ).textContent =
        datos.stockTotal;


    document.getElementById(
        'stockBajo'
    ).textContent =
        datos.stockBajo;


    // ============================
    // VENTAS 7 DÍAS
    // ============================

    const fechas =
        datos.ventas7Dias.map(
            item => {

                const fechaTexto =
                    String(
                        item.fecha
                    ).slice(
                        0,
                        10
                    );

                const [
                    anio,
                    mes,
                    dia
                ] =
                    fechaTexto.split(
                        '-'
                    );

                return `${dia}/${mes}`;

            }
        );


    new Chart(

        document.getElementById(
            'graficoVentasDias'
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
                        datos.ventas7Dias.map(
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


    // ============================
    // SUCURSALES
    // ============================

    new Chart(

        document.getElementById(
            'graficoSucursales'
        ),

        {

            type: 'bar',

            data: {

                labels:
                    datos.ventasSucursal.map(
                        item =>
                            item.sucursal
                    ),

                datasets: [{

                    label:
                        'Ventas del mes',

                    data:
                        datos.ventasSucursal.map(
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


    // ============================
    // PRODUCTOS
    // ============================

    new Chart(

        document.getElementById(
            'graficoProductos'
        ),

        {

            type: 'bar',

            data: {

                labels:
                    datos
                        .productosMasVendidos
                        .map(
                            item =>
                                item.producto
                        ),

                datasets: [{

                    label:
                        'Unidades vendidas',

                    data:
                        datos
                            .productosMasVendidos
                            .map(
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


// =====================================
// VENDEDORA
// =====================================

function mostrarDashboardVendedora(datos) {

    document.getElementById(
        'dashboardAdmin'
    ).hidden = true;


    document.getElementById(
        'dashboardVendedora'
    ).hidden = false;


    document.getElementById(
        'ventasHoyVendedora'
    ).textContent =
        formatearDinero(
            datos.ventasHoy
        );


    document.getElementById(
        'cantidadVentasVendedora'
    ).textContent =
        datos.cantidadVentasHoy;


    document.getElementById(
        'stockBajoVendedora'
    ).textContent =
        datos.stockBajo;


    const tabla =
        document.getElementById(
            'ultimasVentasVendedora'
        );


    tabla.innerHTML = '';


    if (
        datos.ultimasVentas.length === 0
    ) {

        tabla.innerHTML = `
            <tr>
                <td colspan="4">
                    Aún no hay ventas registradas
                </td>
            </tr>
        `;

        return;

    }


    datos.ultimasVentas.forEach(
        venta => {

            const fila =
                document.createElement(
                    'tr'
                );


            fila.innerHTML = `

                <td>
                    ${new Date(
                        venta.fecha
                    ).toLocaleString(
                        'es-CL'
                    )}
                </td>

                <td>
                    ${venta.cliente ||
                      'Sin cliente'}
                </td>

                <td>
                    ${venta.sucursal}
                </td>

                <td>
                    ${formatearDinero(
                        venta.total
                    )}
                </td>

            `;


            tabla.appendChild(
                fila
            );

        }
    );

}


// =====================================
// DINERO
// =====================================

function formatearDinero(valor) {

    return Number(
        valor
    ).toLocaleString(
        'es-CL',
        {
            style:
                'currency',

            currency:
                'CLP',

            maximumFractionDigits:
                0
        }
    );

}


cargarDashboard();