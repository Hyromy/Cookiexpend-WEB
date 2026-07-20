import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "./contexts/Theme/ThemeProvider"
import { SidebarProvider } from "./contexts/Sidebar/SidebarProvider"
import { AuthProvider } from "./contexts/Auth/AuthProvider"
import { routes } from "./routes/routes"
import type { AppRoute } from "./types/route"
import { Suspense, type ReactNode } from "react"
import { ToastProvider } from "./contexts/Toast/ToastProvider"

export default function App() {
  return (
    <ContextProviders>
      <BrowserRouter>
        <Suspense>
          <Routes>
            {renderRoutes(routes)}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ContextProviders>
  )
}

function ContextProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SidebarProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

const renderRoutes = (routeList: AppRoute[]) => (
  routeList.map((route, index) => {
    const key = `${route.path ?? "index"}-${index}`

    if (route.index) {
      return (
        <Route key={key} index element={route.element} />
      )
    }

    return (
      <Route
        key={key}
        path={route.path}
        element={route.element}
      >
        {route.children && renderRoutes(route.children)}
      </Route>
    )
  })
)
