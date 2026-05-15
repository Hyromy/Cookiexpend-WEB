import { Package, Users2, Store, ShoppingCart } from "lucide-react"

import type { AppModuleRoute } from "../types/route"
import { PATHS } from "./paths"

import Products from "../pages/modules/Products"
import Users from "../pages/modules/Users"
import Stores from "../pages/modules/Stores"
import Sales from "../pages/modules/Sales"

export const MODULE_ROUTES: AppModuleRoute[] = [
  {
    path: PATHS.products,
    element: <Products />,
    label: "productos",
    icon: <Package />,
  },
  {
    path: PATHS.users,
    element: <Users />,
    label: "Usuarios",
    icon: <Users2 />
  },
  {
    path: PATHS.stores,
    element: <Stores />,
    label: "Expendios",
    icon: <Store />
  },
  {
    path: PATHS.sales,
    element: <Sales />,
    label: "Ventas",
    icon: <ShoppingCart />
  },
]
