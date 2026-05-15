import { useContext } from "react"

import { AuthContext } from "../contexts/Auth/AuthContext"

/**
 * Custom hook to access authentication context values and functions.
 * 
 * @returns An object containing the current user, authentication status, loading state, error state, and functions to refresh authentication and log out.
 * 
 * @example
 * const { user, isAuthenticated, loading, error, refresh, logout } = useAuth()
 * 
 * console.log(user) // The current authenticated user, or null if not authenticated, or undefined if authentication status has not been determined yet
 * 
 * console.log(isAuthenticated) // Whether the user is currently authenticated
 * 
 * console.log(loading) // Whether the authentication status is currently being determined
 * 
 * console.log(error) // Any error that occurred during authentication status refresh or logout
 * 
 * refresh() // Function to refresh the authentication status, which may update the user, isAuthenticated, loading, and error values
 * 
 * logout() // Function to log out the current user, which may update the user, isAuthenticated, loading, and error values
 * 
 * Note: Both refresh() and logout() are asynchronous functions that return a Promise, so you can use .then() or await to handle their completion if needed.
 */
export default function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
