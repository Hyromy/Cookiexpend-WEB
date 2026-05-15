# Manual de operaciones

Manual de operaciones que tiene como propósito guiar la ejecución, verificación y operación del proyecto.

## Ejemplo con Docker Build/Run

Este ejemplo ejecuta solo el contenedor de la WEB. Asegúrate de tener el backend de [Cookiexpend API](https://github.com/Hyromy/Cookiexpend-API) funcionando.

Al crear la imagen es necesario asignar las variables de entorno como `--build-arg`, ya que no es posible asignarlas como variables de entorno típicas.

> [!Note]
> Consulta la configuración de [variables de entorno](./virtual-env.md) para definir los valores correctos.

Construir la imagen

```sh
docker build --build-arg VITE_API_URL=https://tu-api.com -t cookiexpend-web .
```

Ejecutar el contenedor

> ### Linux / macOS
> ```sh
> docker run -d --name cookiexpend-web \
>   -p 5173:5173 \
>   --network my_network \
>   cookiexpend-web
> ```

---

> ### Windows
> ```sh
> docker run -d --name cookiexpend-web `
>   -p 5173:5173 `
>   --network my_network `
>   cookiexpend-web
> ```
