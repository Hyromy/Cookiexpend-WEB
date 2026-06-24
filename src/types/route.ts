import { type ReactNode } from "react"
import type { userRolePermission } from "./api"

export type AppRoute = {
  path?: string
  index?: boolean
  element: ReactNode
  children?: AppRoute[]
}

export type AppModuleRoute = {
  path: string
  element: ReactNode
  label: string
  icon: ReactNode
  allowRoles: userRolePermission[]
}
