# Manual de usuario: Responsable de planta

Este manual explica lo básico para operar la plataforma como responsable de planta.

También puedes consultar:
- [Inicio de sesión](./common/login.md)
- [Recuperar cuenta](./common/recover_account.md)
- [Navegación general](./common/general_navigation.md)
- [Información personal](./common/profile_info.md)
- [Notificaciones](./common/notifies.md)
- [Carga masiva](./common/massive.md)
- [Exportar información](./common/export_data.md)

## Índice <!-- omit in toc -->
- [Plantas](#plantas)
- [Expendios](#expendios)
- [Productos](#productos)
- [Repartos](#repartos)
- [Inventarios](#inventarios)
- [Mediciones](#mediciones)
- [Ventas](#ventas)
- [Usuarios](#usuarios)

## Plantas

En este módulo puedes ver todas las plantas registradas y administrarlas.

### ¿Qué puedes hacer?
- Agregar una planta con el botón Agregar Planta.
- Ver nombre, municipio, colonia, calle y número.
- Editar un registro con el botón de lápiz.
- Eliminar un registro con el botón de basura.

![img](./imgs/factory_module.png)

---

## Expendios

Este módulo funciona igual que Plantas, pero para los expendios.

### ¿Qué puedes hacer?
- Consultar la lista de expendios.
- Agregar nuevos expendios.
- Editar su información.
- Eliminar expendios que ya no sean necesarios.

![img](./imgs/store_module.png)

---

## Productos

Este módulo actúa como catálogo central de mercancía.

### ¿Qué puedes ver?
- Código o SKU.
- Nombre del producto.
- Precio.
- Variantes, si existen.

### ¿Qué puedes hacer?
- Agregar productos uno por uno.
- Usar la carga masiva para subir muchos productos desde un archivo Excel.

> Consulta el manual de carga masiva para más detalles.

![img](./imgs/_)

---

## Repartos

Aquí se administra el movimiento de productos desde la planta hacia los expendios.

### Estados de un reparto
- Pendiente: está registrado y esperando confirmación.
- En progreso: ya fue confirmado y está en tránsito.
- Completado: fue recibido correctamente.
- Cancelado: tuvo un problema y se detuvo.

### Acciones disponibles
- Si un reparto está pendiente o cancelado, puedes editarlo.
- Si aún no está completado, puedes moverlo a otro estado con los botones de acción.
- Puedes revisar el contenido del envío y su destino.

![img](./imgs/_)

---

## Inventarios

Este módulo muestra la existencia de productos por expendio.

### ¿Para qué sirve?
- Revisar cuánto producto hay disponible.
- Verificar inventario por establecimiento.
- Ayudar a decidir si se requiere más producción o más envíos.

![img](./imgs/_)

---

## Mediciones

Aquí se revisa el historial de tiempos registrados por estaciones o procesos.

### ¿Qué puedes ver?
- Total de mediciones.
- Tiempo promedio.
- Tiempo mínimo.
- Tiempo máximo.

También puedes filtrar por estación y por proceso para comparar resultados.

![img](./imgs/_)

---

## Ventas

Este módulo muestra el historial de ventas realizadas en los expendios.

### Lo que debes saber
- Las ventas se registran en efectivo.
- Puedes ver quién hizo la venta, la fecha, los productos y el total.
- En la columna de acciones puedes abrir el ticket de una venta para revisarlo o imprimirlo.

![img](./imgs/_)

---

## Usuarios

En este módulo se administran los accesos al sistema.

### ¿Qué puedes hacer?
- Crear un usuario nuevo.
- Asignar un rol:
  - Responsable de planta
  - Responsable de expendio
- Vincularlo a la planta o expendio correspondiente.
- Editar o eliminar usuarios.

> El sistema envía un correo con instrucciones para que la persona pueda iniciar sesión.

![img](./imgs/_)

---

_Versión del manual: 1.0_
