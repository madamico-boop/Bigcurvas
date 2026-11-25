const tablaInventario = document.getElementById('tablaInventario');
const editarInventarioSection = document.getElementById('editarInventarioSection');
const editarInventarioForm = document.getElementById('editarInventarioForm');
const inventarioSeleccionado = document.getElementById('inventarioSeleccionado');
const editarStockActual = document.getElementById('editarStockActual');
const editarStockMinimo = document.getElementById('editarStockMinimo');
const cancelarInventario = document.getElementById('cancelarInventario');
const mensajeInventario = document.getElementById('mensajeInventario');
const buscarInventario = document.getElementById('buscarInventario');
const filtroSucursal = document.getElementById('filtroSucursal');
const filtroEstado = document.getElementById('filtroEstado');
const limpiarFiltrosInventario = document.getElementById('limpiarFiltrosInventario');
const contadorInventario = document.getElementById('contadorInventario');

let inventarioEditandoId = null;
let usuarioActual = null;
let inventarioCompleto = [];

function escaparHtml(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function obtenerEstado(item) {
    if (Number(item.stock_actual) === 0) return 'Sin stock';
    if (item.stock_minimo !== null && Number(item.stock_actual) <= Number(item.stock_minimo)) return 'Stock bajo';
    return 'Disponible';
}

function obtenerClaseEstado(estado) {
    if (estado === 'Sin stock') return 'estado-sin-stock';
    if (estado === 'Stock bajo') return 'estado-stock-bajo';
    return 'estado-disponible';
}

async function cargarUsuario() {
    try {
        const respuesta = await fetch('/api/auth/me', { credentials: 'include' });
        if (!respuesta.ok) {
            window.location.href = 'index.html';
            return false;
        }
        const datos = await respuesta.json();
        usuarioActual = datos.usuario;
        return true;
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        window.location.href = 'index.html';
        return false;
    }
}

function cargarSucursalesFiltro() {
    const valorActual = filtroSucursal.value;
    const sucursales = [...new Set(inventarioCompleto.map(item => item.sucursal))].sort();
    filtroSucursal.innerHTML = '<option value="">Todas las sucursales</option>';
    sucursales.forEach(sucursal => {
        const opcion = document.createElement('option');
        opcion.value = sucursal;
        opcion.textContent = sucursal;
        filtroSucursal.appendChild(opcion);
    });
    if (sucursales.includes(valorActual)) filtroSucursal.value = valorActual;
}

function aplicarFiltros() {
    const texto = buscarInventario.value.trim().toLowerCase();
    const sucursal = filtroSucursal.value;
    const estado = filtroEstado.value;

    const filtrado = inventarioCompleto.filter(item => {
        const coincideTexto =
            !texto ||
            String(item.producto).toLowerCase().includes(texto) ||
            String(item.color).toLowerCase().includes(texto) ||
            String(item.talla).toLowerCase().includes(texto);

        const coincideSucursal = !sucursal || item.sucursal === sucursal;
        const coincideEstado = !estado || obtenerEstado(item) === estado;

        return coincideTexto && coincideSucursal && coincideEstado;
    });

    mostrarInventario(filtrado);
}

function mostrarInventario(inventario) {
    tablaInventario.innerHTML = '';
    contadorInventario.textContent = 'Mostrando ' + inventario.length + ' de ' + inventarioCompleto.length + ' registros';

    if (inventario.length === 0) {
        tablaInventario.innerHTML = '<tr><td colspan="8" class="sin-resultados">No hay registros que coincidan con los filtros seleccionados.</td></tr>';
        return;
    }

    const esAdmin = usuarioActual && usuarioActual.rol === 'administrador';

    inventario.forEach(item => {
        const estado = obtenerEstado(item);
        const claseEstado = obtenerClaseEstado(estado);
        const fila = document.createElement('tr');

        if (estado === 'Sin stock') fila.classList.add('fila-sin-stock');
        else if (estado === 'Stock bajo') fila.classList.add('fila-stock-bajo');

        let acciones = '-';
        if (esAdmin) {
            acciones = '<button class="boton-editar-inventario" type="button">Editar</button>';
        }

        fila.innerHTML =
            '<td>' + escaparHtml(item.producto) + '</td>' +
            '<td>' + escaparHtml(item.color) + '</td>' +
            '<td>' + escaparHtml(item.talla) + '</td>' +
            '<td>' + escaparHtml(item.sucursal) + '</td>' +
            '<td>' + item.stock_actual + '</td>' +
            '<td>' + (item.stock_minimo === null ? '-' : item.stock_minimo) + '</td>' +
            '<td><span class="estado-stock ' + claseEstado + '">' + estado + '</span></td>' +
            '<td>' + acciones + '</td>';

        tablaInventario.appendChild(fila);

        if (!esAdmin) return;

        const botonEditar = fila.querySelector('.boton-editar-inventario');
        botonEditar.addEventListener('click', () => {
            inventarioEditandoId = item.id_inventario;
            inventarioSeleccionado.textContent = item.producto + ' / ' + item.color + ' / ' + item.talla + ' / ' + item.sucursal;
            editarStockActual.value = item.stock_actual;
            editarStockMinimo.value = item.stock_minimo === null ? '' : item.stock_minimo;
            mensajeInventario.textContent = '';
            editarInventarioSection.hidden = false;
            editarInventarioSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

async function cargarInventario() {
    try {
        const respuesta = await fetch('/api/inventario', { credentials: 'include' });
        if (respuesta.status === 401) {
            window.location.href = 'index.html';
            return;
        }

        const inventario = await respuesta.json();
        if (!respuesta.ok) {
            console.error(inventario.mensaje);
            return;
        }

        inventarioCompleto = inventario;
        cargarSucursalesFiltro();
        aplicarFiltros();
    } catch (error) {
        console.error('Error al cargar inventario:', error);
    }
}

buscarInventario.addEventListener('input', aplicarFiltros);
filtroSucursal.addEventListener('change', aplicarFiltros);
filtroEstado.addEventListener('change', aplicarFiltros);

limpiarFiltrosInventario.addEventListener('click', () => {
    buscarInventario.value = '';
    filtroSucursal.value = '';
    filtroEstado.value = '';
    aplicarFiltros();
});

editarInventarioForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!usuarioActual || usuarioActual.rol !== 'administrador') {
        mensajeInventario.textContent = 'No tiene permisos para editar inventario';
        return;
    }

    if (!inventarioEditandoId) return;

    const datos = {
        stock_actual: Number(editarStockActual.value),
        stock_minimo: editarStockMinimo.value
    };

    try {
        const respuesta = await fetch('/api/inventario/' + inventarioEditandoId, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();
        mensajeInventario.textContent = resultado.mensaje;

        if (respuesta.ok) {
            inventarioEditandoId = null;
            editarInventarioSection.hidden = true;
            editarInventarioForm.reset();
            await cargarInventario();
        }
    } catch (error) {
        console.error('Error al actualizar inventario:', error);
        mensajeInventario.textContent = 'Error al actualizar inventario';
    }
});

cancelarInventario.addEventListener('click', () => {
    inventarioEditandoId = null;
    editarInventarioSection.hidden = true;
    editarInventarioForm.reset();
    mensajeInventario.textContent = '';
});

async function iniciar() {
    editarInventarioSection.hidden = true;
    const autenticado = await cargarUsuario();
    if (!autenticado) return;
    await cargarInventario();
}

iniciar();
