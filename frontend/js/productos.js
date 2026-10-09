const productoForm =
    document.getElementById('productoForm');

const tablaProductos =
    document.getElementById('tablaProductos');

const categoriaSelect =
    document.getElementById('categoriaProducto');

const mensajeProducto =
    document.getElementById('mensajeProducto');

const varianteForm =
    document.getElementById('varianteForm');

const productoVariante =
    document.getElementById('productoVariante');

const mensajeVariante =
    document.getElementById('mensajeVariante');
// ==========================
// CARGAR CATEGORÍAS
// ==========================

async function cargarCategorias() {

    try {

        const respuesta =
            await fetch('/api/categorias');

        const categorias =
            await respuesta.json();

        categoriaSelect.innerHTML =
            '<option value="">Seleccione una categoría</option>';

        categorias.forEach(categoria => {

            const opcion =
                document.createElement('option');

            opcion.value =
                categoria.id_categoria;

            opcion.textContent =
                categoria.nombre;

            categoriaSelect.appendChild(opcion);

        });

    } catch (error) {

        console.error(error);

    }

}


// ==========================
// CARGAR PRODUCTOS
// ==========================

async function cargarProductos() {

    try {

        const respuesta = await fetch('/api/productos');

        const productos = await respuesta.json();

        // Limpiar tabla
        tablaProductos.innerHTML = '';

        // Limpiar selector de variantes
        productoVariante.innerHTML =
            '<option value="">Seleccione un producto</option>';


        productos.forEach(producto => {

            // =========================
            // TABLA DE PRODUCTOS
            // =========================

            const fila = document.createElement('tr');

            const precio =
                Number(producto.precio)
                    .toLocaleString('es-CL');

            fila.innerHTML = `
                <td>${producto.nombre}</td>
                <td>${producto.categoria}</td>
                <td>$${precio}</td>
                <td>
                    ${producto.activo
                        ? 'Activo'
                        : 'Inactivo'}
                </td>
            `;

            tablaProductos.appendChild(fila);


            // =========================
            // SELECT DE VARIANTES
            // =========================

            if (producto.activo) {

                const opcion =
                    document.createElement('option');

                opcion.value =
                    producto.id_producto;

                opcion.textContent =
                    producto.nombre;

                productoVariante.appendChild(opcion);

            }

        });

    } catch (error) {

        console.error(
            'Error al cargar productos:',
            error
        );

    }

}


// ==========================
// AGREGAR PRODUCTO
// ==========================

productoForm.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();

        const producto = {

            nombre:
                document
                    .getElementById('nombreProducto')
                    .value
                    .trim(),

            descripcion:
                document
                    .getElementById('descripcionProducto')
                    .value
                    .trim(),

            id_categoria:
                Number(categoriaSelect.value),

            precio:
                Number(
                    document
                        .getElementById('precioProducto')
                        .value
                )

        };

        const respuesta =
            await fetch('/api/productos', {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(producto)

            });

        const resultado =
            await respuesta.json();

        mensajeProducto.textContent =
            resultado.mensaje;

        if (respuesta.ok) {

            productoForm.reset();

            await cargarProductos();

        }

    }
);

varianteForm.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();

        const variante = {

            id_producto:
                Number(productoVariante.value),

            color:
                document
                    .getElementById('colorVariante')
                    .value
                    .trim(),

            talla:
                document
                    .getElementById('tallaVariante')
                    .value
                    .trim(),

            sku:
                document
                    .getElementById('skuVariante')
                    .value
                    .trim(),

            stock_rancagua:
                Number(
                    document
                        .getElementById('stockRancagua')
                        .value
                ),

            minimo_rancagua:
                document
                    .getElementById('minimoRancagua')
                    .value,

            stock_bodega:
                Number(
                    document
                        .getElementById('stockBodega')
                        .value
                ),

            minimo_bodega:
                document
                    .getElementById('minimoBodega')
                    .value

        };


        const respuesta =
            await fetch('/api/variantes', {

                method: 'POST',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(variante)

            });


        const resultado =
            await respuesta.json();


        mensajeVariante.textContent =
            resultado.mensaje;


        if (respuesta.ok) {

            varianteForm.reset();

            document
                .getElementById('stockRancagua')
                .value = 0;

            document
                .getElementById('stockBodega')
                .value = 0;

        }

    }
);


cargarCategorias();
cargarProductos();