# Plan de pruebas - CurvaStock

Este documento reúne pruebas funcionales y de permisos para validar el sistema antes de la entrega.

## Preparación

1. Iniciar PostgreSQL.
2. Ejecutar el servidor con:
   ```powershell
   npm start
   ```
3. Tener al menos:
   - un usuario administrador activo;
   - una usuaria vendedora activa;
   - productos con variantes y stock;
   - al menos un cliente de prueba.

## 1. Autenticación y sesiones

| Prueba | Resultado esperado |
| --- | --- |
| Iniciar sesión con credenciales correctas | Acceso al dashboard |
| Iniciar sesión con contraseña incorrecta | Mensaje de credenciales incorrectas |
| Iniciar sesión con usuario desactivado | Acceso rechazado |
| Abrir una página protegida sin sesión | Redirección al login |
| Cerrar sesión | Regreso al login |
| Desactivar una cuenta que mantiene sesión abierta | La sesión deja de ser válida en la siguiente acción |
| Cambiar el rol de una cuenta con sesión abierta | Los permisos se actualizan en la siguiente acción |

## 2. Permisos de administrador

El administrador debe poder:

- registrar ventas;
- visualizar y editar inventario;
- crear, editar y activar/desactivar productos;
- agregar variantes;
- visualizar, crear y editar clientes;
- activar/desactivar clientes;
- visualizar historial;
- generar y exportar reportes;
- administrar usuarios;
- cambiar contraseñas de usuarios.

Pruebas especiales:

| Prueba | Resultado esperado |
| --- | --- |
| Intentar desactivar la propia cuenta | Operación rechazada |
| Intentar quitarse a sí mismo el rol de administrador | Operación rechazada |
| Intentar desactivar al último administrador activo | Operación rechazada |

## 3. Permisos de vendedora

La vendedora debe poder:

- visualizar dashboard personalizado;
- registrar ventas;
- consultar inventario;
- consultar productos;
- crear y editar clientes;
- visualizar historial;
- generar reportes de sus ventas;
- exportar reportes.

La vendedora no debe poder:

- editar inventario;
- crear o editar productos;
- agregar variantes;
- activar/desactivar productos;
- activar/desactivar clientes;
- entrar al módulo Usuarios;
- ejecutar rutas de administración de usuarios.

## 4. Inventario

| Prueba | Resultado esperado |
| --- | --- |
| Buscar producto, color o talla | La tabla se filtra |
| Filtrar por sucursal | Solo se muestran registros de esa sucursal |
| Filtrar por estado | Se muestran Disponible, Stock bajo o Sin stock según corresponda |
| Editar stock como administrador | El valor se actualiza |
| Intentar editar stock como vendedora | Operación no permitida |

## 5. Productos

| Prueba | Resultado esperado |
| --- | --- |
| Buscar producto | Coincidencias correctas |
| Filtrar por categoría | Coincidencias correctas |
| Ver variantes | Se muestran talla, color, SKU y stock por sucursal |
| Crear producto como administrador | Producto agregado |
| Agregar variante | Variante y stock por sucursal creados |
| Desactivar producto | Producto queda inactivo |
| Intentar modificar como vendedora | Operación no permitida |

## 6. Clientes

| Prueba | Resultado esperado |
| --- | --- |
| Buscar por nombre, RUT, teléfono, correo o comuna | Coincidencias correctas |
| Filtrar Activo/Inactivo | Coincidencias correctas |
| Ingresar RUT inválido | Formulario rechaza el dato |
| Ingresar correo inválido | Formulario rechaza el dato |
| Crear cliente | Cliente agregado |
| Editar cliente | Datos actualizados |
| Desactivar cliente como administrador | Cliente queda inactivo |
| Desactivar cliente como vendedora | Operación no permitida |

## 7. Registro de ventas

| Prueba | Resultado esperado |
| --- | --- |
| Buscar cliente por nombre o RUT | Aparecen sugerencias |
| Buscar producto | Aparecen sugerencias con stock |
| Agregar varios productos | Se agregan al carrito |
| Aumentar/disminuir cantidad | Se respeta el stock disponible |
| Intentar superar el stock | Operación rechazada |
| Intentar mezclar sucursales en una venta | Operación rechazada |
| Registrar venta Local | Venta guardada con canal Local |
| Registrar venta Online | Venta guardada con canal Online |
| Confirmar venta | El stock se descuenta automáticamente |

## 8. Historial de ventas

| Prueba | Resultado esperado |
| --- | --- |
| Buscar por número o cliente | Coincidencias correctas |
| Filtrar por fecha | Coincidencias correctas |
| Filtrar por sucursal | Coincidencias correctas |
| Filtrar por cliente | Coincidencias correctas |
| Filtrar por canal | Coincidencias correctas |
| Abrir detalle | Productos, variantes, cantidades y total correctos |
| Combinar varios filtros | El contador y total se recalculan |

## 9. Reportes

| Prueba | Resultado esperado |
| --- | --- |
| Filtro Hoy | Solo ventas del día |
| Filtro Últimos 7 días | Periodo correcto |
| Filtro Este mes | Periodo correcto |
| Filtrar por sucursal | Datos correctos |
| Filtrar por categoría | Datos correctos |
| Filtrar por usuario como administrador | Solo ventas registradas por ese usuario |
| Abrir reporte como vendedora | Solo sus ventas |
| Stock crítico | Variantes bajo o igual al mínimo |
| Exportar Excel | Archivo con Resumen, Ventas y Stock crítico |
| Exportar PDF | Documento con resumen, detalle y stock crítico |

## 10. Verificación técnica

Desde la raíz del proyecto ejecutar:

```powershell
npm test
```

El comando debe finalizar mostrando que todos los archivos JavaScript tienen sintaxis correcta.

---

Estas pruebas sirven como lista de comprobación antes de la entrega y también como evidencia de validación funcional del proyecto.
