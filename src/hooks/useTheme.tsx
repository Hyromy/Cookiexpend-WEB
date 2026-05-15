import { useContext } from "react"

import { ThemeContext } from "../contexts/Theme/ThemeContext"

/**
 * Custom hook to access the ThemeContext, providing the current theme and a function to toggle between themes. Must be used within a ThemeProvider.
 * 
 * @returns An object containing the current theme (either "light" or "dark") and a function to toggle the theme.
 * 
 * @example
 * const { theme, toggleTheme } = useTheme()
 * 
 * console.log(theme) // "light" or "dark"
 * 
 * toggleTheme() // Toggles the theme between "light" and "dark"
 */
export default function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx
}
