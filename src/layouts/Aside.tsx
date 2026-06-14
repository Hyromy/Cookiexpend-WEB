import { NavLink } from "react-router-dom"

import { MODULE_ROUTES } from "../routes/modules"
import { PATHS } from "../routes/paths"
import { clsx } from "clsx"
import useAuth from "../hooks/useAuth"

export default function Aside({closeCanvas}: {closeCanvas?: () => void}) {
  const { user } = useAuth()

  const allowedModules = MODULE_ROUTES.filter(module => {
    if (!module.allowRoles) return true
    if (!user) return false
    return module.allowRoles.includes(user.role!)
  })

  return (
    <aside className="border-muted lg:border-r flex flex-col h-full">
      <div className="self-stretch sticky top-header-h">
        {allowedModules.map((module) => (
          <NavLink
            key={module.path}
            to={PATHS.panel + module.path}
            onClick={closeCanvas}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 p-3 border-l-8 w-full",
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
                  {module.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
