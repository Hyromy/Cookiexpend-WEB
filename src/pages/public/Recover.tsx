import { useEffect } from "react"
import { Button } from "../../components/Button"
import { Card } from "../../components/Card"
import { Form, TextField } from "../../components/Form"
import { EMAIL_REGEX } from "../../constants/regex"
import useApi from "../../hooks/useApi"
import { PATHS } from "../../routes/paths"
import useToast from "../../hooks/useToast"
import { authService } from "../../services/cookiexpend"
import { IS_EMAIL_REGEX } from "../../constants/regex"
import type { askResetPasswordRequest, resetPasswordResponse } from "../../types/api"
import { Bottom, Header } from "./Login"

export default function Recover() {
  const { data, error, isLoading, request } = useApi<resetPasswordResponse>()
  const { addToast } = useToast()

  useEffect(() => {
    if (data) {
      addToast("Se ha enviado un correo electrónico con instrucciones para recuperar tu cuenta.", "success")
    }
    if (error) {
      console.error(error.message)
      addToast("No se pudo enviar la solicitud de recuperación de cuenta.", "error")
    }
  }, [data, error, addToast])

  const onSubmitHandler = (data: askResetPasswordRequest) => {
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    request(authService.askResetPassword(data))
  }

  return (
    <Card className="flex flex-col gap-8">
      <Header
        title="Recuperar cuenta"
        text="Ingresa tu correo electrónico para recuperar tu cuenta"
      />
      <Form
        onSubmit={onSubmitHandler}
        className="flex flex-col gap-4"
      >
        <div>
          <TextField
            name="email"
            label="Correo electrónico"
            cleanRegex={new RegExp(`[^${EMAIL_REGEX}]`, "g")}
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
      <Bottom
        href={PATHS.login}
        text="¿Ya tienes una cuenta? Inicia sesión"
      />
    </Card>
  )
}

const validate = (data: askResetPasswordRequest): string | true => {
  if (!data.email) {
    return "El correo electrónico es obligatorio"
  }
  if (!(new RegExp(IS_EMAIL_REGEX)).test(data.email)) {
    return "El correo electrónico no es válido"
  }

  return true
}
