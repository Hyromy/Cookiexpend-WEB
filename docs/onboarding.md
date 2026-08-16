# Manual de desarrollador

Manual de desarrollador que busca introducir y orientar a cualquier persona que participe en el desarrollo, mantenimiento o despliegue de este proyecto.

Este documento está diseñado para que puedas comprender rápidamente la estructura, dependencias y flujos de trabajo principales del sistema, así como las mejores prácticas recomendadas para contribuir de manera efectiva.

## Requerimientos

El proyecto se desarrolló y se prueba con las siguientes versiones:

- __Node 24.13.0__
  
Si vas a ejecutar con Docker, revisa el [manual de operaciones](./runbook.md).

# Estructura del proyecto

El proyecto dispone de la estructura estándar de React + Vite, a continuación se detallan solo las carpetas y archivos relevantes.

- `assets`: Archivos estáticos del proyecto
- `components`: Componentes reutilizables
- `constants`: Contantes del proyecto
  - `config.ts`: Carga y procesamiento de variables de entorno
- `contexts`: Contextos de aplicación
- `hooks`: Hooks personalizados
- `layouts`: Componentes estáticos o secciones de vista
- `pages`: Vistas de la aplicación
  - `modules`: Vistas de módulo
  - `public`: Vistas públicas
- `routes`: Mapa de rutas
  - `modules.tsx`: Asociación de módulos con sub-ruta
  - `paths.ts`: Definición de rutas
  - `routes.tsx`: Asociación de vistas con rutas
- `services`: Servicios externos
  - `api.ts`: Controlador api genérico
- `types`: Tipado compartido

## Variables de entorno

Es posible ejecutar el proyecto sin que exista el archivo `.env` o sin configurar las variables del mismo, ya que se establecen valores por defecto. Sin embargo se recomienda configurar los valores necesarios (_en especial en modo producción_) ya que pueden presentarse comportamientos inesperados o inestabilidad en el proyecto.

Consulte la configuración de [variables de entorno](./virtual-env.md) para más información.

## Instalación de dependencias y ejecución

```sh
npm i          # Instala las dependencias
npm run dev    # Ejecuta el proyecto en desarrollo
```

## Tests y revisiones

A fin de garantizar la calidad del proyecto y evitar insertar errores sobre la funcionalidad del mismo, se recomienda ejecutar los tests y análisis estáticos.

Ejecuta los tests

```sh
npm test
```

Ejecuta las revisiones de código y formato

```sh
npm run lint
```

## Mantenimiento y correcciones

A medida que se desarrolla el proyecto es necesario realizar ciertas operaciones en el mismo para que este pueda adaptarse correctamente a los cambios del proyecto.

### Mantenimiento de tests

Los tests definidos no son infalibles. La finalidad de estos es garantizar la calidad del código y evitar romper funcionalidad existente a futuro.

Es posible que los requerimientos cambien, que se extienda o altere una o varias funcionalidades del proyecto, así como la detección de nuevos casos de borde. En cualquiera de esos casos es posible que los tests fallen o que ya no tengan el alcance necesario, de ser así, se deben actualizar los tests afectados.

## Flujo colaborativo

En caso de colaborar en el proyecto, y a fin de permitir un desarrollo consistente y flexible, se recomienda encarecidamente leer y respetar las secciones que se detallan a continuación.

### Ramas

Existen dos ramas principales en el proyecto.

- `main`: Rama destinada a producción, cuenta con revisiones, tests, builds y despliegues automáticos.
- `dev`: Equivalente a __main__, sin integración a entornos productivos. Cuenta únicamente con revisiones y tests automáticos.

Otras ramas que vayan a ser creadas son de formato libre, independientemente de su propósito o longevidad.

### Pull requests

El formato de las pull request es abierto, siempre y cuando sea coherente, concreto y detallado (criterios subjetivos). Hay algunas restricciones que deben seguirse para que estas se terminen integrando al proyecto.

1. Las ramas deben comenzar en `dev` u otras sub-ramas.
2. La pull request debe de pasar todas las revisiones y tests para ser considerada a integración.
3. Si agregas funcionalidad adicional, debes definir los tests correspondientes. Estos deben ser realistas y con una cobertura de los casos de borde como mínimo.
4. En caso de alterar los tests existentes, justificar el motivo en el cuerpo de la pull request.

En caso contrario la pull request puede ser rechazada o detenerse indefinidamente hasta que todos los puntos anteriormente mencionados queden resueltos. También es posible crear PRs de una sub-rama a otra.

En caso de que la pull request sea aceptada, esta debe de ser eliminada del repositorio remoto.

La rama __main__ únicamente recibe pull request de la rama __dev__.

### Workflows

Se disponen de varios workflows de GitHub Actions configurados, muchos de ellos destinados al CI y CD del proyecto, a continuación se detallan los workflows configurados y sus desencadenantes.

| Flujo | Descripción | Trigger |
| - | - | - |
| quality.yml | Ejecuta tests y revisiones de código | PRs a __main__ o __dev__ / Manual |
