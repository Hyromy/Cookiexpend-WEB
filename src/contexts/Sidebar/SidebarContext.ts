import { createContext } from "react"

export type SidebarType = (
  "navigation" |
  null
)

export type SidebarContextType = {
  activeSidebar: SidebarType
  setActiveSidebar: (sidebar: SidebarType) => void
  hasSidebar: boolean
  setHasSidebar: (hasSidebar: boolean) => void
}

export const SidebarContext = createContext<SidebarContextType | null>(null)
