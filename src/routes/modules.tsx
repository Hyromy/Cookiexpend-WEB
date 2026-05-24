import {
  Package,
  Users2,
  Store,
  ShoppingCart,
  Factory as FactoryIcon,
  Truck,
  Blocks
} from "lucide-react"

import type { AppModuleRoute } from "../types/route"
import { PATHS } from "./paths"

import Products from "../pages/modules/Products"
import Users from "../pages/modules/Users"
import Stores from "../pages/modules/Stores"
import Sales from "../pages/modules/Sales"
import Factories from "../pages/modules/Factories"
import Deliveries from "../pages/modules/Deliveries"
import Inventories from "../pages/modules/Inventories"

export const MODULE_ROUTES: AppModuleRoute[] = [
  {
    path: PATHS.factories,
    element: <Factories />,
    label: "Plantas",
    icon: <FactoryIcon />
  },
  {
    path: PATHS.stores,
    element: <Stores />,
    label: "Expendios",
    icon: <Store />
  },
  {
    path: PATHS.products,
    element: <Products />,
    label: "Productos",
    icon: <Package />,
  },
  {
    path: PATHS.deliveries,
    element: <Deliveries />,
    label: "Repartos",
    icon: <Truck />,
  },
  {
    path: PATHS.inventories,
    element: <Inventories />,
    label: "Inventarios",
    icon: <Blocks />,
  },
  {
    path: PATHS.sales,
    element: <Sales />,
    label: "Ventas",
    icon: <ShoppingCart />
  },
  {
    path: PATHS.users,
    element: <Users />,
    label: "Usuarios",
    icon: <Users2 />
  },
]
