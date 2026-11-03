async function cargarDashboard() {

    try {

        const respuesta =
            await fetch('/api/dashboard');


        if (!respuesta.ok) {

            throw new Error(
                'No se pudo cargar el dashboard'
            );

        }


        const datos =
            await respuesta.json();


        // ============================
        // INDICADORES
        // ============================

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
        // VENTAS ÚLTIMOS 7 DÍAS
        // ============================

        const fechas =
    datos.ventas7Dias.map(item => {

        const fechaTexto =
            String(item.fecha).slice(0, 10);

        const [
            anio,
            mes,
            dia
        ] = fechaTexto.split('-');

        return `${dia}/${mes}`;

    });


        const ventasDias =
            datos.ventas7Dias.map(
                item =>
                    Number(item.total)
            );


        new Chart(
            document.getElementById(
                'graficoVentasDias'
            ),
            {

                type: 'line',

                data: {

                    labels: fechas,

                    datasets: [{

                        label: 'Ventas',

                        data:
                            ventasDias

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
        // PRODUCTOS MÁS VENDIDOS
        // ============================

        new Chart(
            document.getElementById(
                'graficoProductos'
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


    } catch (error) {

        console.error(
            'Error al cargar dashboard:',
            error
        );

    }

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


cargarDashboard();