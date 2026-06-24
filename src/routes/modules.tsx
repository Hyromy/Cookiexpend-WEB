import {
  Package,
  Users2,
  Store,
  ShoppingCart,
  Factory as FactoryIcon,
  Truck,
  Blocks
} from "lucide-react"
import { lazy } from "react"

import type { AppModuleRoute } from "../types/route"
import { PATHS } from "./paths"

const Products = lazy(() => import("../pages/modules/Products"))
const Users = lazy(() => import("../pages/modules/Users"))
const Stores = lazy(() => import("../pages/modules/Stores"))
const Sales = lazy(() => import("../pages/modules/Sales"))
const Factories = lazy(() => import("../pages/modules/Factories"))
const Deliveries = lazy(() => import("../pages/modules/Deliveries"))
const Inventories = lazy(() => import("../pages/modules/Inventories"))

export const MODULE_ROUTES: AppModuleRoute[] = [
  {
    path: PATHS.factories,
    element: <Factories />,
    label: "Plantas",
    icon: <FactoryIcon />,
    allowRoles: ["Factory manager"],
  },
  {
    path: PATHS.stores,
    element: <Stores />,
    label: "Expendios",
    icon: <Store />,
    allowRoles: ["Factory manager"],
  },
  {
    path: PATHS.products,
    element: <Products />,
    label: "Productos",
    icon: <Package />,
    allowRoles: ["Factory manager"],
  },
  {
    path: PATHS.deliveries,
    element: <Deliveries />,
    label: "Repartos",
    icon: <Truck />,
    allowRoles: ["Factory manager"],
  },
  {
    path: PATHS.inventories,
    element: <Inventories />,
    label: "Inventarios",
    icon: <Blocks />,
    allowRoles: ["Factory manager", "Store manager"],
  },
  {
    path: PATHS.sales,
    element: <Sales />,
    label: "Ventas",
    icon: <ShoppingCart />,
    allowRoles: ["Factory manager", "Store manager"],
  },
  {
    path: PATHS.users,
    element: <Users />,
    label: "Usuarios",
    icon: <Users2 />,
    allowRoles: ["Factory manager"],
  },
]
