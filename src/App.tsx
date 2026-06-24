import { BrowserRouter, Route, Routes } from "react-router-dom"
import { ThemeProvider } from "./contexts/Theme/ThemeProvider"
import { SidebarProvider } from "./contexts/Sidebar/SidebarProvider"
import { AuthProvider } from "./contexts/Auth/AuthProvider"
import { routes } from "./routes/routes"
import type { AppRoute } from "./types/route"
import { Suspense } from "react"

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

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SidebarProvider>
          <BrowserRouter>
            <Suspense>
              <Routes>
                {renderRoutes(routes)}
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SidebarProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}