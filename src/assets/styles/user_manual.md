# Manual de Usuario — Cookiexpend

## Sistema de medición IoT para el control de tiempos de producción

**Proyecto:** CookieXpend
**Tipo de sistema:** Aplicación web con integración IoT
**Versión:** 1.0
**Tecnologías principales:** React, TypeScript, Django, REST API, MySQL, ESP32 y Postman.

---

# 1. Introducción

CookieXpend es un sistema orientado al registro y consulta de tiempos asociados a diferentes procesos de producción. El sistema integra dispositivos **ESP32** instalados en estaciones de medición con una aplicación web que permite consultar, filtrar y analizar las mediciones obtenidas.

El dispositivo ESP32 funciona como elemento de captura de información. Mediante un botón conectado al dispositivo, el operador puede iniciar y detener el cronómetro correspondiente al proceso que se está realizando.

Una vez finalizada la medición, el ESP32 envía la información mediante una solicitud HTTP hacia la API del sistema. La API procesa la información y la almacena en la base de datos.

La aplicación web permite posteriormente consultar las mediciones registradas, identificando:

* Estación donde se realizó la medición.
* Proceso asociado.
* Tiempo registrado.
* Fecha y hora de la medición.

Además, el sistema cuenta con filtros y estadísticas que permiten analizar los registros obtenidos.

---

# 2. Objetivo del sistema

El objetivo principal de CookieXpend es facilitar el registro y seguimiento de los tiempos de producción mediante dispositivos IoT conectados a una plataforma web.

El sistema permite:

1. Registrar automáticamente los tiempos de producción.
2. Identificar la estación que realizó cada medición.
3. Identificar el proceso asociado.
4. Almacenar las mediciones en una base de datos.
5. Consultar el historial de mediciones.
6. Filtrar las mediciones por estación y proceso.
7. Obtener estadísticas de los tiempos registrados.
8. Exportar información desde la interfaz web.
9. Centralizar la información generada por las estaciones de medición.

---

# 3. Arquitectura general

El sistema está compuesto por tres elementos principales:

```text
┌─────────────────────┐
│       ESP32         │
│                     │
│ Botón de medición   │
│ Estación / Proceso  │
└──────────┬──────────┘
           │
           │ HTTP / JSON
           ▼
┌─────────────────────┐
│       API REST      │
│                     │
│ Autenticación       │
│ Validación          │
│ Procesamiento       │
└──────────┬──────────┘
           │
           │
           ▼
┌─────────────────────┐
│      MySQL          │
│                     │
│ Mediciones          │
│ Usuarios            │
│ Información sistema │
└──────────┬──────────┘
           │
           │ HTTP / API
           ▼
┌─────────────────────┐
│    Aplicación Web   │
│                     │
│ Dashboard           │
│ Mediciones          │
│ Filtros             │
│ Estadísticas        │
└─────────────────────┘
```

El flujo general de una medición es:

```text
Operador
   │
   ▼
Presiona botón
   │
   ▼
ESP32 inicia cronómetro
   │
   ▼
Proceso de producción
   │
   ▼
Operador presiona botón
   │
   ▼
ESP32 detiene cronómetro
   │
   ▼
Se obtiene tiempo en milisegundos
   │
   ▼
ESP32 envía medición
   │
   ▼
API REST
   │
   ▼
Base de datos
   │
   ▼
Dashboard web
```

---

# 4. Requisitos para utilizar el sistema

Para utilizar correctamente el sistema se requiere:

## 4.1 Hardware

* ESP32 DEVKIT V1.
* Botón de medición.
* LED indicador, cuando corresponda.
* Protoboard.
* Cables de conexión.
* Computadora o servidor con acceso a la red.
* Conexión Wi-Fi para el ESP32.

## 4.2 Software

Para la administración y desarrollo del sistema se utilizan:

* Visual Studio Code.
* Node.js.
* React.
* TypeScript.
* Django.
* API REST.
* MySQL.
* Arduino IDE.
* Postman.

---

# 5. Conceptos importantes

## 5.1 Estación

Una estación representa un punto físico de medición dentro del proceso productivo.

Cada ESP32 puede identificarse mediante un identificador de estación, por ejemplo:

```text
Pes-001
For-001
Bat-001
```

El identificador permite determinar desde qué estación se generó una medición.

---

## 5.2 Proceso

El proceso representa la actividad productiva que se está midiendo.

Algunos ejemplos utilizados por el sistema son:

```text
G001
G002
G003
```

Cada medición contiene un proceso asociado.

---

## 5.3 Tiempo de medición

El ESP32 calcula la duración del proceso utilizando `millis()`.

El tiempo se almacena en milisegundos.

Por ejemplo:

```text
3775 ms
```

equivale aproximadamente a:

```text
3.775 segundos
```

---

# 6. Uso del dispositivo ESP32

## 6.1 Encendido

Conecte el ESP32 a una fuente de alimentación adecuada.

Una vez conectado:

1. El dispositivo inicia.
2. Se conecta a la red Wi-Fi configurada.
3. El ESP32 queda preparado para recibir eventos del botón.
4. La estación queda disponible para realizar mediciones.

---

# 7. Inicio de una medición

Para comenzar una medición:

1. Verifique que el ESP32 esté encendido.
2. Verifique que esté conectado a la red.
3. Confirme que la estación sea la correspondiente al área de trabajo.
4. Presione el botón de medición.
5. El cronómetro comenzará a contar.

Mientras la medición se encuentre activa, el dispositivo puede utilizar el LED indicador para mostrar el estado del cronómetro.

El estado puede interpretarse de la siguiente manera:

```text
LED encendido → medición activa
LED apagado   → medición detenida
```

La indicación exacta depende de la configuración utilizada en el dispositivo.

---

# 8. Finalización de una medición

Para finalizar una medición:

1. Espere hasta terminar el proceso.
2. Presione nuevamente el botón.
3. El ESP32 detendrá el cronómetro.
4. Se calculará el tiempo transcurrido.
5. El ESP32 preparará la información.
6. La medición será enviada a la API.

La información enviada contiene datos como:

```json
{
  "station": "Pes-001",
  "process": "G001",
  "time_ms": 3775
}
```

El servidor registra además la fecha y hora correspondiente.

---

# 9. Registro de una medición

Una medición almacenada en el sistema tiene una estructura similar a:

```json
{
  "id": 63,
  "station": "Pes-001",
  "process": "G001",
  "time_ms": 3775,
  "created_at": "2026-08-10T20:13:18.910333Z"
}
```

Los principales campos son:

| Campo        | Descripción                        |
| ------------ | ---------------------------------- |
| `id`         | Identificador único de la medición |
| `station`    | Estación que realizó la medición   |
| `process`    | Proceso medido                     |
| `time_ms`    | Tiempo registrado en milisegundos  |
| `created_at` | Fecha y hora de registro           |

---

# 10. Acceso a la aplicación web

Para utilizar el sistema web, abra un navegador compatible y acceda a la dirección proporcionada por el administrador del sistema.

La aplicación puede encontrarse desplegada en el servidor de producción correspondiente.

Una vez cargada la aplicación:

1. Inicie sesión si el sistema solicita autenticación.
2. Acceda al panel correspondiente.
3. Seleccione el módulo que desea consultar.

---

# 11. Panel de mediciones

El módulo **Mediciones** permite consultar el historial de tiempos registrados por las estaciones.

La pantalla contiene diferentes secciones:

* Encabezado.
* Estadísticas.
* Filtros.
* Historial de mediciones.

---

# 12. Estadísticas

En la parte superior de la pantalla se muestran tarjetas con información resumida.

## Total de mediciones

Indica la cantidad de registros encontrados según los filtros actuales.

Ejemplo:

```text
Total de mediciones
63
Registros encontrados
```

---

## Tiempo promedio

Muestra el promedio de duración de las mediciones.

Ejemplo:

```text
Tiempo promedio
5.234 s
Promedio de duración
```

---

## Tiempo mínimo

Muestra la medición con menor duración dentro del conjunto seleccionado.

Ejemplo:

```text
Tiempo mínimo
1.766 s
Menor duración registrada
```

---

## Tiempo máximo

Muestra la medición con mayor duración dentro del conjunto seleccionado.

Ejemplo:

```text
Tiempo máximo
70.165 s
Mayor duración registrada
```

Las estadísticas se actualizan automáticamente cuando se aplican filtros.

---

# 13. Filtros

La sección **Filtros** permite reducir la cantidad de registros mostrados.

Actualmente se dispone de filtros para:

* Estación.
* Proceso.

---

## 13.1 Filtrar por estación

En el campo **Estación** se muestran las estaciones disponibles.

Por defecto se encuentra seleccionada:

```text
Todas las estaciones
```

Para seleccionar una estación:

1. Abra el campo **Estación**.
2. Seleccione la estación deseada.
3. El sistema actualizará automáticamente los resultados.

Por ejemplo:

```text
Todas las estaciones
Pes-001
For-001
Bat-001
```

---

## 13.2 Filtrar por proceso

En el campo **Proceso** se muestran los procesos disponibles.

Por defecto se encuentra:

```text
Todos los procesos
```

Para filtrar:

1. Abra el campo **Proceso**.
2. Seleccione el proceso deseado.
3. El sistema mostrará únicamente las mediciones correspondientes.

Por ejemplo:

```text
Todos los procesos
G001
G002
G003
```

---

# 14. Aplicar varios filtros

Los filtros pueden utilizarse simultáneamente.

Por ejemplo:

```text
Estación: Pes-001
Proceso: G001
```

El sistema mostrará únicamente las mediciones que cumplan ambas condiciones.

La lógica aplicada es:

```text
Estación seleccionada
        +
Proceso seleccionado
        =
Mediciones correspondientes
```

---

# 15. Limpiar filtros

Para regresar a la vista completa:

1. Ubique el botón **Limpiar filtros**.
2. Presiónelo.
3. El sistema regresará los filtros a sus valores originales.

Los valores serán:

```text
Estación: Todas las estaciones
Proceso: Todos los procesos
```

Las estadísticas y la tabla se actualizarán automáticamente.

---

# 16. Historial de mediciones

Debajo de los filtros se encuentra la sección:

**Historial de mediciones**

En ella se muestra una tabla con los registros disponibles.

Las columnas principales son:

| Columna           | Información                  |
| ----------------- | ---------------------------- |
| Estación          | Identificador de la estación |
| Proceso           | Código del proceso           |
| Tiempo (ms)       | Duración de la medición      |
| Fecha de medición | Fecha y hora del registro    |

Ejemplo:

| Estación | Proceso | Tiempo (ms) | Fecha de medición |
| -------- | ------- | ----------: | ----------------- |
| Pes-001  | G001    |        3775 | 10/08/2026, 14:13 |
| Pes-001  | G002    |        4003 | 10/08/2026, 14:12 |
| For-001  | G001    |        7972 | 09/08/2026, 15:30 |

---

# 17. Exportación de mediciones

La tabla de mediciones cuenta con funcionalidad de exportación.

Cuando la opción esté disponible:

1. Consulte los registros deseados.
2. Aplique los filtros correspondientes.
3. Seleccione la opción de exportación.
4. Indique el formato solicitado por la interfaz.
5. Guarde el archivo generado.

Se recomienda aplicar primero los filtros cuando solamente se desea exportar un subconjunto de las mediciones.

---

# 18. Actualización de información

Las mediciones se obtienen desde la API del sistema.

Cuando se accede al módulo, la aplicación realiza una solicitud al servidor para obtener los registros disponibles.

El flujo es:

```text
Aplicación web
      │
      ▼
Solicitud HTTP
      │
      ▼
API de mediciones
      │
      ▼
Base de datos
      │
      ▼
Respuesta HTTP
      │
      ▼
Aplicación web
```

---

# 19. Autenticación

El sistema utiliza mecanismos de autenticación para proteger los recursos que requieren autorización.

Las solicitudes protegidas pueden requerir una sesión o credenciales válidas dependiendo de la configuración del servidor.

En las pruebas de API se debe utilizar el mecanismo de autenticación correspondiente antes de intentar enviar mediciones.

---

# 20. Pruebas mediante Postman

Postman puede utilizarse para comprobar que la API se encuentra funcionando correctamente.

Es recomendable utilizar Postman principalmente para:

* Probar autenticación.
* Consultar mediciones.
* Enviar mediciones.
* Comprobar respuestas HTTP.
* Verificar errores.
* Validar la comunicación con el servidor de producción.

---

# 21. Prueba de consulta de mediciones

Para consultar las mediciones:

1. Abra Postman.
2. Cree una nueva solicitud.
3. Seleccione el método HTTP correspondiente.
4. Introduzca la URL de producción.
5. Configure la autenticación requerida.
6. Envíe la solicitud.
7. Revise la respuesta.

Una respuesta exitosa puede tener una estructura similar a:

```json
{
  "success": true,
  "data": [
    {
      "id": 63,
      "station": "Pes-001",
      "process": "G001",
      "time_ms": 3775,
      "created_at": "2026-08-10T20:13:18.910333Z"
    }
  ]
}
```

---

# 22. Prueba de envío de una medición

Para probar el registro de una medición desde Postman:

1. Seleccione el método HTTP utilizado por el endpoint de creación.
2. Introduzca la URL de producción.
3. Configure el token o mecanismo de autenticación requerido.
4. Seleccione `Body`.
5. Seleccione `raw`.
6. Seleccione formato `JSON`.
7. Introduzca los datos de la medición.
8. Envíe la solicitud.

Ejemplo de información:

```json
{
  "station": "Pes-001",
  "process": "G001",
  "time_ms": 5000
}
```

La respuesta debe ser revisada para confirmar que el servidor aceptó y almacenó correctamente la información.

---

# 23. Tokens de autenticación

Cuando una API requiere autenticación mediante token, el token debe obtenerse utilizando el mecanismo de autenticación configurado en el sistema.

En Postman, el token debe configurarse en la sección de autorización de la solicitud.

Dependiendo de la configuración de producción, puede utilizarse un esquema similar a:

```text
Authorization: Bearer <TOKEN>
```

> **Importante:** nunca se debe publicar un token real dentro de este manual, repositorios públicos, capturas de pantalla o documentación compartida.

Para las pruebas de producción, utilice únicamente tokens válidos y autorizados.

---

# 24. Respuestas HTTP

Al realizar pruebas con Postman es importante revisar el código de respuesta.

| Código | Significado general               |
| -----: | --------------------------------- |
|    200 | Solicitud procesada correctamente |
|    201 | Recurso creado correctamente      |
|    400 | Solicitud incorrecta              |
|    401 | No autenticado                    |
|    403 | Sin permisos                      |
|    404 | Recurso o endpoint no encontrado  |
|    405 | Método HTTP no permitido          |
|    500 | Error interno del servidor        |

---

# 25. Problemas de conexión

Si el ESP32 no puede comunicarse con la API, revise:

1. Conexión Wi-Fi del ESP32.
2. Dirección del servidor.
3. Puerto utilizado.
4. Disponibilidad del VPS.
5. Endpoint configurado.
6. Token de autenticación.
7. Certificado HTTPS, si corresponde.
8. Reglas de firewall.
9. Estado de la API.

En el caso de utilizar una dirección IP o dominio diferente al utilizado durante las pruebas locales, el ESP32 debe tener configurada la dirección correcta del servidor de producción.

---

# 26. Problemas con las mediciones

Si las mediciones no aparecen en el dashboard:

### Paso 1: comprobar el ESP32

Verifique que el ESP32 esté conectado a Wi-Fi.

### Paso 2: comprobar el envío

Revise el monitor serial para confirmar que el dispositivo está realizando la solicitud HTTP.

### Paso 3: comprobar la API

Realice una consulta desde Postman.

### Paso 4: comprobar la base de datos

Verifique que el registro haya sido almacenado.

### Paso 5: comprobar el dashboard

Actualice la aplicación web y consulte nuevamente el módulo de mediciones.

---

# 27. Problema: error 404

Un error `404 Not Found` indica que la dirección solicitada no existe en el servidor.

Revise:

* Dominio o IP.
* Puerto.
* Ruta del endpoint.
* Prefijo `/api/`.
* Configuración del servidor.
* Configuración de producción.

Ejemplo de una ruta:

```text
/api/sistema-medicion-iot/measurements/
```

La ruta exacta debe coincidir con la configuración actual del backend.

---

# 28. Problema: error 401

Un error `401 Unauthorized` generalmente indica que la solicitud no está autenticada correctamente.

Revise:

* Token.
* Sesión.
* Encabezado `Authorization`.
* Caducidad de las credenciales.
* Permisos del usuario.

---

# 29. Problema: error 403

Un error `403 Forbidden` indica que el servidor recibió la solicitud, pero el usuario o dispositivo no tiene autorización suficiente.

Revise:

* Permisos.
* Token.
* Usuario utilizado.
* Configuración de autenticación.
* Permisos del endpoint.

---

# 30. Problema: error 500

Un error `500 Internal Server Error` indica un problema del lado del servidor.

En este caso:

1. Revise los logs del backend.
2. Compruebe la conexión con la base de datos.
3. Compruebe los datos enviados.
4. Compruebe la configuración del endpoint.
5. Verifique que el servidor esté funcionando correctamente.

---

# 31. Buenas prácticas para operadores

Para obtener mediciones confiables:

* Presione el botón una sola vez para comenzar.
* No presione repetidamente el botón durante el proceso.
* Presione el botón nuevamente únicamente cuando termine el proceso.
* Compruebe que el indicador del dispositivo corresponda con el estado de la medición.
* No desconecte el ESP32 mientras una medición esté activa.
* Verifique periódicamente que las mediciones estén llegando al sistema.

---

# 32. Buenas prácticas para administradores

Los administradores deben:

* Mantener actualizadas las credenciales.
* No compartir tokens.
* Verificar el estado del servidor.
* Revisar periódicamente los registros.
* Realizar respaldos de la base de datos.
* Supervisar el funcionamiento de los ESP32.
* Verificar la conectividad de las estaciones.
* Revisar los logs cuando exista un problema.
* Mantener documentadas las estaciones instaladas.

---

# 33. Seguridad

La información de autenticación debe manejarse de manera segura.

No se deben compartir:

* Tokens.
* Contraseñas.
* Cookies de sesión.
* Claves privadas.
* Credenciales de base de datos.
* Variables de entorno.
* Configuraciones sensibles del servidor.

Los valores sensibles deben almacenarse mediante variables de entorno o mecanismos seguros de configuración.

---

# 34. Ambiente de producción

El sistema cuenta con un ambiente de producción desplegado en un VPS.

Antes de realizar pruebas en producción se recomienda comprobar:

```text
VPS funcionando
      ↓
Backend funcionando
      ↓
Base de datos funcionando
      ↓
API disponible
      ↓
Autenticación funcionando
      ↓
ESP32 configurado
      ↓
Dashboard disponible
```

No se recomienda realizar pruebas destructivas directamente sobre datos reales.

---

# 35. Flujo completo de operación

El procedimiento completo para registrar una medición es:

```text
1. Encender ESP32
        ↓
2. Conectar a Wi-Fi
        ↓
3. Preparar proceso
        ↓
4. Presionar botón
        ↓
5. Iniciar cronómetro
        ↓
6. Realizar proceso
        ↓
7. Presionar botón
        ↓
8. Detener cronómetro
        ↓
9. Obtener tiempo
        ↓
10. Enviar medición a API
        ↓
11. Validar solicitud
        ↓
12. Guardar en base de datos
        ↓
13. Consultar desde dashboard
        ↓
14. Visualizar medición
```

---

# 36. Ejemplo de operación

Supongamos que el operador trabaja en la estación:

```text
Pes-001
```

y realiza el proceso:

```text
G001
```

El operador presiona el botón para comenzar.

El ESP32 inicia el cronómetro.

Después de finalizar el proceso, el operador vuelve a presionar el botón.

El dispositivo obtiene:

```text
Tiempo: 3775 ms
```

La información enviada al servidor puede ser:

```json
{
  "station": "Pes-001",
  "process": "G001",
  "time_ms": 3775
}
```

La API procesa la solicitud y registra la medición.

Posteriormente, el dashboard puede mostrar:

```text
Estación: Pes-001
Proceso: G001
Tiempo: 3775 ms
Fecha: 10/08/2026
```

---

# 37. Mantenimiento

El mantenimiento del sistema debe realizarse de manera periódica.

## Hardware

Revisar:

* Alimentación del ESP32.
* Conexiones del botón.
* Cableado.
* LED indicador.
* Estado físico del dispositivo.

## Software

Revisar:

* API.
* Aplicación web.
* Base de datos.
* Variables de entorno.
* Dependencias.
* Logs del servidor.

## Base de datos

Revisar:

* Integridad de registros.
* Respaldos.
* Espacio disponible.
* Conectividad.

---

# 38. Recomendaciones para futuras estaciones

Cuando se agregue una nueva estación se recomienda asignar un identificador único.

Por ejemplo:

```text
Pes-001
Pes-002
Pes-003
```

o utilizando una nomenclatura correspondiente al área de producción.

El identificador debe mantenerse consistente entre:

* ESP32.
* API.
* Base de datos.
* Dashboard.
* Documentación.

---

# 39. Consideraciones sobre la red

Los dispositivos ESP32 necesitan conectividad con el servidor para enviar las mediciones.

En un entorno de producción se recomienda utilizar:

* Red Wi-Fi estable.
* Servidor accesible.
* Dirección de servidor estable.
* HTTPS cuando sea posible.
* Configuración adecuada de firewall.
* Monitoreo de disponibilidad.

Si la dirección del servidor cambia, la configuración del ESP32 deberá actualizarse.

---

# 40. Glosario básico

### API

Interfaz que permite la comunicación entre diferentes aplicaciones y servicios.

### ESP32

Microcontrolador utilizado para capturar información y comunicarse mediante Wi-Fi.

### Endpoint

Ruta específica de una API utilizada para realizar una operación determinada.

### HTTP

Protocolo utilizado para la comunicación entre el dispositivo, el navegador y el servidor.

### JSON

Formato utilizado para representar y transmitir información estructurada.

### IoT

Internet of Things o Internet de las Cosas. Hace referencia a dispositivos físicos conectados a una red que pueden recopilar e intercambiar información.

### VPS

Servidor virtual privado utilizado para alojar los servicios de producción.

### Token

Credencial utilizada para autenticar determinadas solicitudes hacia una API.

### Dashboard

Interfaz gráfica que permite consultar y analizar información del sistema.

---

# 41. Solución rápida de problemas

| Problema                | Posible causa       | Acción                                  |
| ----------------------- | ------------------- | --------------------------------------- |
| No inicia el ESP32      | Alimentación        | Revisar conexión eléctrica              |
| No conecta a Wi-Fi      | Credenciales/red    | Revisar configuración Wi-Fi             |
| No se registra medición | API inaccesible     | Comprobar conexión con servidor         |
| Error 401               | Token inválido      | Obtener/configurar credenciales válidas |
| Error 403               | Sin permisos        | Revisar permisos                        |
| Error 404               | Endpoint incorrecto | Revisar URL                             |
| Error 500               | Error del servidor  | Revisar logs                            |
| No aparecen mediciones  | API/base de datos   | Comprobar registro en backend           |
| Tiempo incorrecto       | Operación del botón | Revisar inicio y finalización           |
| Dashboard vacío         | Error de consulta   | Comprobar API desde Postman             |

---

# 42. Resumen de uso

El procedimiento básico para utilizar CookieXpend es:

1. Encender el ESP32.
2. Confirmar conexión a la red.
3. Preparar el proceso productivo.
4. Presionar el botón para iniciar la medición.
5. Realizar el proceso.
6. Presionar nuevamente el botón para finalizar.
7. Confirmar que la medición sea enviada.
8. Acceder al dashboard.
9. Abrir el módulo **Mediciones**.
10. Consultar los registros.
11. Aplicar filtros cuando sea necesario.
12. Revisar las estadísticas.
13. Exportar la información cuando sea necesario.

---

# 43. Conclusión

Cookiexpend integra dispositivos IoT y una aplicación web para proporcionar un mecanismo centralizado de registro y consulta de tiempos de producción.

El uso del ESP32 permite capturar las mediciones directamente desde las estaciones de trabajo, mientras que la API permite transportar y almacenar la información en el servidor. Finalmente, la aplicación web proporciona una interfaz para consultar, filtrar y analizar los registros.

El correcto funcionamiento del sistema depende de la comunicación entre el dispositivo, la API, la base de datos y la aplicación web. Por esta razón, ante cualquier problema se recomienda verificar cada componente siguiendo el flujo establecido en este manual.

Este documento sirve como referencia para los operadores y administradores encargados de utilizar, supervisar y mantener el sistema.
