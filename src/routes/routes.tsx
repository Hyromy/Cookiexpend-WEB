import { Navigate } from "react-router-dom"

import { PATHS } from "./paths"

import Login from "../pages/public/Login"
import Recover from "../pages/public/Recover"
import NotFound from "../pages/public/NotFound"
import Main from "../layouts/Main"
import { MODULE_ROUTES } from "./modules"
import ProtectedRoute from "./ProtectedRoute"

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
