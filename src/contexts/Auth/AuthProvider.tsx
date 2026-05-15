import {
  type ReactNode,
  useState,
  useMemo,
  useCallback,
} from "react"
import { AuthContext } from "./AuthContext"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<unknown | null | undefined>(undefined)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setUser(undefined)
      setIsAuthenticated(true)
    
    } catch (err) {
      setUser(null)
      setIsAuthenticated(false)
      setError(err as Error)
    
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      // TODO: Implement logout API call
    
    } catch (err) {
      setError(err as Error)
    
    } finally {
      setLoading(false)

      setIsAuthenticated(false)
      setUser(null)
    }
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
