# Variables de entorno

El proyecto establece [valores por defecto](/src/constants/config.ts) para funcionar con una configuración mínima.

Las variables se interpretan con el prefijo `VITE_` sin embargo el proyecto las manipula sin dicho prefijo, este prefijo debe de existir en la definición de variables.

Para configurar manualmente las variables de entorno, crea una copia del archivo `.env.example` y en la raíz del proyecto renombralo como `.env`. A continuación se detallan las variables disponibles y su propósito:

## Configuración general 

### `VITE_API_URL`

Define la url de la api a emplear.

_Por defecto, toma el valor de `"http://localhost:8000"`_
