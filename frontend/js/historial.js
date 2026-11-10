const tablaVentas =
    document.getElementById('tablaVentas');

const detalleVentaSection =
    document.getElementById('detalleVentaSection');

const tablaDetalleVenta =
    document.getElementById('tablaDetalleVenta');


// =====================================
// COMPROBAR SESIÓN
// =====================================

async function comprobarSesion() {

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
// CARGAR HISTORIAL DE VENTAS
// =====================================

async function cargarVentas() {

    try {

        const respuesta =
            await fetch(
                '/api/ventas',
                {
                    credentials: 'include'
                }
            );


        if (respuesta.status === 401) {

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


        tablaVentas.innerHTML =
            '';


        // Si todavía no existen ventas
        if (ventas.length === 0) {

            tablaVentas.innerHTML = `
                <tr>
                    <td colspan="7">
                        No hay ventas registradas.
                    </td>
                </tr>
            `;

            return;

        }


        ventas.forEach(
            venta => {

                const fila =
                    document.createElement(
                        'tr'
                    );


                const fecha =
                    new Date(
                        venta.fecha
                    ).toLocaleString(
                        'es-CL'
                    );


                const total =
                    Number(
                        venta.total
                    ).toLocaleString(
                        'es-CL'
                    );


                fila.innerHTML = `

                    <td>
                        ${fecha}
                    </td>

                    <td>
                        ${
                            venta.cliente ||
                            'Sin cliente'
                        }
                    </td>

                    <td>
                        ${venta.sucursal}
                    </td>

                    <td>
                        ${venta.canal}
                    </td>

                    <td>
                        ${
                            venta.estado_pago ||
                            '-'
                        }
                    </td>

                    <td>
                        $${total}
                    </td>

                    <td>

                        <button
                            class="boton-detalle"
                        >
                            Ver detalle
                        </button>

                    </td>

                `;


                tablaVentas
                    .appendChild(
                        fila
                    );


                const botonDetalle =
                    fila.querySelector(
                        '.boton-detalle'
                    );


                botonDetalle.addEventListener(
                    'click',
                    () => {

                        cargarDetalleVenta(
                            venta.id_venta
                        );

                    }
                );

            }
        );


    } catch (error) {

        console.error(
            'Error al cargar historial:',
            error
        );

    }

}


// =====================================
// CARGAR DETALLE DE UNA VENTA
// =====================================

async function cargarDetalleVenta(
    idVenta
) {

    try {

        const respuesta =
            await fetch(
                `/api/ventas/${idVenta}/detalle`,
                {
                    credentials: 'include'
                }
            );


        if (respuesta.status === 401) {

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


        detalles.forEach(
            detalle => {

                const fila =
                    document.createElement(
                        'tr'
                    );


                const precio =
                    Number(
                        detalle.precio_unitario
                    ).toLocaleString(
                        'es-CL'
                    );


                const subtotal =
                    Number(
                        detalle.subtotal
                    ).toLocaleString(
                        'es-CL'
                    );


                fila.innerHTML = `

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
                        $${precio}
                    </td>

                    <td>
                        $${subtotal}
                    </td>

                `;


                tablaDetalleVenta
                    .appendChild(
                        fila
                    );

            }
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