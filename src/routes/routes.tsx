import { Navigate } from "react-router-dom"

import { PATHS } from "./paths"

import Login from "../pages/public/Login"
import Recover from "../pages/public/Recover"
import NotFound from "../pages/public/NotFound"
import Me from "../pages/public/Me"
import Main from "../layouts/Main"
import { MODULE_ROUTES } from "./modules"

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
    path: PATHS.me,
    element: <Me />,
  },
  {
    path: PATHS.panel,
    element: <Main />,
    children: [
      {
        index: true,
        element: <Navigate to={PATHS.panel + PATHS.products} replace />,
      },
      ...MODULE_ROUTES.map((module) => ({
        path: module.path.replace("/", ""),
        element: module.element,
      })),
    ],
  },
]
