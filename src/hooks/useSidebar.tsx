import { useContext } from "react"

import { SidebarContext } from "../contexts/Sidebar/SidebarContext"

/**
 * Custom hook to access the SidebarContext, providing state and functions related to sidebar management. Must be used within a SidebarProvider.
 * 
 * @returns An object containing the active sidebar type, a function to set the active sidebar, a boolean indicating if a sidebar is present, and a function to set the presence of a sidebar.
 * 
 * @example
 * const { activeSidebar, setActiveSidebar, hasSidebar, setHasSidebar } = useSidebar()
 * 
 * console.log(activeSidebar) // The currently active sidebar type, which can be "navigation" or null if no sidebar is active
 * 
 * console.log(hasSidebar) // A boolean indicating whether a sidebar is present
 * 
 * setActiveSidebar("navigation") // Function to set the active sidebar type to "navigation"
 * 
 * setHasSidebar(true) // Function to indicate that a sidebar is present
 * 
 * Note: Both setActiveSidebar and setHasSidebar are functions that update the context state, so they will cause any components consuming this context to re-render with the new values.
 */
export default function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider")
  return ctx
}
