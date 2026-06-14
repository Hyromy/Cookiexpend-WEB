import useAuth from "../hooks/useAuth"
import NotFound from "../pages/public/NotFound"
import type { userRole } from "../types/api"
import { type ReactNode } from "react"

type ProtectedRouteProps = {
  allowedRoles?: userRole[]
  children: ReactNode
}
export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()

  if (loading) {
    return null
  }
  if (
    !isAuthenticated
    || !user
    || (
      allowedRoles
      && !allowedRoles.includes(user?.role!)
    )
  ) {
    return <NotFound />
  }
  return <>{children}</>
}
