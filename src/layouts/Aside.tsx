import { NavLink } from "react-router-dom"

import { MODULE_ROUTES } from "../routes/modules"
import { PATHS } from "../routes/paths"
import { clsx } from "clsx"

export default function Aside({closeCanvas}: {closeCanvas?: () => void}) {
  return (
    <aside className="w-72 lg:me-2 lg:border-r flex flex-col gap-1 p-4 h-fit sticky top-header-h">
      {MODULE_ROUTES.map((module) => (
        <NavLink
          key={module.path}
          to={PATHS.panel + module.path}
          onClick={closeCanvas}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-2 rounded-md border-2 border-primary px-2 py-1 ",
              isActive ? "bg-primary/10" : "hover:bg-primary/5"
            )
          }
        >
          <span className="text-primary">{module.icon}</span>
          <span className="capitalize">{module.label}</span>
        </NavLink>
      ))}
    </aside>
  )
}
