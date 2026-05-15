import { useEffect, useState, type ReactNode } from "react"
import { ThemeContext, type Theme } from "./ThemeContext"


const themeKey = "theme"
const setThemeInLS = (theme: Theme) => localStorage.setItem(themeKey, theme)
const getThemeFromLS = (): Theme => localStorage.getItem(themeKey) as Theme || "light"
const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getThemeFromLS())

  useEffect(() => {
    applyTheme(theme)
    setThemeInLS(theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev == "light" ? "dark" : "light")

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
