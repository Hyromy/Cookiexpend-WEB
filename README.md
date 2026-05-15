# Cookiexpend WEB

Sistema de control y supervisión de inventarios en entornos distribuidos (interfaz web)

![React](https://img.shields.io/badge/React-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

## Inicio Rápido

Realiza una instalación rápida del proyecto y ejecuta en modo desarrollo.

1. Clonar repositorio
   ```sh
   git clone https://github.com/Hyromy/Cookiexpend-WEB.git    # https
   git clone git@github.com:Hyromy/Cookiexpend-WEB.git        # ssh

   cd Cookiexpend-WEB
   ```

2. Instalar dependencias
   ```sh
   npm i
   ```

3. Ejecutar servidor
   ```sh
   npm run dev
   ```

Para más detalles sobre su desarrollo y mantenimiento consulte el [manual de desarrollador](./public/docs/onboarding.md).

## Variables de entorno y configuración

Configura los parámetros principales de la aplicación mediante variables de entorno.

Copia el archivo `.env.example` y pegalo en la raíz del proyecto con el nombre de `.env`, configura las variables según tus necesidades.

Para más detalles sobre la configuración consulte el [manual de configuración](./public/docs/virtual-env.md).

## Despliegue (Docker)

Ejecuta la aplicación y sus dependencias en contenedores usando Docker.

Para más detalles sobre el despliegue consulte el [manual de operaciones](./public/docs/runbook.md).
