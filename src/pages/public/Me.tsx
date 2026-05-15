import { useEffect } from "react"
import useApi from "../../hooks/useApi"
import { authService } from "../../services/cookiexpend"
import type { userInfoResponse } from "../../types/api"
import { Button } from "../../components/Button"
import { useNavigate } from "react-router-dom"
import { PATHS } from "../../routes/paths"

export default function Me() {
  const { data, error, request } = useApi<userInfoResponse>()
  const navigate = useNavigate()

  useEffect(() => {
    if (error) {
      alert("Failed to fetch user data: " + error.message)
    }
  }, [error])

  useEffect(() => {
    request(authService.me())
  }, [request])

  const onLogout = () => {
    request(authService.logout())
    navigate(PATHS.login)
  }

  return data && (
    <>
      <pre>
        {JSON.stringify(data, null, 2)}
      </pre>
      <Button onClick={onLogout}>
        Logout
      </Button>
    </>
  )
}
