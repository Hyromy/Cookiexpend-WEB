import { useLocation, useNavigate } from "react-router-dom"
import NotFound from "./NotFound"
import { Card } from "../../components/Card"
import { Bottom, Header } from "./Login"
import { Form, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import useApi from "../../hooks/useApi"
import { PATHS } from "../../routes/paths"
import useToast from "../../hooks/useToast"
import { authService } from "../../services/cookiexpend"
import type { confirmResetPasswordRequest } from "../../types/api"

type thisConfirmResetPasswordRequest = confirmResetPasswordRequest & {
  password_confirm: string
}

export default function ResetPassword() {
  const location = useLocation()
  const { isLoading, request } = useApi()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const token = new URLSearchParams(location.search).get("token")

  if (!token) {
    return <NotFound />
  }

  const onSubmitHandler = (data: thisConfirmResetPasswordRequest) => {
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }
    const parsedData = parseData(data)

    request(authService.confirmResetPassword(parsedData))
    .then(() => {
      addToast("Se ha restablecido la contraseña correctamente. Inicia sesión con tu nueva contraseña.", "success")
      navigate(PATHS.login, { replace: true })
    })
    .catch(err => {
      if (err.message.includes("Invalid or expired")) {
        addToast("La solicitud de restablecimiento de contraseña es inválida o ha expirado.", "error")
        return
      }
      console.error(err.message)
      addToast("No se pudo restablecer la contraseña.", "error")
    })
  }

  return (
    <Card className="flex flex-col gap-8">
      <Header
        title="Restablecer contraseña"
        text="Ingresa tu nueva contraseña"
      />
      <Form
        onSubmit={onSubmitHandler}
        className="flex flex-col gap-4"
      >
        <div>
          <TextField
            type="password"
            name="password"
            label="Nueva contraseña"
            required
            cleanEmpty
          />
        </div>
        <div>
          <TextField
            type="password"
            name="password_confirm"
            label="Confirmar nueva contraseña"
            required
            cleanEmpty
          />
        </div>
        <div className="hidden">
          <TextField
            name="token"
            defaultValue={token || ""}
          />
        </div>
        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={isLoading}
            className="px-8"
            size="md"
          >
            Restablecer contraseña
          </Button>
        </div>
      </Form>
      <Bottom
        href={PATHS.login}
        text="¿Ya tienes una cuenta? Inicia sesión"
      />
    </Card>
  )
}

const validate = (data: thisConfirmResetPasswordRequest): string | true => {
  if (!data.password || !data.password_confirm) {
    return "Las contraseñas son obligatorias"
  }
  if (data.password != data.password_confirm) {
    return "Las contraseñas no coinciden"
  }
  if (data.password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres"
  }

  return true
}

const parseData = (data: thisConfirmResetPasswordRequest): confirmResetPasswordRequest => {
  return {
    password: data.password,
    token: data.token
  }
}
