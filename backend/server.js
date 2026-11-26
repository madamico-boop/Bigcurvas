require('dotenv').config();

const express = require('express');
const path = require('path');
const pool = require('./config/db');

const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();

const PORT =
    Number(process.env.PORT) ||
    3000;


if (
    !process.env.SESSION_SECRET ||
    process.env.SESSION_SECRET.length < 32
) {

    throw new Error(
        'SESSION_SECRET debe existir y tener al menos 32 caracteres'
    );

}


app.disable(
    'x-powered-by'
);


if (
    process.env.NODE_ENV ===
    'production'
) {

    app.set(
        'trust proxy',
        1
    );

}


// Permite recibir datos JSON desde el frontend
app.use(
    express.json({
        limit: '100kb'
    })
);

app.use(session({

    name: 'bigcurvas.sid',

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {

        httpOnly: true,

        sameSite: 'lax',

        secure:
            process.env.NODE_ENV ===
            'production',

        maxAge:
            8 * 60 * 60 * 1000

    }

}));


// Permite usar los archivos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// =====================================
// AUTENTICACIÓN Y ROLES
// =====================================

async function obtenerUsuarioSesion(req) {

    if (
        !req.session.usuario ||
        !req.session.usuario.id_usuario
    ) {

        return null;

    }

    const resultado =
        await pool.query(`
            SELECT
                id_usuario,
                nombre,
                correo,
                rol,
                activo
            FROM usuarios
            WHERE id_usuario = $1
            LIMIT 1
        `, [
            req.session.usuario.id_usuario
        ]);

    if (
        resultado.rows.length === 0 ||
        !resultado.rows[0].activo
    ) {

        return null;

    }

    const usuario =
        resultado.rows[0];

    req.session.usuario = {
        id_usuario:
            usuario.id_usuario,
        nombre:
            usuario.nombre,
        correo:
            usuario.correo,
        rol:
            usuario.rol
    };

    return usuario;

}


function responderSesionInvalida(
    req,
    res,
    mensaje = 'Debe iniciar sesión'
) {

    req.session.destroy(() => {

        res.clearCookie(
            'bigcurvas.sid'
        );

        res.status(401).json({
            mensaje
        });

    });

}


async function requiereAutenticacion(
    req,
    res,
    next
) {

    try {

        const usuario =
            await obtenerUsuarioSesion(
                req
            );

        if (!usuario) {

            return responderSesionInvalida(
                req,
                res
            );

        }

        next();

    } catch (error) {

        console.error(
            'Error al validar sesión:',
            error
        );

        res.status(500).json({
            mensaje:
                'Error al validar la sesión'
        });

    }

}


async function requiereAdmin(
    req,
    res,
    next
) {

    try {

        const usuario =
            await obtenerUsuarioSesion(
                req
            );

        if (!usuario) {

            return responderSesionInvalida(
                req,
                res
            );

        }

        if (
            usuario.rol !==
            'administrador'
        ) {

            return res.status(403).json({
                mensaje:
                    'No tiene permisos para realizar esta acción'
            });

        }

        next();

    } catch (error) {

        console.error(
            'Error al validar permisos:',
            error
        );

        res.status(500).json({
            mensaje:
                'Error al validar los permisos'
        });

    }

}




// Página principal
app.get('/', (req, res) => {

    res.sendFile(
        path.join(__dirname, '../frontend/index.html')
    );

});

app.post('/api/auth/login', async (req, res) => {

    const {
        correo,
        password
    } = req.body;


    if (!correo || !password) {

        return res.status(400).json({
            mensaje:
                'Correo y contraseña son obligatorios'
        });

    }


    try {

        const resultado =
            await pool.query(`
                SELECT
                    id_usuario,
                    nombre,
                    correo,
                    password_hash,
                    rol,
                    activo

                FROM usuarios

                WHERE
                    LOWER(correo) =
                    LOWER($1)

                LIMIT 1
            `, [
                correo.trim()
            ]);


        if (
            resultado.rows.length === 0
        ) {

            return res.status(401).json({
                mensaje:
                    'Correo o contraseña incorrectos'
            });

        }


        const usuario =
            resultado.rows[0];


        if (!usuario.activo) {

            return res.status(403).json({
                mensaje:
                    'El usuario se encuentra desactivado'
            });

        }


        const passwordCorrecta =
            await bcrypt.compare(
                password,
                usuario.password_hash
            );


        if (!passwordCorrecta) {

            return res.status(401).json({
                mensaje:
                    'Correo o contraseña incorrectos'
            });

        }


        req.session.regenerate(error => {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    mensaje:
                        'Error al iniciar sesión'
                });

            }


            req.session.usuario = {

                id_usuario:
                    usuario.id_usuario,

                nombre:
                    usuario.nombre,

                correo:
                    usuario.correo,

                rol:
                    usuario.rol

            };


            req.session.save(error => {

                if (error) {

                    console.error(error);

                    return res.status(500).json({
                        mensaje:
                            'Error al iniciar sesión'
                    });

                }


                res.json({

                    mensaje:
                        'Sesión iniciada correctamente',

                    usuario:
                        req.session.usuario

                });

            });

        });


    } catch (error) {

        console.error(
            'Error en login:',
            error
        );


        res.status(500).json({
            mensaje:
                'Error al iniciar sesión'
        });

    }

});

app.get('/api/auth/me', async (req, res) => {

    try {

        const usuario =
            await obtenerUsuarioSesion(
                req
            );

        if (!usuario) {

            return responderSesionInvalida(
                req,
                res,
                'Sesión no válida o usuario desactivado'
            );

        }

        res.json({

            autenticado: true,

            usuario:
                req.session.usuario

        });

    } catch (error) {

        console.error(
            'Error al comprobar sesión:',
            error
        );

        res.status(500).json({
            mensaje:
                'Error al comprobar la sesión'
        });

    }

});

app.post('/api/auth/logout', (req, res) => {

    req.session.destroy(error => {

        if (error) {

            console.error(error);

            return res.status(500).json({
                mensaje:
                    'Error al cerrar sesión'
            });

        }


        res.clearCookie(
            'bigcurvas.sid'
        );


        res.json({
            mensaje:
                'Sesión cerrada correctamente'
        });

    });

});


// =====================================
// ADMINISTRACIÓN DE USUARIOS
// SOLO ADMINISTRADOR
// =====================================

app.get('/api/usuarios', requiereAdmin, async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                id_usuario,
                nombre,
                correo,
                rol,
                activo
            FROM usuarios
            ORDER BY nombre, correo
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(
            'Error al obtener usuarios:',
            error
        );

        res.status(500).json({
            mensaje:
                'Error al obtener usuarios'
        });

    }

});


app.post('/api/usuarios', requiereAdmin, async (req, res) => {

    const {
        nombre,
        correo,
        password,
        rol
    } = req.body;

    const nombreLimpio =
        typeof nombre === 'string'
            ? nombre.trim()
            : '';

    const correoLimpio =
        typeof correo === 'string'
            ? correo.trim().toLowerCase()
            : '';

    if (!nombreLimpio || !correoLimpio || !password || !rol) {

        return res.status(400).json({
            mensaje:
                'Nombre, correo, contraseña y rol son obligatorios'
        });

    }

    if (
        !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
            .test(correoLimpio)
    ) {

        return res.status(400).json({
            mensaje:
                'El correo ingresado no es válido'
        });

    }

    if (
        ![
            'administrador',
            'vendedora'
        ].includes(rol)
    ) {

        return res.status(400).json({
            mensaje:
                'El rol seleccionado no es válido'
        });

    }

    if (
        typeof password !== 'string' ||
        password.length < 8
    ) {

        return res.status(400).json({
            mensaje:
                'La contraseña debe tener al menos 8 caracteres'
        });

    }

    try {

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );

        const resultado =
            await pool.query(`
                INSERT INTO usuarios (
                    nombre,
                    correo,
                    password_hash,
                    rol,
                    activo
                )
                VALUES ($1, $2, $3, $4, TRUE)
                RETURNING
                    id_usuario,
                    nombre,
                    correo,
                    rol,
                    activo
            `, [
                nombreLimpio,
                correoLimpio,
                passwordHash,
                rol
            ]);

        res.status(201).json({
            mensaje:
                'Usuario creado correctamente',
            usuario:
                resultado.rows[0]
        });

    } catch (error) {

        console.error(
            'Error al crear usuario:',
            error
        );

        if (error.code === '23505') {

            return res.status(400).json({
                mensaje:
                    'El correo ingresado ya está registrado'
            });

        }

        res.status(500).json({
            mensaje:
                'Error al crear usuario'
        });

    }

});


app.put('/api/usuarios/:id', requiereAdmin, async (req, res) => {

    const idUsuario =
        Number(req.params.id);

    const {
        nombre,
        correo,
        rol
    } = req.body;

    const nombreLimpio =
        typeof nombre === 'string'
            ? nombre.trim()
            : '';

    const correoLimpio =
        typeof correo === 'string'
            ? correo.trim().toLowerCase()
            : '';

    if (
        !Number.isInteger(idUsuario) ||
        idUsuario <= 0
    ) {

        return res.status(400).json({
            mensaje:
                'Usuario no válido'
        });

    }

    if (!nombreLimpio || !correoLimpio || !rol) {

        return res.status(400).json({
            mensaje:
                'Nombre, correo y rol son obligatorios'
        });

    }

    if (
        !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
            .test(correoLimpio)
    ) {

        return res.status(400).json({
            mensaje:
                'El correo ingresado no es válido'
        });

    }

    if (
        ![
            'administrador',
            'vendedora'
        ].includes(rol)
    ) {

        return res.status(400).json({
            mensaje:
                'El rol seleccionado no es válido'
        });

    }

    if (
        idUsuario ===
            req.session.usuario.id_usuario &&
        rol !== 'administrador'
    ) {

        return res.status(400).json({
            mensaje:
                'No puede quitarse a sí mismo el rol de administrador'
        });

    }

    try {

        const actual =
            await pool.query(`
                SELECT
                    id_usuario,
                    rol,
                    activo
                FROM usuarios
                WHERE id_usuario = $1
            `, [
                idUsuario
            ]);

        if (
            actual.rows.length === 0
        ) {

            return res.status(404).json({
                mensaje:
                    'Usuario no encontrado'
            });

        }

        const usuarioActualizado =
            actual.rows[0];

        if (
            usuarioActualizado.rol === 'administrador' &&
            usuarioActualizado.activo &&
            rol !== 'administrador'
        ) {

            const adminsActivos =
                await pool.query(`
                    SELECT COUNT(*)::int AS cantidad
                    FROM usuarios
                    WHERE
                        rol = 'administrador'
                        AND activo = TRUE
                `);

            if (
                adminsActivos.rows[0].cantidad <= 1
            ) {

                return res.status(400).json({
                    mensaje:
                        'Debe existir al menos un administrador activo'
                });

            }

        }

        const resultado =
            await pool.query(`
                UPDATE usuarios
                SET
                    nombre = $1,
                    correo = $2,
                    rol = $3
                WHERE id_usuario = $4
                RETURNING
                    id_usuario,
                    nombre,
                    correo,
                    rol,
                    activo
            `, [
                nombreLimpio,
                correoLimpio,
                rol,
                idUsuario
            ]);

        if (
            idUsuario ===
                req.session.usuario.id_usuario
        ) {

            req.session.usuario.nombre =
                resultado.rows[0].nombre;

            req.session.usuario.correo =
                resultado.rows[0].correo;

            req.session.usuario.rol =
                resultado.rows[0].rol;

        }

        res.json({
            mensaje:
                'Usuario actualizado correctamente',
            usuario:
                resultado.rows[0]
        });

    } catch (error) {

        console.error(
            'Error al actualizar usuario:',
            error
        );

        if (error.code === '23505') {

            return res.status(400).json({
                mensaje:
                    'El correo ingresado ya está registrado'
            });

        }

        res.status(500).json({
            mensaje:
                'Error al actualizar usuario'
        });

    }

});


app.patch('/api/usuarios/:id/estado', requiereAdmin, async (req, res) => {

    const idUsuario =
        Number(req.params.id);

    const { activo } =
        req.body;

    if (
        !Number.isInteger(idUsuario) ||
        idUsuario <= 0 ||
        typeof activo !== 'boolean'
    ) {

        return res.status(400).json({
            mensaje:
                'Datos de usuario no válidos'
        });

    }

    if (
        idUsuario ===
            req.session.usuario.id_usuario &&
        !activo
    ) {

        return res.status(400).json({
            mensaje:
                'No puede desactivar su propia cuenta'
        });

    }

    try {

        const actual =
            await pool.query(`
                SELECT
                    id_usuario,
                    nombre,
                    rol,
                    activo
                FROM usuarios
                WHERE id_usuario = $1
            `, [
                idUsuario
            ]);

        if (
            actual.rows.length === 0
        ) {

            return res.status(404).json({
                mensaje:
                    'Usuario no encontrado'
            });

        }

        const usuario =
            actual.rows[0];

        if (
            usuario.rol === 'administrador' &&
            usuario.activo &&
            !activo
        ) {

            const adminsActivos =
                await pool.query(`
                    SELECT COUNT(*)::int AS cantidad
                    FROM usuarios
                    WHERE
                        rol = 'administrador'
                        AND activo = TRUE
                `);

            if (
                adminsActivos.rows[0].cantidad <= 1
            ) {

                return res.status(400).json({
                    mensaje:
                        'Debe existir al menos un administrador activo'
                });

            }

        }

        const resultado =
            await pool.query(`
                UPDATE usuarios
                SET activo = $1
                WHERE id_usuario = $2
                RETURNING
                    id_usuario,
                    nombre,
                    correo,
                    rol,
                    activo
            `, [
                activo,
                idUsuario
            ]);

        res.json({
            mensaje:
                activo
                    ? 'Usuario reactivado correctamente'
                    : 'Usuario desactivado correctamente',
            usuario:
                resultado.rows[0]
        });

    } catch (error) {

        console.error(
            'Error al cambiar estado del usuario:',
            error
        );

        res.status(500).json({
            mensaje:
                'Error al cambiar el estado del usuario'
        });

    }

});


app.patch('/api/usuarios/:id/password', requiereAdmin, async (req, res) => {

    const idUsuario =
        Number(req.params.id);

    const { password } =
        req.body;

    if (
        !Number.isInteger(idUsuario) ||
        idUsuario <= 0
    ) {

        return res.status(400).json({
            mensaje:
                'Usuario no válido'
        });

    }

    if (
        typeof password !== 'string' ||
        password.length < 8
    ) {

        return res.status(400).json({
            mensaje:
                'La contraseña debe tener al menos 8 caracteres'
        });

    }

    try {

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );

        const resultado =
            await pool.query(`
                UPDATE usuarios
                SET password_hash = $1
                WHERE id_usuario = $2
                RETURNING id_usuario
            `, [
                passwordHash,
                idUsuario
            ]);

        if (
            resultado.rows.length === 0
        ) {

            return res.status(404).json({
                mensaje:
                    'Usuario no encontrado'
            });

        }

        res.json({
            mensaje:
                'Contraseña actualizada correctamente'
        });

    } catch (error) {

        console.error(
            'Error al cambiar contraseña:',
            error
        );

        res.status(500).json({
            mensaje:
                'Error al cambiar la contraseña'
        });

    }

});


// Ruta para obtener el inventario
app.get('/api/inventario',requiereAutenticacion, async (req, res) => {

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
app.post('/api/ventas',requiereAutenticacion, async (req, res) => {

    const {
        id_cliente,
        canal,
        estado_pago,
        items
    } = req.body;


    // ============================
    // VALIDACIONES INICIALES
    // ============================

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        return res.status(400).json({
            mensaje:
                'La venta debe contener productos'
        });

    }


    const canalVenta =
        typeof canal === 'string' &&
        canal.trim()
            ? canal.trim()
            : 'Local';


    if (
        ![
            'Local',
            'Online'
        ].includes(canalVenta)
    ) {

        return res.status(400).json({
            mensaje:
                'El canal de venta no es válido'
        });

    }


    const estadoPago =
        typeof estado_pago === 'string' &&
        estado_pago.trim()
            ? estado_pago.trim()
            : 'Pagado';


    if (
        ![
            'Pagado',
            'Pendiente'
        ].includes(estadoPago)
    ) {

        return res.status(400).json({
            mensaje:
                'El estado de pago no es válido'
        });

    }


    // Agrupar productos repetidos
    // por variante + sucursal.

    const agrupados =
        new Map();


    for (const item of items) {

        const idVariante =
            Number(item.id_variante);

        const idSucursal =
            Number(item.id_sucursal);

        const cantidad =
            Number(item.cantidad);


        if (
            !Number.isInteger(idVariante) ||
            !Number.isInteger(idSucursal) ||
            !Number.isInteger(cantidad) ||
            cantidad <= 0
        ) {

            return res.status(400).json({
                mensaje:
                    'Hay productos con datos inválidos'
            });

        }


        const clave =
            `${idVariante}-${idSucursal}`;


        if (agrupados.has(clave)) {

            agrupados.get(clave).cantidad +=
                cantidad;

        } else {

            agrupados.set(clave, {
                id_variante:
                    idVariante,

                id_sucursal:
                    idSucursal,

                cantidad:
                    cantidad
            });

        }

    }


    const itemsVenta =
        [...agrupados.values()];


    // Todas las líneas deben salir
    // desde una misma sucursal.

    const sucursales =
        [
            ...new Set(
                itemsVenta.map(
                    item =>
                        item.id_sucursal
                )
            )
        ];


    if (sucursales.length !== 1) {

        return res.status(400).json({
            mensaje:
                'Todos los productos de una venta deben pertenecer a la misma sucursal'
        });

    }


    const idSucursalVenta =
        sucursales[0];


    const client =
        await pool.connect();


    try {

        await client.query('BEGIN');


        // ============================
        // VALIDAR CLIENTE
        // ============================

        if (id_cliente) {

            const cliente =
                await client.query(`
                    SELECT id_cliente
                    FROM clientes
                    WHERE
                        id_cliente = $1
                        AND activo = TRUE
                `, [
                    id_cliente
                ]);


            if (
                cliente.rows.length === 0
            ) {

                await client.query(
                    'ROLLBACK'
                );

                return res.status(400).json({
                    mensaje:
                        'El cliente seleccionado no es válido'
                });

            }

        }


        // ============================
        // VALIDAR PRODUCTOS Y STOCK
        // ============================

        const productosValidados = [];

        let total = 0;


        for (const item of itemsVenta) {

            const resultado =
                await client.query(`
                    SELECT
                        i.id_inventario,
                        i.stock_actual,

                        v.id_variante,
                        v.color,
                        v.talla,

                        p.nombre,
                        p.precio

                    FROM inventario i

                    JOIN variantes v
                        ON i.id_variante =
                           v.id_variante

                    JOIN productos p
                        ON v.id_producto =
                           p.id_producto

                    JOIN sucursales s
                        ON i.id_sucursal =
                           s.id_sucursal

                    WHERE
                        i.id_variante = $1
                        AND i.id_sucursal = $2
                        AND p.activo = TRUE
                        AND s.activo = TRUE

                    FOR UPDATE
                `, [
                    item.id_variante,
                    item.id_sucursal
                ]);


            if (
                resultado.rows.length === 0
            ) {

                await client.query(
                    'ROLLBACK'
                );

                return res.status(404).json({
                    mensaje:
                        'Uno de los productos ya no está disponible'
                });

            }


            const producto =
                resultado.rows[0];


            if (
                producto.stock_actual <
                item.cantidad
            ) {

                await client.query(
                    'ROLLBACK'
                );

                return res.status(400).json({
                    mensaje:
                        `Stock insuficiente para ${producto.nombre} ${producto.color} ${producto.talla}`
                });

            }


            const precio =
                Number(producto.precio);


            total +=
                precio *
                item.cantidad;


            productosValidados.push({

                id_inventario:
                    producto.id_inventario,

                id_variante:
                    producto.id_variante,

                cantidad:
                    item.cantidad,

                precio:
                    precio

            });

        }


        // ============================
        // CREAR VENTA
        // ============================

        const ventaCreada =
            await client.query(`
                INSERT INTO ventas (
                    id_usuario,
                    id_cliente,
                    id_sucursal,
                    canal,
                    estado_pago,
                    total
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                )

                RETURNING id_venta
            `, [
                req.session.usuario.id_usuario,
                id_cliente || null,
                idSucursalVenta,
                canalVenta,
                estadoPago,
                total
            ]);


        const idVenta =
            ventaCreada.rows[0]
                .id_venta;


        // ============================
        // DETALLES + STOCK
        // ============================

        for (
            const producto
            of productosValidados
        ) {

            await client.query(`
                INSERT INTO detalle_venta (
                    id_venta,
                    id_variante,
                    cantidad,
                    precio_unitario
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )
            `, [
                idVenta,
                producto.id_variante,
                producto.cantidad,
                producto.precio
            ]);


            await client.query(`
                UPDATE inventario

                SET stock_actual =
                    stock_actual - $1

                WHERE id_inventario = $2
            `, [
                producto.cantidad,
                producto.id_inventario
            ]);

        }


        // ============================
        // CONFIRMAR TRANSACCIÓN
        // ============================

        await client.query('COMMIT');


        res.status(201).json({

            mensaje:
                'Venta registrada correctamente',

            idVenta:
                idVenta,

            total:
                total

        });


    } catch (error) {

        await client.query(
            'ROLLBACK'
        );


        console.error(error);


        res.status(500).json({
            mensaje:
                'Error al registrar la venta'
        });


    } finally {

        client.release();

    }

});

app.get('/api/opciones-venta',requiereAutenticacion, async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                v.id_variante,
                s.id_sucursal,
                p.nombre AS producto,
                p.precio,
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

app.get(
    '/api/dashboard',
    requiereAutenticacion,
    async (req, res) => {

        try {

            const usuario =
                req.session.usuario;


            // =====================================
            // DASHBOARD VENDEDORA
            // =====================================

            if (usuario.rol === 'vendedora') {

                const ventasHoy =
                    await pool.query(`
                        SELECT
                            COALESCE(SUM(total), 0) AS total,
                            COUNT(*) AS cantidad
                        FROM ventas
                        WHERE
                            fecha::date = CURRENT_DATE
                            AND id_usuario = $1
                    `, [
                        usuario.id_usuario
                    ]);


                const stockBajo =
                    await pool.query(`
                        SELECT
                            COUNT(*) AS total
                        FROM inventario
                        WHERE
                            stock_minimo IS NOT NULL
                            AND stock_actual <= stock_minimo
                    `);


                const ultimasVentas =
                    await pool.query(`
                        SELECT
                            v.id_venta,
                            v.fecha,
                            v.total,
                            s.nombre AS sucursal,
                            c.nombre AS cliente

                        FROM ventas v

                        JOIN sucursales s
                            ON v.id_sucursal =
                               s.id_sucursal

                        LEFT JOIN clientes c
                            ON v.id_cliente =
                               c.id_cliente

                        WHERE
                            v.id_usuario = $1

                        ORDER BY
                            v.fecha DESC

                        LIMIT 5
                    `, [
                        usuario.id_usuario
                    ]);


                return res.json({

                    rol:
                        'vendedora',

                    nombre:
                        usuario.nombre,

                    ventasHoy:
                        Number(
                            ventasHoy.rows[0].total
                        ),

                    cantidadVentasHoy:
                        Number(
                            ventasHoy.rows[0].cantidad
                        ),

                    stockBajo:
                        Number(
                            stockBajo.rows[0].total
                        ),

                    ultimasVentas:
                        ultimasVentas.rows

                });

            }


            // =====================================
            // DASHBOARD ADMINISTRADOR
            // =====================================

            const ventasHoy =
                await pool.query(`
                    SELECT
                        COALESCE(SUM(total), 0) AS total
                    FROM ventas
                    WHERE fecha::date = CURRENT_DATE
                `);


            const ventasMes =
                await pool.query(`
                    SELECT
                        COALESCE(SUM(total), 0) AS total
                    FROM ventas
                    WHERE
                        DATE_TRUNC('month', fecha) =
                        DATE_TRUNC('month', CURRENT_DATE)
                `);


            const stockTotal =
                await pool.query(`
                    SELECT
                        COALESCE(SUM(stock_actual), 0)
                        AS total
                    FROM inventario
                `);


            const stockBajo =
                await pool.query(`
                    SELECT
                        COUNT(*) AS total
                    FROM inventario
                    WHERE
                        stock_minimo IS NOT NULL
                        AND stock_actual <= stock_minimo
                `);


            const ventas7Dias =
                await pool.query(`
                    WITH dias AS (
                        SELECT
                            generate_series(
                                CURRENT_DATE - INTERVAL '6 days',
                                CURRENT_DATE,
                                INTERVAL '1 day'
                            )::date AS fecha
                    )

                    SELECT
                        d.fecha,
                        COALESCE(
                            SUM(v.total),
                            0
                        ) AS total

                    FROM dias d

                    LEFT JOIN ventas v
                        ON v.fecha::date = d.fecha

                    GROUP BY d.fecha

                    ORDER BY d.fecha
                `);


            const ventasSucursal =
                await pool.query(`
                    SELECT
                        s.nombre AS sucursal,
                        COALESCE(
                            SUM(v.total),
                            0
                        ) AS total

                    FROM sucursales s

                    LEFT JOIN ventas v
                        ON v.id_sucursal =
                           s.id_sucursal
                        AND DATE_TRUNC(
                            'month',
                            v.fecha
                        ) =
                        DATE_TRUNC(
                            'month',
                            CURRENT_DATE
                        )

                    WHERE
                        s.activo = TRUE

                    GROUP BY
                        s.id_sucursal,
                        s.nombre

                    ORDER BY
                        s.nombre
                `);


            const productosMasVendidos =
                await pool.query(`
                    SELECT
                        p.nombre AS producto,
                        SUM(d.cantidad) AS cantidad

                    FROM detalle_venta d

                    JOIN ventas ve
                        ON d.id_venta =
                           ve.id_venta

                    JOIN variantes va
                        ON d.id_variante =
                           va.id_variante

                    JOIN productos p
                        ON va.id_producto =
                           p.id_producto

                    WHERE
                        DATE_TRUNC(
                            'month',
                            ve.fecha
                        ) =
                        DATE_TRUNC(
                            'month',
                            CURRENT_DATE
                        )

                    GROUP BY
                        p.id_producto,
                        p.nombre

                    ORDER BY
                        cantidad DESC

                    LIMIT 5
                `);


            res.json({

                rol:
                    'administrador',

                nombre:
                    usuario.nombre,

                ventasHoy:
                    Number(
                        ventasHoy.rows[0].total
                    ),

                ventasMes:
                    Number(
                        ventasMes.rows[0].total
                    ),

                stockTotal:
                    Number(
                        stockTotal.rows[0].total
                    ),

                stockBajo:
                    Number(
                        stockBajo.rows[0].total
                    ),

                ventas7Dias:
                    ventas7Dias.rows,

                ventasSucursal:
                    ventasSucursal.rows,

                productosMasVendidos:
                    productosMasVendidos.rows

            });


        } catch (error) {

            console.error(
                'Error al cargar dashboard:',
                error
            );


            res.status(500).json({
                mensaje:
                    'Error al cargar dashboard'
            });

        }

    }
);

app.get('/api/categorias',requiereAutenticacion, async (req, res) => {

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

app.get('/api/productos',requiereAutenticacion, async (req, res) => {

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

app.get('/api/productos/:id/variantes', requiereAutenticacion, async (req, res) => {

    const idProducto = Number(req.params.id);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
        return res.status(400).json({
            mensaje: 'Producto inválido'
        });
    }

    try {

        const resultado = await pool.query(`
            SELECT
                v.id_variante,
                v.talla,
                v.color,
                v.sku,
                COALESCE(
                    MAX(CASE WHEN s.nombre = 'Rancagua' THEN i.stock_actual END),
                    0
                ) AS stock_rancagua,
                MAX(CASE WHEN s.nombre = 'Rancagua' THEN i.stock_minimo END) AS minimo_rancagua,
                COALESCE(
                    MAX(CASE WHEN s.nombre = 'Bodega' THEN i.stock_actual END),
                    0
                ) AS stock_bodega,
                MAX(CASE WHEN s.nombre = 'Bodega' THEN i.stock_minimo END) AS minimo_bodega
            FROM variantes v
            LEFT JOIN inventario i
                ON v.id_variante = i.id_variante
            LEFT JOIN sucursales s
                ON i.id_sucursal = s.id_sucursal
            WHERE v.id_producto = $1
            GROUP BY
                v.id_variante,
                v.talla,
                v.color,
                v.sku
            ORDER BY
                v.color,
                v.talla
        `, [idProducto]);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener variantes del producto'
        });

    }

});

app.post('/api/productos', requiereAdmin, async (req, res) => {

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

app.post('/api/variantes', requiereAdmin, async (req, res) => {

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

app.put('/api/variantes/:id', requiereAdmin, async (req, res) => {

    const idVariante =
        Number(req.params.id);

    const {
        talla,
        color,
        sku,
        stock_rancagua,
        minimo_rancagua,
        stock_bodega,
        minimo_bodega
    } = req.body;

    const tallaLimpia =
        typeof talla === 'string'
            ? talla.trim()
            : '';

    const colorLimpio =
        typeof color === 'string'
            ? color.trim()
            : '';

    const skuLimpio =
        typeof sku === 'string'
            ? sku.trim()
            : '';

    const convertirStock = valor => {

        const numero =
            Number(valor);

        return Number.isInteger(numero) &&
            numero >= 0
                ? numero
                : null;

    };

    const convertirMinimo = valor => {

        if (
            valor === '' ||
            valor === null ||
            valor === undefined
        ) {

            return null;

        }

        const numero =
            Number(valor);

        return Number.isInteger(numero) &&
            numero >= 0
                ? numero
                : NaN;

    };

    const stockRancagua =
        convertirStock(
            stock_rancagua
        );

    const stockBodega =
        convertirStock(
            stock_bodega
        );

    const minimoRancagua =
        convertirMinimo(
            minimo_rancagua
        );

    const minimoBodega =
        convertirMinimo(
            minimo_bodega
        );

    if (
        !Number.isInteger(idVariante) ||
        idVariante <= 0
    ) {

        return res.status(400).json({
            mensaje:
                'Variante no válida'
        });

    }

    if (
        !tallaLimpia ||
        !colorLimpio
    ) {

        return res.status(400).json({
            mensaje:
                'Talla y color son obligatorios'
        });

    }

    if (
        stockRancagua === null ||
        stockBodega === null ||
        Number.isNaN(minimoRancagua) ||
        Number.isNaN(minimoBodega)
    ) {

        return res.status(400).json({
            mensaje:
                'Los valores de stock deben ser números enteros iguales o mayores a 0'
        });

    }

    const client =
        await pool.connect();

    try {

        await client.query(
            'BEGIN'
        );

        const varianteActualizada =
            await client.query(`
                UPDATE variantes
                SET
                    talla = $1,
                    color = $2,
                    sku = $3
                WHERE id_variante = $4
                RETURNING
                    id_variante,
                    id_producto,
                    talla,
                    color,
                    sku
            `, [
                tallaLimpia,
                colorLimpio,
                skuLimpio || null,
                idVariante
            ]);

        if (
            varianteActualizada.rows.length === 0
        ) {

            await client.query(
                'ROLLBACK'
            );

            return res.status(404).json({
                mensaje:
                    'Variante no encontrada'
            });

        }

        const sucursales =
            await client.query(`
                SELECT
                    id_sucursal,
                    nombre
                FROM sucursales
                WHERE nombre IN ('Rancagua', 'Bodega')
            `);

        const datosSucursal = [
            {
                nombre:
                    'Rancagua',
                stock:
                    stockRancagua,
                minimo:
                    minimoRancagua
            },
            {
                nombre:
                    'Bodega',
                stock:
                    stockBodega,
                minimo:
                    minimoBodega
            }
        ];

        for (
            const datos
            of datosSucursal
        ) {

            const sucursal =
                sucursales.rows.find(
                    item =>
                        item.nombre ===
                        datos.nombre
                );

            if (!sucursal) {

                await client.query(
                    'ROLLBACK'
                );

                return res.status(500).json({
                    mensaje:
                        'No se encontró la sucursal ' +
                        datos.nombre
                });

            }

            await client.query(`
                INSERT INTO inventario (
                    id_variante,
                    id_sucursal,
                    stock_actual,
                    stock_minimo
                )
                VALUES ($1, $2, $3, $4)

                ON CONFLICT (
                    id_variante,
                    id_sucursal
                )

                DO UPDATE SET
                    stock_actual =
                        EXCLUDED.stock_actual,
                    stock_minimo =
                        EXCLUDED.stock_minimo
            `, [
                idVariante,
                sucursal.id_sucursal,
                datos.stock,
                datos.minimo
            ]);

        }

        await client.query(
            'COMMIT'
        );

        res.json({
            mensaje:
                'Variante actualizada correctamente',
            variante:
                varianteActualizada.rows[0]
        });

    } catch (error) {

        await client.query(
            'ROLLBACK'
        );

        console.error(
            'Error al actualizar variante:',
            error
        );

        if (
            error.code === '23505'
        ) {

            return res.status(400).json({
                mensaje:
                    'Ya existe una variante con esa talla/color o el SKU ya está registrado'
            });

        }

        res.status(500).json({
            mensaje:
                'Error al actualizar variante'
        });

    } finally {

        client.release();

    }

});


app.patch('/api/productos/:id/estado',requiereAdmin, async (req, res) => {

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

app.put('/api/productos/:id',requiereAdmin, async (req, res) => {

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

app.patch('/api/inventario/:id',requiereAdmin, async (req, res) => {

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

app.get('/api/clientes/opciones',requiereAutenticacion, async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        id_cliente,
                        nombre,
                        rut
                    FROM clientes
                    WHERE activo = TRUE
                    ORDER BY nombre
                `);

            res.json(
                resultado.rows
            );

        } catch (error) {

            console.error(error);

            res.status(500).json({
                mensaje:
                    'Error al obtener clientes'
            });

        }

    }
);



app.get('/api/clientes', requiereAutenticacion, async (req, res) => {

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

app.post('/api/clientes', requiereAutenticacion, async (req, res) => {

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

app.put('/api/clientes/:id', requiereAutenticacion, async (req, res) => {

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

app.patch('/api/clientes/:id/estado',requiereAdmin, async (req, res) => {

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

app.get('/api/ventas',requiereAutenticacion, async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                v.id_venta,
                v.fecha,
                v.canal,
                v.estado_pago,
                v.total,
                s.nombre AS sucursal,
                c.nombre AS cliente
            FROM ventas v
            JOIN sucursales s
                ON v.id_sucursal = s.id_sucursal
            LEFT JOIN clientes c
                ON v.id_cliente = c.id_cliente
            ORDER BY v.fecha DESC
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener historial de ventas'
        });

    }

});

app.get('/api/ventas/:id/detalle',requiereAutenticacion, async (req, res) => {

    const idVenta = Number(req.params.id);

    try {

        const resultado = await pool.query(`
            SELECT
                p.nombre AS producto,
                v.color,
                v.talla,
                d.cantidad,
                d.precio_unitario,
                d.cantidad * d.precio_unitario AS subtotal
            FROM detalle_venta d
            JOIN variantes v
                ON d.id_variante = v.id_variante
            JOIN productos p
                ON v.id_producto = p.id_producto
            WHERE d.id_venta = $1
        `, [
            idVenta
        ]);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener detalle de venta'
        });

    }

});

app.get('/api/sucursales',requiereAutenticacion, async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                id_sucursal,
                nombre
            FROM sucursales
            WHERE activo = TRUE
            ORDER BY nombre
        `);

        res.json(resultado.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener sucursales'
        });

    }

});

app.get('/api/reportes/vendedores', requiereAutenticacion, async (req, res) => {

    try {

        if (
            req.session.usuario.rol !==
            'administrador'
        ) {

            return res.json([
                {
                    id_usuario:
                        req.session.usuario.id_usuario,
                    nombre:
                        req.session.usuario.nombre
                }
            ]);

        }

        const resultado =
            await pool.query(`
                SELECT
                    id_usuario,
                    nombre
                FROM usuarios
                WHERE activo = TRUE
                ORDER BY nombre
            `);

        res.json(
            resultado.rows
        );

    } catch (error) {

        console.error(
            'Error al obtener usuarios para reportes:',
            error
        );

        res.status(500).json({
            mensaje:
                'Error al obtener usuarios para reportes'
        });

    }

});


app.get('/api/reportes', requiereAutenticacion, async (req, res) => {

    const {
        desde,
        hasta,
        id_sucursal,
        id_categoria,
        id_usuario
    } = req.query;

    try {

        const condiciones = [];
        const valores = [];

        if (desde) {

            valores.push(desde);

            condiciones.push(
                `ve.fecha::date >= $${valores.length}`
            );

        }

        if (hasta) {

            valores.push(hasta);

            condiciones.push(
                `ve.fecha::date <= $${valores.length}`
            );

        }

        if (id_sucursal) {

            const idSucursal =
                Number(id_sucursal);

            if (
                !Number.isInteger(idSucursal) ||
                idSucursal <= 0
            ) {

                return res.status(400).json({
                    mensaje:
                        'La sucursal seleccionada no es válida'
                });

            }

            valores.push(
                idSucursal
            );

            condiciones.push(
                `ve.id_sucursal = $${valores.length}`
            );

        }

        if (id_categoria) {

            const idCategoria =
                Number(id_categoria);

            if (
                !Number.isInteger(idCategoria) ||
                idCategoria <= 0
            ) {

                return res.status(400).json({
                    mensaje:
                        'La categoría seleccionada no es válida'
                });

            }

            valores.push(
                idCategoria
            );

            condiciones.push(
                `p.id_categoria = $${valores.length}`
            );

        }

        if (
            req.session.usuario.rol ===
            'administrador'
        ) {

            if (id_usuario) {

                const idUsuario =
                    Number(id_usuario);

                if (
                    !Number.isInteger(idUsuario) ||
                    idUsuario <= 0
                ) {

                    return res.status(400).json({
                        mensaje:
                            'El usuario seleccionado no es válido'
                    });

                }

                valores.push(
                    idUsuario
                );

                condiciones.push(
                    `ve.id_usuario = $${valores.length}`
                );

            }

        } else {

            valores.push(
                req.session.usuario.id_usuario
            );

            condiciones.push(
                `ve.id_usuario = $${valores.length}`
            );

        }

        const where =
            condiciones.length > 0
                ? `WHERE ${condiciones.join(' AND ')}`
                : '';

        const desdeTablas = `
            FROM detalle_venta d

            JOIN ventas ve
                ON d.id_venta = ve.id_venta

            JOIN variantes va
                ON d.id_variante = va.id_variante

            JOIN productos p
                ON va.id_producto = p.id_producto

            JOIN categorias c
                ON p.id_categoria = c.id_categoria

            JOIN sucursales s
                ON ve.id_sucursal = s.id_sucursal

            JOIN usuarios u
                ON ve.id_usuario = u.id_usuario

            LEFT JOIN clientes cl
                ON ve.id_cliente = cl.id_cliente
        `;

        const resumen =
            await pool.query(`
                SELECT
                    COALESCE(
                        SUM(
                            d.cantidad *
                            d.precio_unitario
                        ),
                        0
                    ) AS total,

                    COUNT(
                        DISTINCT ve.id_venta
                    ) AS ventas,

                    COALESCE(
                        SUM(d.cantidad),
                        0
                    ) AS unidades

                ${desdeTablas}

                ${where}
            `, valores);

        const ventasPorDia =
            await pool.query(`
                SELECT
                    ve.fecha::date AS fecha,

                    SUM(
                        d.cantidad *
                        d.precio_unitario
                    ) AS total

                ${desdeTablas}

                ${where}

                GROUP BY
                    ve.fecha::date

                ORDER BY
                    ve.fecha::date
            `, valores);

        const productosMasVendidos =
            await pool.query(`
                SELECT
                    p.nombre AS producto,

                    SUM(
                        d.cantidad
                    ) AS cantidad

                ${desdeTablas}

                ${where}

                GROUP BY
                    p.id_producto,
                    p.nombre

                ORDER BY
                    cantidad DESC

                LIMIT 5
            `, valores);

        const detalle =
            await pool.query(`
                SELECT
                    ve.id_venta,
                    ve.fecha,

                    COALESCE(
                        cl.nombre,
                        'Sin cliente'
                    ) AS cliente,

                    s.nombre AS sucursal,
                    u.nombre AS vendedor,
                    ve.canal,
                    c.nombre AS categoria,
                    p.nombre AS producto,
                    va.color,
                    va.talla,
                    d.cantidad,
                    d.precio_unitario,

                    (
                        d.cantidad *
                        d.precio_unitario
                    ) AS subtotal

                ${desdeTablas}

                ${where}

                ORDER BY
                    ve.fecha DESC,
                    ve.id_venta DESC

                LIMIT 500
            `, valores);

        const condicionesStock = [];
        const valoresStock = [];

        if (id_sucursal) {

            valoresStock.push(
                Number(id_sucursal)
            );

            condicionesStock.push(
                `i.id_sucursal = $${valoresStock.length}`
            );

        }

        if (id_categoria) {

            valoresStock.push(
                Number(id_categoria)
            );

            condicionesStock.push(
                `p.id_categoria = $${valoresStock.length}`
            );

        }

        condicionesStock.push(
            'i.stock_minimo IS NOT NULL'
        );

        condicionesStock.push(
            'i.stock_actual <= i.stock_minimo'
        );

        const whereStock =
            `WHERE ${condicionesStock.join(' AND ')}`;

        const stockCritico =
            await pool.query(`
                SELECT
                    p.nombre AS producto,
                    va.color,
                    va.talla,
                    s.nombre AS sucursal,
                    i.stock_actual,
                    i.stock_minimo

                FROM inventario i

                JOIN variantes va
                    ON i.id_variante = va.id_variante

                JOIN productos p
                    ON va.id_producto = p.id_producto

                JOIN sucursales s
                    ON i.id_sucursal = s.id_sucursal

                ${whereStock}

                ORDER BY
                    i.stock_actual ASC,
                    p.nombre,
                    va.color,
                    va.talla
            `, valoresStock);

        const total =
            Number(
                resumen.rows[0].total
            );

        const cantidadVentas =
            Number(
                resumen.rows[0].ventas
            );

        const unidades =
            Number(
                resumen.rows[0].unidades
            );

        const ticketPromedio =
            cantidadVentas > 0
                ? total / cantidadVentas
                : 0;

        res.json({

            resumen: {
                total,
                cantidadVentas,
                unidades,
                ticketPromedio,
                cantidadStockCritico:
                    stockCritico.rows.length
            },

            ventasPorDia:
                ventasPorDia.rows,

            productosMasVendidos:
                productosMasVendidos.rows,

            detalle:
                detalle.rows,

            stockCritico:
                stockCritico.rows

        });

    } catch (error) {

        console.error(
            'Error al generar reporte:',
            error
        );

        res.status(500).json({
            mensaje:
                'Error al generar reporte'
        });

    }

});


// Inicia el servidor
app.listen(PORT, () => {

    console.log(
        `Servidor ejecutándose en http://localhost:${PORT}`
    );

});