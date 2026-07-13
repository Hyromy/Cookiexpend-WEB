import { Form, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import useApi from "../../hooks/useApi"
import { authService } from "../../services/cookiexpend"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { PATHS } from "../../routes/paths"
import type { sessionResponse } from "../../types/api"
import useAuth from "../../hooks/useAuth"
import { Card } from "../../components/Card"
import { ThemeButton } from "../../components/Button"
import { EMAIL_REGEX } from "../../constants/regex"
import useToast from "../../hooks/useToast"

type LoginData = {
  email: string
  password: string
}

const validate = (data: LoginData) => {
  if (!data.email || !data.password) {
    return "Todos los campos son obligatorios"
  }

  return "ok"
}

export default function Login() {
  const navigate = useNavigate()
  const { data, error, isLoading, request } = useApi<sessionResponse>()
  const { refresh } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    if (data && data.success) {
      refresh()
      navigate(PATHS.panel)
    } else if (data && !data.success) {
      console.error(data.message)
      addToast("No se pudo iniciar sesión. Por favor, verifica tus credenciales.", "warning")
    }
    if (error) {
      console.error(error.message)
      addToast(parseErr(error.message), "error")
    }
  }, [data, error, navigate, refresh])

  const onSubmitHandler = (data: LoginData) => {
    const validationResult = validate(data)
    if (validationResult != "ok") {
      addToast(validationResult, "warning")
      return
    }

    request(authService.login(data))
  }

  return (
    <Card className="flex flex-col gap-8">
      <Header />
      <Form
        onSubmit={onSubmitHandler}
        className="flex flex-col gap-4"
      >
        <div>
          <TextField
            name="email"
            label="Usuario o correo electrónico"
            cleanRegex={new RegExp(`[^${EMAIL_REGEX}]`, "g")}
          />
        </div>
        <div>
          <TextField
            name="password"
            type="password"
            label="Contraseña"
          />
        </div>
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isLoading}
            className="px-8"
            size="md"
          >
            Iniciar sesión
          </Button>
        </div>
      </Form>
      <Bottom />
    </Card>
  )
}

function Header() {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold tracking-tight">
        Bienvenido de nuevo
      </h2>
      <p className="mt-2 text-sm text-muted">
        Ingresa tus credenciales para acceder
      </p>
    </div>
  )
}

function Bottom() {
  return (
    <div className="flex items-center justify-between">
      <ThemeButton />
      <a href={PATHS.recover_account} className="text-xs font-semibold text-muted hover:text-primary/75">
        ¿Olvidaste tu contraseña?
      </a>
    </div>
  )
}

const parseErr = (err: string): string => {
  switch (err) {
    case "Invalid credentials":
      return "Usuario o contraseña incorrectos"

    default:
      return "Ocurrió un error al iniciar sesión. Por favor, intenta de nuevo."
  }
}
