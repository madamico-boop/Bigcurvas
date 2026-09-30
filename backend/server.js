const express = require('express');
const path = require('path');

const app = express();

const PORT = 3000;


// Permite recibir datos JSON desde el frontend
app.use(express.json());


// Permite usar los archivos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));


// Inventario temporal
const inventario = [
    {
        id: 1,
        producto: 'Polera Oversize Negra',
        talla: 'XL',
        sucursal: 'Rancagua',
        stock: 15
    },
    {
        id: 2,
        producto: 'Jeans Wide Leg',
        talla: '2XL',
        sucursal: 'Bodega',
        stock: 5
    },
    {
        id: 3,
        producto: 'Blusa Casual',
        talla: '3XL',
        sucursal: 'Rancagua',
        stock: 9
    }
];


// Página principal
app.get('/', (req, res) => {

    res.sendFile(
        path.join(__dirname, '../frontend/index.html')
    );

});


// Ruta para obtener el inventario
app.get('/api/inventario', (req, res) => {

    res.json(inventario);

});


// Ruta para registrar una venta
app.post('/api/ventas', (req, res) => {

    const venta = req.body;

    const productoEncontrado = inventario.find(item =>
        item.producto === venta.producto &&
        item.talla === venta.talla &&
        item.sucursal === venta.sucursal
    );

    if (!productoEncontrado) {
        return res.status(404).json({
            mensaje: 'Producto no encontrado en inventario'
        });
    }

    if (productoEncontrado.stock < venta.cantidad) {
        return res.status(400).json({
            mensaje: 'Stock insuficiente'
        });
    }

    productoEncontrado.stock -= venta.cantidad;

    console.log('Venta registrada:');
    console.log(venta);

    console.log('Stock actualizado:');
    console.log(productoEncontrado);

    res.json({
    mensaje: 'Venta registrada correctamente',
    stockActual: productoEncontrado.stock
});

});


// Inicia el servidor
app.listen(PORT, () => {

    console.log(
        `Servidor ejecutándose en http://localhost:${PORT}`
    );

});