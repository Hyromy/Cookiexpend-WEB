import { Button, ThemeButton } from "../components/Button"
import { User2, Menu, LogOut } from "lucide-react"
import useSidebar from "../hooks/useSidebar"
import useAuth from "../hooks/useAuth"
import Dropdown from "../components/Dropdown"
import useApi from "../hooks/useApi"
import { authService } from "../services/cookiexpend"
import { useNavigate } from "react-router-dom"
import { PATHS } from "../routes/paths"

export default function Header() {
  const { hasSidebar, setActiveSidebar, activeSidebar } = useSidebar()

  return (
    <header className="sticky top-0 flex flex-col bg-card">
      <section className="border-b border-muted p-1 h-header-h">
        <div className="flex mx-auto w-full max-w-7xl items-center justify-between">
          <div>
            {hasSidebar && (
              <Button
                className="lg:hidden p-1 -ml-1 rounded-md"
                onClick={() => setActiveSidebar(activeSidebar != "navigation" ? "navigation" : null)}
              >
                <Menu />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Profile />
            <ThemeButton />
          </div>
        </div>
      </section>
    </header>
  )
}

function Profile() {
  const { user, refresh } = useAuth()
  const { request } = useApi()
  const navigate = useNavigate()
  
  const logoutHandler = () => {
    request(authService.logout())
      .then(() => {
        navigate(PATHS.login)
        refresh()
      })
      .catch(err => {
        alert("Error al cerrar sesión")
        console.error(err)
      })
  }

  return (
    <Dropdown
      options={[
        <Button
          className="w-full flex flex-row gap-2"
          onClick={logoutHandler}
        >
          <LogOut />
          Cerrar sesión
        </Button>
      ]}
    >
      <User2 />
      {user?.username}
    </Dropdown>
  )
}
