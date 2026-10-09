async function cargarDashboard() {

    try {

        const respuesta = await fetch('/api/dashboard');

        const datos = await respuesta.json();

        document.getElementById('ventasHoy').textContent =
            `$${datos.ventasHoy.toLocaleString('es-CL')}`;

        document.getElementById('stockTotal').textContent =
            datos.stockTotal;

        document.getElementById('stockBajo').textContent =
            datos.stockBajo;

        document.getElementById('ventasRegistradas').textContent =
            datos.ventasRegistradas;

    } catch (error) {

        console.error(
            'Error al cargar dashboard:',
            error
        );

    }

}

cargarDashboard();