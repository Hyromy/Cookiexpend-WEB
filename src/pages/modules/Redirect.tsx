import { Navigate } from "react-router-dom"
import useAuth from "../../hooks/useAuth"
import { PATHS } from "../../routes/paths"

export default function Redirect() {
  const { user, loading, logout } = useAuth()

  const returnHandler = () => {
    if (loading && !user) {
      return null
    }
    if (user!.role == "Factory manager") {
      return <Navigate to={PATHS.panel + PATHS.products} replace />
    }
    if (user!.role == "Store manager") {
      return <Navigate to={PATHS.panel + PATHS.sales} replace />
    }

    console.error("Not possible to redirect, redirect to login for safety")
    logout()
    return <Navigate to={PATHS.login} replace />
  }

  return returnHandler()
}
