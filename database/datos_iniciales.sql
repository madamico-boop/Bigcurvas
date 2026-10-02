-- =========================================
-- DATOS INICIALES BIGCURVAS
-- Datos de prueba para desarrollo
-- =========================================


-- SUCURSALES

INSERT INTO sucursales (nombre)
VALUES
    ('Rancagua'),
    ('Bodega');


-- CATEGORIAS

INSERT INTO categorias (nombre)
VALUES
    ('Poleras'),
    ('Blusas'),
    ('Pantalones'),
    ('Palazos'),
    ('Vestidos');


-- PRODUCTOS

INSERT INTO productos (
    nombre,
    descripcion,
    id_categoria,
    precio
)
VALUES
(
    'Polera Oversize',
    'Polera oversize de prueba',
    1,
    15990
),
(
    'Palazo Jeans',
    'Palazo de jeans',
    4,
    24990
),
(
    'Blusa Casual',
    'Blusa casual de prueba',
    2,
    18990
);


-- VARIANTES

INSERT INTO variantes (
    id_producto,
    talla,
    color,
    sku
)
VALUES
    (1, 'XL', 'Negro', NULL),
    (1, '2XL', 'Negro', NULL),
    (1, 'XL', 'Rosado', NULL),

    (2, 'XXL', 'Celeste', NULL),
    (2, 'XL', 'Negro', NULL),

    (3, '3XL', 'Rosado', NULL);


-- INVENTARIO

INSERT INTO inventario (
    id_variante,
    id_sucursal,
    stock_actual,
    stock_minimo
)
VALUES
    (1, 1, 15, 5),
    (1, 2, 10, 5),

    (2, 1, 8, 3),
    (2, 2, 12, 3),

    (3, 1, 6, NULL),

    (4, 1, 5, 2),
    (4, 2, 14, 2),

    (5, 2, 7, NULL),

    (6, 1, 9, 3);