import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach } from "vitest"

import { AuthProvider } from "../contexts/Auth/AuthProvider"
import { SidebarProvider } from "../contexts/Sidebar/SidebarProvider"
import { ThemeProvider } from "../contexts/Theme/ThemeProvider"
import useAuth from "../hooks/useAuth"
import useSidebar from "../hooks/useSidebar"
import useTheme from "../hooks/useTheme"

const formatValue = (value: unknown) => {
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  return String(value)
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
})

afterEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
})

describe("AuthProvider.tsx", () => {
  describe("AuthProvider", () => {
    const AuthConsumer = () => {
      const { user, isAuthenticated, loading, error, refresh, logout } = useAuth()
      return (
        <div>
          <div data-testid="auth-user">{formatValue(user)}</div>
          <div data-testid="auth-authenticated">{String(isAuthenticated)}</div>
          <div data-testid="auth-loading">{String(loading)}</div>
          <div data-testid="auth-error">{formatValue(error)}</div>
          <button data-testid="auth-refresh" onClick={() => void refresh()}>Refresh</button>
          <button data-testid="auth-logout" onClick={() => void logout()}>Logout</button>
        </div>
      )
    }

    const renderAuth = () => render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    )

    it("exposes default and refreshed values", async () => {
      renderAuth()

      expect(screen.getByTestId("auth-authenticated")).toHaveTextContent("false")
      expect(screen.getByTestId("auth-user")).toHaveTextContent("null")
      expect(screen.getByTestId("auth-loading")).toHaveTextContent("true")
      expect(screen.getByTestId("auth-error")).toHaveTextContent("null")

      fireEvent.click(screen.getByTestId("auth-refresh"))
      await waitFor(() => {
        expect(screen.getByTestId("auth-authenticated")).toHaveTextContent("false")
      })
    })

    it("updates when logout and refresh are called", async () => {
      renderAuth()

      fireEvent.click(screen.getByTestId("auth-refresh"))
      await waitFor(() => {
        expect(screen.getByTestId("auth-authenticated")).toHaveTextContent("false")
      })

      fireEvent.click(screen.getByTestId("auth-logout"))
      await waitFor(() => {
        expect(screen.getByTestId("auth-authenticated")).toHaveTextContent("false")
      })
      expect(screen.getByTestId("auth-user")).toHaveTextContent("null")

      fireEvent.click(screen.getByTestId("auth-refresh"))
      await waitFor(() => {
        expect(screen.getByTestId("auth-authenticated")).toHaveTextContent("false")
      })
    })
  })
})

describe("SidebarProvider.tsx", () => {
  describe("SidebarProvider", () => {
    const SidebarConsumer = () => {
      const { activeSidebar, setActiveSidebar, hasSidebar, setHasSidebar } = useSidebar()
      return (
        <div>
          <div data-testid="sidebar-active">{formatValue(activeSidebar)}</div>
          <div data-testid="sidebar-has">{String(hasSidebar)}</div>
          <button
            data-testid="sidebar-set"
            onClick={() => setActiveSidebar("navigation")}
          >
            Set
          </button>
          <button
            data-testid="sidebar-enable"
            onClick={() => setHasSidebar(true)}
          >
            Enable
          </button>
        </div>
      )
    }

    const renderSidebar = () => render(
      <SidebarProvider>
        <SidebarConsumer />
      </SidebarProvider>
    )

    it("provides defaults and updates state", () => {
      renderSidebar()

      expect(screen.getByTestId("sidebar-active")).toHaveTextContent("null")
      expect(screen.getByTestId("sidebar-has")).toHaveTextContent("false")

      fireEvent.click(screen.getByTestId("sidebar-set"))
      fireEvent.click(screen.getByTestId("sidebar-enable"))

      expect(screen.getByTestId("sidebar-active")).toHaveTextContent("navigation")
      expect(screen.getByTestId("sidebar-has")).toHaveTextContent("true")
    })
  })
})

describe("ThemeProvider.tsx", () => {
  describe("ThemeProvider", () => {
    const ThemeConsumer = () => {
      const { theme, toggleTheme } = useTheme()
      return (
        <div>
          <div data-testid="theme-value">{theme}</div>
          <button data-testid="theme-toggle" onClick={toggleTheme}>Toggle</button>
        </div>
      )
    }

    const renderTheme = () => render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    )

    it("uses light theme by default and toggles", async () => {
      renderTheme()

      expect(screen.getByTestId("theme-value")).toHaveTextContent("light")
      await waitFor(() => {
        expect(document.documentElement.classList.contains("light")).toBe(true)
      })

      fireEvent.click(screen.getByTestId("theme-toggle"))
      await waitFor(() => {
        expect(screen.getByTestId("theme-value")).toHaveTextContent("dark")
      })

      expect(document.documentElement.classList.contains("dark")).toBe(true)
      expect(localStorage.getItem("theme")).toBe("dark")
    })

    it("initializes from localStorage", async () => {
      localStorage.setItem("theme", "dark")
      renderTheme()

      await waitFor(() => {
        expect(screen.getByTestId("theme-value")).toHaveTextContent("dark")
      })

      expect(document.documentElement.classList.contains("dark")).toBe(true)
    })

    it("toggles back to light and updates storage", async () => {
      renderTheme()

      fireEvent.click(screen.getByTestId("theme-toggle"))
      await waitFor(() => {
        expect(screen.getByTestId("theme-value")).toHaveTextContent("dark")
      })

      fireEvent.click(screen.getByTestId("theme-toggle"))
      await waitFor(() => {
        expect(screen.getByTestId("theme-value")).toHaveTextContent("light")
      })

      expect(document.documentElement.classList.contains("light")).toBe(true)
      expect(localStorage.getItem("theme")).toBe("light")
    })
  })
})
