import { useNavigate } from "react-router-dom"
import { Button } from "../../components/Button"
import { PATHS } from "../../routes/paths"

export default function NotFound() {
  const navigate = useNavigate()

  const onClickHandler = () => {
    if (history.length > 2) {
      navigate(-1)
    } else {
      navigate(PATHS.login)
    }
  }

  console.log(history)
  return (
    <section className="flex flex-col gap-2 items-center justify-center h-screen">
      <p className="text-3xl">
        404
      </p>
      <h2 className="text-4xl text-center">
        Página no encontrada
      </h2>
      <p className="text-muted text-center">
        La pagina o contenido que estás buscando no existe
      </p>
      <Button className="mt-6" onClick={onClickHandler}>
        Volver atrás
      </Button>
    </section>
  )
}
