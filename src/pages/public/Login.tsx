import { Form, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import useApi from "../../hooks/useApi"
import { authService } from "../../services/cookiexpend"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { PATHS } from "../../routes/paths"
import type { sessionResponse } from "../../types/api"

type LoginData = {
  email: string
  password: string
}

const validate = (data: LoginData) => {
  if (!data.email || !data.password) {
    return "All fields are required"
  }

  return "ok"
}

export default function Login() {
  const navigate = useNavigate()
  const { data, error, isLoading, request } = useApi<sessionResponse>()

  useEffect(() => {
    if (data && data.success) {
      navigate(PATHS.panel)
    } else if (data && !data.success) {
      alert("Login failed: " + (data.message))
    }
    if (error) {
      alert("Login failed: " + error.message)
    }
  }, [data, error, navigate])

  const onSubmitHandler = (data: LoginData) => {
    const validationResult = validate(data)
    if (validationResult != "ok") {
      alert(validationResult)
      return
    }

    request(authService.login(data))
  }

  return (
    <Form onSubmit={onSubmitHandler}>
      <TextField name="email" placeholder="Email" />
      <br />
      <TextField name="password" type="password" placeholder="Password" />
      <br />
      <Button type="submit" disabled={isLoading}>
        Login
      </Button>
    </Form>
  )
}
