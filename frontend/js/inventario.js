const tablaInventario = document.getElementById('tablaInventario');

async function cargarInventario() {

    try {

        const respuesta = await fetch('/api/inventario');

        const inventario = await respuesta.json();

        tablaInventario.innerHTML = '';

        inventario.forEach(item => {

            let estado = 'Disponible';

            if (item.stock_actual === 0) {

                estado = 'Sin stock';

            } else if (
                item.stock_minimo !== null &&
                item.stock_actual <= item.stock_minimo
            ) {

                estado = 'Stock bajo';

            }

            const fila = document.createElement('tr');

            fila.innerHTML = `
                <td>${item.producto}</td>
                <td>${item.color}</td>
                <td>${item.talla}</td>
                <td>${item.sucursal}</td>
                <td>${item.stock_actual}</td>
                <td>
                    ${item.stock_minimo === null
                        ? '-'
                        : item.stock_minimo}
                </td>
                <td>${estado}</td>
            `;

            tablaInventario.appendChild(fila);

        });

    } catch (error) {

        console.error(error);

    }

}

cargarInventario();