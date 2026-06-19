import {
  type ReactNode,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react"
import { AuthContext } from "./AuthContext"
import type { meResponse } from "../../types/api"
import useApi from "../../hooks/useApi"
import { authService } from "../../services/cookiexpend"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<meResponse | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { request } = useApi<meResponse | null>()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = (await request(authService.me())) as meResponse
      if (data.role != null) {
        setIsAuthenticated(true)
        setUser(data)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    }  catch (err) {
      setUser(null)
      setIsAuthenticated(false)
      setError(err as Error)
    
    } finally {
      setLoading(false)
    }
  }, [request])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      request(authService.logout())
    
    } catch (err) {
      setError(err as Error)
    
    } finally {
      setLoading(false)

      setIsAuthenticated(false)
      setUser(null)
    }
  }, [request])

  useEffect(() => {
    (async () => {
      await refresh()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated, loading, error, refresh, logout }),
    [user, isAuthenticated, loading, error, refresh, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
