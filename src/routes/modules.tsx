import {
  Package,
  Users2,
  Store,
  ShoppingCart,
  Factory as FactoryIcon,
  Truck,
  Blocks,
  Tags,
  Layers,
  Image,
  HelpCircle,
  Building2,
  Award,
  MapPinned
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
const Redirect = lazy(() => import("../pages/modules/Redirect"))
const Categories = lazy(() => import("../pages/modules/Categories"))
const Presentations = lazy(() => import("../pages/modules/Presentations"))
const Gallery = lazy(() => import("../pages/modules/Gallery"))
const Faqs = lazy(() => import("../pages/modules/Faqs"))
const Departments = lazy(() => import("../pages/modules/Departments"))
const Brands = lazy(() => import("../pages/modules/Brands"))
const Retailers = lazy(() => import("../pages/modules/Retailers"))

const SITE_CONTENT_GROUP = "Sitio Web"

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
    allowRoles: ["Factory manager", "Store manager"],
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
  {
    path: PATHS.categories,
    element: <Categories />,
    label: "Categorías",
    icon: <Tags />,
    allowRoles: ["Factory manager"],
    group: SITE_CONTENT_GROUP,
  },
  {
    path: PATHS.presentations,
    element: <Presentations />,
    label: "Presentaciones",
    icon: <Layers />,
    allowRoles: ["Factory manager"],
    group: SITE_CONTENT_GROUP,
  },
  {
    path: PATHS.gallery,
    element: <Gallery />,
    label: "Galería",
    icon: <Image />,
    allowRoles: ["Factory manager"],
    group: SITE_CONTENT_GROUP,
  },
  {
    path: PATHS.faqs,
    element: <Faqs />,
    label: "FAQ",
    icon: <HelpCircle />,
    allowRoles: ["Factory manager"],
    group: SITE_CONTENT_GROUP,
  },
  {
    path: PATHS.departments,
    element: <Departments />,
    label: "Departamentos",
    icon: <Building2 />,
    allowRoles: ["Factory manager"],
    group: SITE_CONTENT_GROUP,
  },
  {
    path: PATHS.brands,
    element: <Brands />,
    label: "Marcas",
    icon: <Award />,
    allowRoles: ["Factory manager"],
    group: SITE_CONTENT_GROUP,
  },
  {
    path: PATHS.retailers,
    element: <Retailers />,
    label: "Retailers",
    icon: <MapPinned />,
    allowRoles: ["Factory manager"],
    group: SITE_CONTENT_GROUP,
  },
  {
    path: PATHS.loadingPanel,
    element: <Redirect />,
    allowRoles: ["Factory manager", "Store manager"],
    icon: null,
    label: "",
  }
]
