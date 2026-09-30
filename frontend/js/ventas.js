const formulario = document.getElementById('ventaForm');
const mensaje = document.getElementById('mensajeVenta');

formulario.addEventListener('submit', async (event) => {

    event.preventDefault();

    const venta = {
        producto: document.getElementById('producto').value,
        talla: document.getElementById('talla').value,
        sucursal: document.getElementById('sucursal').value,
        cantidad: Number(
            document.getElementById('cantidad').value
        )
    };

    const respuesta = await fetch('/api/ventas', {
        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify(venta)
    });

    const resultado = await respuesta.json();

    if (respuesta.ok) {

        mensaje.textContent =
            `${resultado.mensaje}. Stock restante: ${resultado.stockActual}`;

    } else {

        mensaje.textContent = resultado.mensaje;

    }

});