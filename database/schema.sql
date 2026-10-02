-- =========================================
-- BASE DE DATOS BIGCURVAS
-- Esquema inicial
-- =========================================


-- =========================
-- USUARIOS
-- =========================

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =========================
-- CLIENTES
-- =========================

CREATE TABLE clientes (
    id_cliente SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    rut VARCHAR(20) UNIQUE,
    telefono VARCHAR(30),
    correo VARCHAR(150),
    direccion VARCHAR(255),
    comuna VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =========================
-- CATEGORIAS
-- =========================

CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =========================
-- PRODUCTOS
-- =========================

CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    id_categoria INTEGER NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,

    FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria)
);


-- =========================
-- VARIANTES
-- =========================

CREATE TABLE variantes (
    id_variante SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL,
    talla VARCHAR(20) NOT NULL,
    color VARCHAR(50) NOT NULL,
    sku VARCHAR(100) UNIQUE,

    FOREIGN KEY (id_producto)
        REFERENCES productos(id_producto)
);


-- =========================
-- SUCURSALES
-- =========================

CREATE TABLE sucursales (
    id_sucursal SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);


-- =========================
-- INVENTARIO
-- =========================

CREATE TABLE inventario (
    id_inventario SERIAL PRIMARY KEY,
    id_variante INTEGER NOT NULL,
    id_sucursal INTEGER NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER,

    FOREIGN KEY (id_variante)
        REFERENCES variantes(id_variante),

    FOREIGN KEY (id_sucursal)
        REFERENCES sucursales(id_sucursal),

    UNIQUE (id_variante, id_sucursal),

    CHECK (stock_actual >= 0),
    CHECK (stock_minimo IS NULL OR stock_minimo >= 0)
);


-- =========================
-- VENTAS
-- =========================

CREATE TABLE ventas (
    id_venta SERIAL PRIMARY KEY,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INTEGER NOT NULL,
    id_cliente INTEGER,
    id_sucursal INTEGER NOT NULL,
    canal VARCHAR(50) NOT NULL,
    estado_pago VARCHAR(50),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0,

    FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario),

    FOREIGN KEY (id_cliente)
        REFERENCES clientes(id_cliente),

    FOREIGN KEY (id_sucursal)
        REFERENCES sucursales(id_sucursal)
);


-- =========================
-- DETALLE DE VENTA
-- =========================

CREATE TABLE detalle_venta (
    id_detalle SERIAL PRIMARY KEY,
    id_venta INTEGER NOT NULL,
    id_variante INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC(10, 2) NOT NULL,

    FOREIGN KEY (id_venta)
        REFERENCES ventas(id_venta),

    FOREIGN KEY (id_variante)
        REFERENCES variantes(id_variante),

    CHECK (cantidad > 0),
    CHECK (precio_unitario >= 0)
);