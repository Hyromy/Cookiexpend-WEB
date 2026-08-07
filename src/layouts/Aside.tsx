import { NavLink, useLocation } from "react-router-dom"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

import { MODULE_ROUTES } from "../routes/modules"
import { PATHS } from "../routes/paths"
import { clsx } from "clsx"
import useAuth from "../hooks/useAuth"
import type { AppModuleRoute } from "../types/route"

export default function Aside({closeCanvas}: {closeCanvas?: () => void}) {
  const { user } = useAuth()
  const location = useLocation()

  const allowedModules = MODULE_ROUTES.filter(module => {
    if (!module.allowRoles) return true
    if (!user) return false
    if (module.path == PATHS.loadingPanel) return false
    return module.allowRoles.includes(user.role!)
  })

  const ungroupedModules = allowedModules.filter(module => !module.group)
  const groupNames = [...new Set(
    allowedModules.filter(module => module.group).map(module => module.group as string)
  )]

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    groupNames.forEach(name => {
      const groupModules = allowedModules.filter(module => module.group == name)
      initial[name] = groupModules.some(module => location.pathname == PATHS.panel + module.path)
    })
    return initial
  })

  const toggleGroup = (name: string) => {
    setOpenGroups(prev => ({ ...prev, [name]: !prev[name] }))
  }

  const renderModuleLink = (module: AppModuleRoute, indented = false) => (
    <NavLink
      key={module.path}
      to={PATHS.panel + module.path}
      onClick={closeCanvas}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 p-3 border-l-8 w-full",
          indented && "pl-8",
          isActive
            ? "bg-primary/10 border-primary"
            : "hover:bg-primary/10 border-transparent",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={clsx(isActive && "text-primary")}>
            {module.icon}
          </span>
          <span className={clsx("capitalize transition-all", isActive && "text-primary font-bold")}>
            {displayModuleLabel(user?.role, module.label)}
          </span>
        </>
      )}
    </NavLink>
  )

  return (
    <aside className="border-muted lg:border-r flex flex-col h-full">
      <div className="self-stretch sticky top-header-h">
        {ungroupedModules.map((module) => renderModuleLink(module))}
        {groupNames.map((name) => {
          const groupModules = allowedModules.filter(module => module.group == name)
          const isOpen = openGroups[name]

          return (
            <div key={name}>
              <button
                type="button"
                onClick={() => toggleGroup(name)}
                className="flex items-center justify-between gap-3 p-3 w-full text-left hover:bg-primary/10 transition-colors hover:cursor-pointer"
              >
                <span className="text-sm font-semibold opacity-70">{name}</span>
                <ChevronDown className={clsx("size-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
              </button>
              {isOpen && groupModules.map((module) => renderModuleLink(module, true))}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

const displayModuleLabel = (userRole: string | undefined, moduleLabel: string): string => {
  if (userRole == "Store manager" && moduleLabel == "Inventarios") {
    return "Inventario"
  }
  return moduleLabel
}
