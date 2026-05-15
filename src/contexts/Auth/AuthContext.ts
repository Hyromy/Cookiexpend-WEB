import { createContext } from "react"

export type AuthContextType = {
  user: unknown | null | undefined
  isAuthenticated: boolean
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
