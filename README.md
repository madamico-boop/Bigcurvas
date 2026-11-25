# Bigcurvas

Sistema web para la gestión de inventario, ventas, clientes y reportes de **Bigcurvas**.

El proyecto centraliza el control de productos, variantes, stock por sucursal y ventas, reduciendo la dependencia de registros manuales y permitiendo descontar stock automáticamente al registrar una venta.

---

## Estado actual del proyecto

El sistema se encuentra funcional en entorno local y cuenta con autenticación, roles, inventario, productos, clientes, ventas, historial y reportes.

### Funcionalidades implementadas

- Inicio de sesión con sesiones de usuario.
- Contraseñas protegidas con bcrypt.
- Roles de **Administrador** y **Vendedora**.
- Dashboard diferenciado según el rol.
- Inventario por sucursal con buscador y filtros por sucursal y estado.
- Estados visuales para stock disponible, stock bajo y sin stock.
- Sucursales actuales:
  - Rancagua
  - Bodega
- Productos organizados por categorías.
- Buscador y filtros de productos por categoría y estado.
- Variantes por talla y color.
- Consulta de variantes existentes con stock de Rancagua y Bodega.
- SKU opcional por variante.
- Stock actual y stock mínimo por sucursal.
- Estados de inventario:
  - Disponible
  - Stock bajo
  - Sin stock
- Registro de ventas con múltiples productos.
- Buscador de clientes por nombre o RUT durante la venta.
- Buscador de productos con sugerencias y stock disponible.
- Carrito con controles para aumentar, disminuir o quitar productos.
- Validación de stock disponible antes de confirmar una venta.
- Una misma venta utiliza una única sucursal.
- Selección de canal de venta: Local u Online.
- Descuento automático de stock al confirmar una venta.
- Cliente opcional en una venta.
- Historial de ventas con filtros por fecha, sucursal, cliente y canal.
- Búsqueda de ventas por número de venta o cliente.
- Resumen de cantidad de ventas y total vendido según los filtros.
- Detalle de venta con productos, variantes, cantidades, subtotales y total.
- Gestión de clientes.
- Activación y desactivación de productos y clientes.
- Reportes con filtros por:
  - Fecha
  - Sucursal
  - Categoría
- Indicadores de ventas.
- Gráficos con Chart.js.
- Exportación de reportes a PDF y Excel.
- Cierre de sesión.
- Interfaz responsive con diseño unificado.

---

## Permisos por rol

| Funcionalidad | Administrador | Vendedora |
| --- | :---: | :---: |
| Dashboard | Completo | Personalizado |
| Registrar ventas | ✅ | ✅ |
| Ver inventario | ✅ | ✅ |
| Editar stock | ✅ | ❌ |
| Ver productos | ✅ | ✅ |
| Crear / editar productos | ✅ | ❌ |
| Crear variantes | ✅ | ❌ |
| Activar / desactivar productos | ✅ | ❌ |
| Ver clientes | ✅ | ✅ |
| Crear clientes | ✅ | ✅ |
| Editar clientes | ✅ | ✅ |
| Activar / desactivar clientes | ✅ | ❌ |
| Ver historial de ventas | ✅ | ✅ |
| Generar reportes | ✅ | ✅ |
| Exportar PDF / Excel | ✅ | ✅ |

---

## Tecnologías utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript
- Chart.js
- SheetJS
- jsPDF
- jsPDF AutoTable

### Backend
- Node.js
- Express.js
- express-session
- bcryptjs

### Base de datos
- PostgreSQL
- pg

### Herramientas
- Git
- GitHub
- Postman
- Visual Studio Code
- pgAdmin 4

---

## Estructura principal

```text
Bigcurvas/
├── backend/
│   ├── config/
│   │   └── db.js
│   └── server.js
│
├── database/
│   ├── schema.sql
│   └── datos_iniciales.sql
│
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── clientes.js
│   │   ├── dashboard.js
│   │   ├── historial.js
│   │   ├── inventario.js
│   │   ├── login.js
│   │   ├── productos.js
│   │   ├── reportes.js
│   │   ├── sesion.js
│   │   └── ventas.js
│   ├── clientes.html
│   ├── dashboard.html
│   ├── historial.html
│   ├── index.html
│   ├── inventario.html
│   ├── productos.html
│   ├── reportes.html
│   └── ventas.html
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

> El archivo `.env` no se almacena en GitHub.

---

# Cómo ejecutar el proyecto

## 1. Requisitos

Tener instalado:

- Node.js
- npm
- Git
- PostgreSQL
- pgAdmin 4 o una herramienta equivalente

Puedes comprobar las instalaciones con:

```powershell
node -v
npm -v
git --version
psql --version
```

---

## 2. Clonar el repositorio

```powershell
git clone https://github.com/madamico-boop/Bigcurvas.git
cd Bigcurvas
```

---

## 3. Instalar dependencias

Desde la raíz del proyecto:

```powershell
npm install
```

---

## 4. Crear la base de datos

Crear una base de datos PostgreSQL para el proyecto.

Ejemplo:

```sql
CREATE DATABASE bigcurvas_db;
```

Luego ejecutar, en este orden:

1. `database/schema.sql`
2. `database/datos_iniciales.sql`

El primer archivo crea las tablas y relaciones.

El segundo agrega datos iniciales de prueba, incluyendo:

- Sucursales Rancagua y Bodega.
- Categorías.
- Productos.
- Variantes.
- Stock inicial.

---

## 5. Crear el archivo .env

En la raíz del proyecto crear:

```text
.env
```

Ejemplo de configuración:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bigcurvas_db
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_POSTGRES

SESSION_SECRET=CAMBIA_ESTA_CLAVE_POR_UNA_CLAVE_SEGURA
```

Los valores deben coincidir con la configuración local de PostgreSQL.

---

## 6. Crear el primer usuario administrador

Los datos iniciales no incluyen contraseñas de usuarios.

Primero genera un hash bcrypt desde la raíz del proyecto:

```powershell
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('TU_PASSWORD',10).then(console.log)"
```

Copia el hash generado y crea el usuario en PostgreSQL:

```sql
INSERT INTO usuarios (
    nombre,
    correo,
    password_hash,
    rol,
    activo
)
VALUES (
    'Administrador',
    'admin@bigcurvas.cl',
    'PEGA_AQUI_EL_HASH_GENERADO',
    'administrador',
    TRUE
);
```

Para crear una cuenta de vendedora se utiliza el mismo procedimiento, cambiando el rol por:

```text
vendedora
```

---

## 7. Iniciar el servidor

Desde la raíz del proyecto:

```powershell
node backend/server.js
```

Si todo está configurado correctamente debería aparecer:

```text
Servidor ejecutándose en http://localhost:3000
```

---

## 8. Abrir el sistema

Abrir en el navegador:

```text
http://localhost:3000
```

Inicia sesión con uno de los usuarios creados en la base de datos.

---

# Base de datos

El sistema utiliza las siguientes tablas principales:

- usuarios
- clientes
- categorias
- productos
- variantes
- sucursales
- inventario
- ventas
- detalle_venta

Las ventas se almacenan junto con sus detalles y el stock se descuenta dentro de la misma operación para mantener la consistencia de los datos.

---

# Pendientes y mejoras futuras

El sistema ya cubre el flujo principal de inventario, productos, clientes, ventas, historial y reportes. Entre las mejoras que todavía se pueden incorporar se encuentran:

- Buscador y filtros adicionales en el módulo de clientes.
- Edición de variantes existentes desde la interfaz.
- Filtros rápidos en reportes.
- Reportes adicionales por vendedora y stock crítico.
- Gestión más completa de estados o métodos de pago.
- Administración de usuarios desde la interfaz.
- Cambio de contraseña desde el sistema.
- Mejoras adicionales de validación y seguridad.
- Pruebas automatizadas.
- Preparación para despliegue en un entorno de producción.
- Integración con WooCommerce para sincronizar ventas y stock del canal online.

---

## Integración con WooCommerce

La integración con WooCommerce se considera una etapa futura.

El objetivo es sincronizar el sistema con el canal de venta online para evitar diferencias entre el stock disponible en la web y el inventario administrado por Bigcurvas.

Actualmente **WooCommerce todavía no está integrado**.

---

## Proyecto académico

Proyecto desarrollado como parte del proyecto de título para mejorar la gestión de inventario y ventas de Bigcurvas.
