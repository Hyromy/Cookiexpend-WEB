import { lazy } from "react"
import { Navigate } from "react-router-dom"

import { PATHS } from "./paths"
import Main from "../layouts/Main"
import { MODULE_ROUTES } from "./modules"
import ProtectedRoute from "./ProtectedRoute"


import NotFound from "../pages/public/NotFound"
const Login = lazy(() => import("../pages/public/Login"))
const Recover = lazy(() => import("../pages/public/Recover"))

export const routes = [
  {
    path: PATHS.login,
    element: <Login />,
  },
  {
    path: PATHS.recover_account,
    element: <Recover />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
  {
    path: PATHS.panel,
    element: (
      <ProtectedRoute>
        <Main />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={PATHS.panel + PATHS.products} replace />,
      },
      ...MODULE_ROUTES.map((module) => ({
        path: module.path.replace("/", ""),
        element: (
          <ProtectedRoute allowedRoles={module.allowRoles}>
            {module.element}
          </ProtectedRoute>
        ),
      })),
    ],
  },
]
