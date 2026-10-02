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
app.post('/api/ventas', async (req, res) => {

    const {
        producto,
        color,
        talla,
        sucursal,
        cantidad
    } = req.body;

    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        // Buscar variante, stock, precio y sucursal
        const resultado = await client.query(`
            SELECT
                i.id_inventario,
                i.stock_actual,
                v.id_variante,
                p.precio,
                s.id_sucursal
            FROM inventario i
            JOIN variantes v
                ON i.id_variante = v.id_variante
            JOIN productos p
                ON v.id_producto = p.id_producto
            JOIN sucursales s
                ON i.id_sucursal = s.id_sucursal
            WHERE
                p.nombre = $1
                AND v.color = $2
                AND v.talla = $3
                AND s.nombre = $4
            FOR UPDATE
        `, [
            producto,
            color,
            talla,
            sucursal
        ]);

        if (resultado.rows.length === 0) {

            await client.query('ROLLBACK');

            return res.status(404).json({
                mensaje: 'Producto o variante no encontrada'
            });

        }

        const item = resultado.rows[0];

        if (item.stock_actual < cantidad) {

            await client.query('ROLLBACK');

            return res.status(400).json({
                mensaje: 'Stock insuficiente'
            });

        }

        const total = Number(item.precio) * cantidad;

        // Crear venta
        const ventaCreada = await client.query(`
            INSERT INTO ventas (
                id_usuario,
                id_sucursal,
                canal,
                estado_pago,
                total
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_venta
        `, [
            1,
            item.id_sucursal,
            'Local',
            'Pagado',
            total
        ]);

        const idVenta = ventaCreada.rows[0].id_venta;

        // Crear detalle
        await client.query(`
            INSERT INTO detalle_venta (
                id_venta,
                id_variante,
                cantidad,
                precio_unitario
            )
            VALUES ($1, $2, $3, $4)
        `, [
            idVenta,
            item.id_variante,
            cantidad,
            item.precio
        ]);

        // Descontar stock
        const stockActualizado = await client.query(`
            UPDATE inventario
            SET stock_actual = stock_actual - $1
            WHERE id_inventario = $2
            RETURNING stock_actual
        `, [
            cantidad,
            item.id_inventario
        ]);

        await client.query('COMMIT');

        res.json({
            mensaje: 'Venta registrada correctamente',
            stockActual: stockActualizado.rows[0].stock_actual,
            total: total
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al registrar la venta'
        });

    } finally {

        client.release();

    }

});


// Inicia el servidor
app.listen(PORT, () => {

    console.log(
        `Servidor ejecutándose en http://localhost:${PORT}`
    );

});