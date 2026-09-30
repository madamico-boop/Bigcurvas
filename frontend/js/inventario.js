const tablaInventario = document.getElementById('tablaInventario');

async function cargarInventario() {

    const respuesta = await fetch('/api/inventario');

    const inventario = await respuesta.json();

    tablaInventario.innerHTML = '';

    inventario.forEach(item => {

        let estado = 'Disponible';

        if (item.stock <= 5) {
            estado = 'Stock bajo';
        }

        const fila = document.createElement('tr');

        fila.innerHTML = `
            <td>${item.producto}</td>
            <td>${item.talla}</td>
            <td>${item.sucursal}</td>
            <td>${item.stock}</td>
            <td>${estado}</td>
        `;

        tablaInventario.appendChild(fila);

    });
}

cargarInventario();