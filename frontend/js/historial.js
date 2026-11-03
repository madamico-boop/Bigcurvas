const tablaVentas =
    document.getElementById('tablaVentas');

const detalleVentaSection =
    document.getElementById('detalleVentaSection');

const tablaDetalleVenta =
    document.getElementById('tablaDetalleVenta');


async function cargarVentas() {

    try {

        const respuesta =
            await fetch('/api/ventas');

        const ventas =
            await respuesta.json();

        tablaVentas.innerHTML = '';


        ventas.forEach(venta => {

            const fila =
                document.createElement('tr');


            const fecha =
                new Date(venta.fecha)
                    .toLocaleString('es-CL');


            const total =
                Number(venta.total)
                    .toLocaleString('es-CL');


            fila.innerHTML = `
                <td>${fecha}</td>

                <td>
                    ${venta.cliente || 'Sin cliente'}
                </td>

                <td>
                    ${venta.sucursal}
                </td>

                <td>
                    ${venta.canal}
                </td>

                <td>
                    ${venta.estado_pago || '-'}
                </td>

                <td>
                    $${total}
                </td>

                <td>
                    <button class="boton-detalle">
                        Ver detalle
                    </button>
                </td>
            `;


            tablaVentas.appendChild(fila);


            const botonDetalle =
                fila.querySelector('.boton-detalle');


            botonDetalle.addEventListener(
                'click',
                () => {

                    cargarDetalleVenta(
                        venta.id_venta
                    );

                }
            );

        });

    } catch (error) {

        console.error(
            'Error al cargar historial:',
            error
        );

    }

}


async function cargarDetalleVenta(idVenta) {

    try {

        const respuesta =
            await fetch(
                `/api/ventas/${idVenta}/detalle`
            );

        const detalles =
            await respuesta.json();


        tablaDetalleVenta.innerHTML = '';


        detalles.forEach(detalle => {

            const fila =
                document.createElement('tr');


            const precio =
                Number(detalle.precio_unitario)
                    .toLocaleString('es-CL');


            const subtotal =
                Number(detalle.subtotal)
                    .toLocaleString('es-CL');


            fila.innerHTML = `
                <td>${detalle.producto}</td>
                <td>${detalle.color}</td>
                <td>${detalle.talla}</td>
                <td>${detalle.cantidad}</td>
                <td>$${precio}</td>
                <td>$${subtotal}</td>
            `;


            tablaDetalleVenta.appendChild(fila);

        });


        detalleVentaSection.hidden = false;


        detalleVentaSection.scrollIntoView({
            behavior: 'smooth'
        });

    } catch (error) {

        console.error(
            'Error al cargar detalle:',
            error
        );

    }

}


cargarVentas();