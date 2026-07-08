import { Button, ThemeButton } from "../components/Button"
import { User2, Menu, LogOut } from "lucide-react"
import useSidebar from "../hooks/useSidebar"
import useAuth from "../hooks/useAuth"
import Dropdown from "../components/Dropdown"
import useApi from "../hooks/useApi"
import { authService } from "../services/cookiexpend"
import { useLocation, useNavigate } from "react-router-dom"
import { PATHS } from "../routes/paths"
import { Modal } from "../components/Modal"
import { useState } from "react"
import { Form, TextField } from "../components/Form"
import type { meRequest, meResponse } from "../types/api"
import { MODULE_ROUTES } from "../routes/modules"
import clsx from "clsx"

export default function Header() {
  const { hasSidebar, setActiveSidebar, activeSidebar } = useSidebar()

  const hideOnClasses = "lg:hidden"
  return (
    <header className="sticky top-0 flex flex-col bg-card z-50">
      <section className="border-b border-muted p-1 h-header-h">
        <div className="flex mx-auto w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            {hasSidebar && (
              <>
                <Button
                  className={clsx("p-1 rounded-md", hideOnClasses)}
                  onClick={() => setActiveSidebar(activeSidebar != "navigation" ? "navigation" : null)}
                  variant="ghost"
                >
                  <Menu />
                </Button>
                <CurrentModuleLabel className={clsx("text-lg", hideOnClasses)} />
              </>
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

function CurrentModuleLabel({ className }: { className?: string }) {
  const location = useLocation()

  return (
    <span className={className}>
      {MODULE_ROUTES.find(module => (
        location.pathname.endsWith(module.path)
      ))?.label}
    </span>
  )
}

function Profile() {
  const { user, refresh } = useAuth()
  const { request } = useApi()
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
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
    <>
      <Dropdown
        align="right"
        options={[
          <Button
            noFocusRing
            variant="ghost"
            className="w-full flex flex-row gap-2 hover:bg-bg/90"
            onClick={() => setIsModalOpen(true)}
          >
            <User2 />
            Perfil
          </Button>,
          <Button
            noFocusRing
            variant="ghost"
            className="w-full flex flex-row gap-2 hover:bg-bg/90 text-red-500"
            onClick={logoutHandler}
          >
            <LogOut />
            Cerrar sesión
          </Button>,
        ]}
      >
        <User2 />
        {user?.username}
      </Dropdown>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Actualizar perfil"
      >
        <ProfileForm
          user={user!}
          refresh={refresh}
          onDone={() => setIsModalOpen(false)}
        />
      </Modal>
    </>
  )
}

type ProfileFormProps = {
  user: meResponse
  refresh: () => Promise<void>
  onDone: () => void
}
function ProfileForm({
  user,
  refresh,
  onDone
}: ProfileFormProps) {
  const { request, isLoading } = useApi()

  const submitHandler = (data: meRequest) => {
    const validation = validateData(data)
    if (validation != true) {
      alert(validation)
      return
    }

    request(authService.upd(data))
    .then(() => {
      alert("Perfil actualizado correctamente")
      refresh()
      onDone()
    })
    .catch(err => {
      alert("Error al actualizar el perfil")
      console.error(err)
    })
  }

  return (
    <Form onSubmit={submitHandler} className="flex flex-col gap-4">
      <div>
        <TextField
          name=""
          label="Establecimiento asignado"
          defaultValue={user?.establishment?.name}
          readonly
          disabled
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <TextField
            cleanEmpty
            required
            name="first_name"
            label="Nombre"
            defaultValue={user?.first_name}
          />
        </div>
        <div>
          <TextField
            cleanEmpty
            required
            name="last_name"
            label="Apellido"
            defaultValue={user?.last_name}
          />
        </div>
      </div>
      <div>
        <TextField
          cleanEmpty
          required
          name="email"
          label="Correo electrónico"
          defaultValue={user?.email}
        />
      </div>
      <div>
        <TextField
          cleanRegex={/\s/}
          name="password"
          label="Contraseña"
          type="password"
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        Guardar cambios
      </Button>
    </Form>
  )
}

const validateData = (data: meRequest): string | true => {
  if (!data.first_name) return "El nombre es requerido"
  if (!data.last_name) return "El apellido es requerido"
  if (!data.email) return "El correo electrónico es requerido"
  if (!data.password) delete data.password
  if (data.password && data.password.length < 8) return "La contraseña debe tener al menos 8 caracteres"
  
  return true
}
