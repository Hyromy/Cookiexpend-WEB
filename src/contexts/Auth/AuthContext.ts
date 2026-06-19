import { createContext } from "react"
import type { meResponse } from "../../types/api"

export type AuthContextType = {
  user: meResponse | null
  isAuthenticated: boolean
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
