import { useState, type ReactNode } from "react"
import { SidebarContext, type SidebarType } from "./SidebarContext"

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [activeSidebar, setActiveSidebar] = useState<SidebarType>(null)
  const [hasSidebar, setHasSidebar] = useState(false)
  
  return (
    <SidebarContext.Provider
      value={{
        activeSidebar,
        setActiveSidebar,
        hasSidebar,
        setHasSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}
