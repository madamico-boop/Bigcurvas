require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./config/db');

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
app.get('/api/inventario', async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                i.id_inventario,
                p.nombre AS producto,
                v.color,
                v.talla,
                s.nombre AS sucursal,
                i.stock_actual,
                i.stock_minimo
            FROM inventario i
            JOIN variantes v
                ON i.id_variante = v.id_variante
            JOIN productos p
                ON v.id_producto = p.id_producto
            JOIN sucursales s
                ON i.id_sucursal = s.id_sucursal
            ORDER BY p.nombre, v.color, v.talla, s.nombre
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener el inventario'
        });

    }

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

app.get('/api/prueba-db', async (req, res) => {

    try {

        const resultado = await pool.query(
            'SELECT NOW() AS fecha'
        );

        res.json({
            mensaje: 'Conexión con PostgreSQL correcta',
            fecha: resultado.rows[0].fecha
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al conectar con PostgreSQL'
        });

    }

});

// Inicia el servidor
app.listen(PORT, () => {

    console.log(
        `Servidor ejecutándose en http://localhost:${PORT}`
    );

});