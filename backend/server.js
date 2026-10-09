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

app.get('/api/opciones-venta', async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                p.nombre AS producto,
                v.color,
                v.talla,
                s.nombre AS sucursal,
                i.stock_actual
            FROM inventario i
            JOIN variantes v
                ON i.id_variante = v.id_variante
            JOIN productos p
                ON v.id_producto = p.id_producto
            JOIN sucursales s
                ON i.id_sucursal = s.id_sucursal
            WHERE
                p.activo = TRUE
                AND s.activo = TRUE
                AND i.stock_actual > 0
            ORDER BY
                p.nombre,
                v.color,
                v.talla,
                s.nombre
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al cargar las opciones de venta'
        });

    }

});

app.get('/api/dashboard', async (req, res) => {

    try {

        const ventasHoy = await pool.query(`
            SELECT COALESCE(SUM(total), 0) AS total
            FROM ventas
            WHERE DATE(fecha) = CURRENT_DATE
        `);

        const stockTotal = await pool.query(`
            SELECT COALESCE(SUM(stock_actual), 0) AS total
            FROM inventario
        `);

        const stockBajo = await pool.query(`
            SELECT COUNT(*) AS total
            FROM inventario
            WHERE stock_minimo IS NOT NULL
            AND stock_actual <= stock_minimo
        `);

        const ventasRegistradas = await pool.query(`
            SELECT COUNT(*) AS total
            FROM ventas
        `);

        res.json({
            ventasHoy: Number(ventasHoy.rows[0].total),
            stockTotal: Number(stockTotal.rows[0].total),
            stockBajo: Number(stockBajo.rows[0].total),
            ventasRegistradas: Number(
                ventasRegistradas.rows[0].total
            )
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al cargar el dashboard'
        });

    }

});

app.get('/api/categorias', async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                id_categoria,
                nombre
            FROM categorias
            WHERE activo = TRUE
            ORDER BY nombre
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener categorías'
        });

    }

});

app.get('/api/productos', async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.id_categoria,
                p.precio,
                p.activo,
                c.nombre AS categoria
            FROM productos p
            JOIN categorias c
                ON p.id_categoria = c.id_categoria
            ORDER BY p.nombre
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener productos'
        });

    }

});

app.post('/api/productos', async (req, res) => {

    const {
        nombre,
        descripcion,
        id_categoria,
        precio
    } = req.body;

    try {

        if (!nombre || !id_categoria || precio === undefined) {

            return res.status(400).json({
                mensaje: 'Faltan datos obligatorios'
            });

        }

        if (Number(precio) < 0) {

            return res.status(400).json({
                mensaje: 'El precio no puede ser negativo'
            });

        }

        const resultado = await pool.query(`
            INSERT INTO productos (
                nombre,
                descripcion,
                id_categoria,
                precio
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [
            nombre,
            descripcion || null,
            id_categoria,
            precio
        ]);

        res.status(201).json({
            mensaje: 'Producto agregado correctamente',
            producto: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al agregar producto'
        });

    }

});

app.post('/api/variantes', async (req, res) => {

    const {
        id_producto,
        talla,
        color,
        sku,
        stock_rancagua,
        minimo_rancagua,
        stock_bodega,
        minimo_bodega
    } = req.body;

    if (!id_producto || !talla || !color) {
        return res.status(400).json({
            mensaje: 'Producto, talla y color son obligatorios'
        });
    }

    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        // Crear variante
        const varianteCreada = await client.query(`
            INSERT INTO variantes (
                id_producto,
                talla,
                color,
                sku
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id_variante
        `, [
            id_producto,
            talla,
            color,
            sku || null
        ]);

        const idVariante =
            varianteCreada.rows[0].id_variante;


        // Buscar las sucursales
        const sucursales = await client.query(`
            SELECT id_sucursal, nombre
            FROM sucursales
            WHERE activo = TRUE
        `);


        const rancagua = sucursales.rows.find(
            sucursal => sucursal.nombre === 'Rancagua'
        );

        const bodega = sucursales.rows.find(
            sucursal => sucursal.nombre === 'Bodega'
        );


        // Inventario Rancagua
        if (rancagua) {

            await client.query(`
                INSERT INTO inventario (
                    id_variante,
                    id_sucursal,
                    stock_actual,
                    stock_minimo
                )
                VALUES ($1, $2, $3, $4)
            `, [
                idVariante,
                rancagua.id_sucursal,
                Number(stock_rancagua) || 0,
                minimo_rancagua === '' ||
                minimo_rancagua === null ||
                minimo_rancagua === undefined
                    ? null
                    : Number(minimo_rancagua)
            ]);

        }


        // Inventario Bodega
        if (bodega) {

            await client.query(`
                INSERT INTO inventario (
                    id_variante,
                    id_sucursal,
                    stock_actual,
                    stock_minimo
                )
                VALUES ($1, $2, $3, $4)
            `, [
                idVariante,
                bodega.id_sucursal,
                Number(stock_bodega) || 0,
                minimo_bodega === '' ||
                minimo_bodega === null ||
                minimo_bodega === undefined
                    ? null
                    : Number(minimo_bodega)
            ]);

        }


        await client.query('COMMIT');

        res.status(201).json({
            mensaje: 'Variante agregada correctamente'
        });

    } catch (error) {

        await client.query('ROLLBACK');

        console.error(error);

        if (error.code === '23505') {

            return res.status(400).json({
                mensaje:
                    'Esta variante o SKU ya está registrado'
            });

        }

        res.status(500).json({
            mensaje: 'Error al agregar variante'
        });

    } finally {

        client.release();

    }

});

app.patch('/api/productos/:id/estado', async (req, res) => {

    const idProducto = Number(req.params.id);
    const { activo } = req.body;

    try {

        const resultado = await pool.query(`
            UPDATE productos
            SET activo = $1
            WHERE id_producto = $2
            RETURNING id_producto, nombre, activo
        `, [
            activo,
            idProducto
        ]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }

        res.json({
            mensaje: activo
                ? 'Producto reactivado correctamente'
                : 'Producto desactivado correctamente',
            producto: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al cambiar el estado del producto'
        });

    }

});

app.put('/api/productos/:id', async (req, res) => {

    const idProducto = Number(req.params.id);

    const {
        nombre,
        descripcion,
        id_categoria,
        precio
    } = req.body;

    try {

        if (!nombre || !id_categoria || precio === undefined) {

            return res.status(400).json({
                mensaje: 'Faltan datos obligatorios'
            });

        }

        if (Number(precio) < 0) {

            return res.status(400).json({
                mensaje: 'El precio no puede ser negativo'
            });

        }

        const resultado = await pool.query(`
            UPDATE productos
            SET
                nombre = $1,
                descripcion = $2,
                id_categoria = $3,
                precio = $4
            WHERE id_producto = $5
            RETURNING *
        `, [
            nombre,
            descripcion || null,
            id_categoria,
            precio,
            idProducto
        ]);

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });

        }

        res.json({
            mensaje: 'Producto actualizado correctamente',
            producto: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al actualizar producto'
        });

    }

});

app.patch('/api/inventario/:id', async (req, res) => {

    const idInventario = Number(req.params.id);

    const {
        stock_actual,
        stock_minimo
    } = req.body;

    const stockActualNumero = Number(stock_actual);

    const stockMinimoNumero =
        stock_minimo === '' ||
        stock_minimo === null ||
        stock_minimo === undefined
            ? null
            : Number(stock_minimo);

    // Validaciones
    if (
        !Number.isInteger(stockActualNumero) ||
        stockActualNumero < 0
    ) {
        return res.status(400).json({
            mensaje: 'El stock actual debe ser un número entero igual o mayor a 0'
        });
    }

    if (
        stockMinimoNumero !== null &&
        (
            !Number.isInteger(stockMinimoNumero) ||
            stockMinimoNumero < 0
        )
    ) {
        return res.status(400).json({
            mensaje: 'El stock mínimo debe ser un número entero igual o mayor a 0'
        });
    }

    try {

        const resultado = await pool.query(`
            UPDATE inventario
            SET
                stock_actual = $1,
                stock_minimo = $2
            WHERE id_inventario = $3
            RETURNING *
        `, [
            stockActualNumero,
            stockMinimoNumero,
            idInventario
        ]);

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                mensaje: 'Registro de inventario no encontrado'
            });

        }

        res.json({
            mensaje: 'Inventario actualizado correctamente',
            inventario: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al actualizar inventario'
        });

    }

});

app.get('/api/clientes', async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                id_cliente,
                nombre,
                rut,
                telefono,
                correo,
                direccion,
                comuna,
                activo
            FROM clientes
            ORDER BY nombre
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener clientes'
        });

    }

});

app.post('/api/clientes', async (req, res) => {

    const {
        nombre,
        rut,
        telefono,
        correo,
        direccion,
        comuna
    } = req.body;

    if (!nombre || !nombre.trim()) {

        return res.status(400).json({
            mensaje: 'El nombre es obligatorio'
        });

    }

    try {

        const resultado = await pool.query(`
            INSERT INTO clientes (
                nombre,
                rut,
                telefono,
                correo,
                direccion,
                comuna
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            nombre.trim(),
            rut || null,
            telefono || null,
            correo || null,
            direccion || null,
            comuna || null
        ]);

        res.status(201).json({
            mensaje: 'Cliente agregado correctamente',
            cliente: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        if (error.code === '23505') {

            return res.status(400).json({
                mensaje: 'El RUT ingresado ya está registrado'
            });

        }

        res.status(500).json({
            mensaje: 'Error al agregar cliente'
        });

    }

});

app.put('/api/clientes/:id', async (req, res) => {

    const idCliente = Number(req.params.id);

    const {
        nombre,
        rut,
        telefono,
        correo,
        direccion,
        comuna
    } = req.body;

    if (!nombre || !nombre.trim()) {

        return res.status(400).json({
            mensaje: 'El nombre es obligatorio'
        });

    }

    try {

        const resultado = await pool.query(`
            UPDATE clientes
            SET
                nombre = $1,
                rut = $2,
                telefono = $3,
                correo = $4,
                direccion = $5,
                comuna = $6
            WHERE id_cliente = $7
            RETURNING *
        `, [
            nombre.trim(),
            rut || null,
            telefono || null,
            correo || null,
            direccion || null,
            comuna || null,
            idCliente
        ]);

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                mensaje: 'Cliente no encontrado'
            });

        }

        res.json({
            mensaje: 'Cliente actualizado correctamente',
            cliente: resultado.rows[0]
        });

    } catch (error) {

        console.error(error);

        if (error.code === '23505') {

            return res.status(400).json({
                mensaje: 'El RUT ingresado ya está registrado'
            });

        }

        res.status(500).json({
            mensaje: 'Error al actualizar cliente'
        });

    }

});

app.patch('/api/clientes/:id/estado', async (req, res) => {

    const idCliente = Number(req.params.id);
    const { activo } = req.body;

    try {

        const resultado = await pool.query(`
            UPDATE clientes
            SET activo = $1
            WHERE id_cliente = $2
            RETURNING *
        `, [
            activo,
            idCliente
        ]);

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                mensaje: 'Cliente no encontrado'
            });

        }

        res.json({
            mensaje: activo
                ? 'Cliente reactivado correctamente'
                : 'Cliente desactivado correctamente'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al cambiar el estado del cliente'
        });

    }

});


// Inicia el servidor
app.listen(PORT, () => {

    console.log(
        `Servidor ejecutándose en http://localhost:${PORT}`
    );

});