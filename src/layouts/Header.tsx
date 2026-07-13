import { Button, ThemeButton } from "../components/Button"
import { User2, Menu, LogOut } from "lucide-react"
import useSidebar from "../hooks/useSidebar"
import useAuth from "../hooks/useAuth"
import Dropdown from "../components/Dropdown"
import useApi from "../hooks/useApi"
import { authService } from "../services/cookiexpend"
import { useLocation, useNavigate } from "react-router-dom"
import { PATHS } from "../routes/paths"
import { Dialog, Modal } from "../components/Modal"
import { useState } from "react"
import { Form, TextField } from "../components/Form"
import type { meRequest, meResponse } from "../types/api"
import { MODULE_ROUTES } from "../routes/modules"
import clsx from "clsx"
import useToast from "../hooks/useToast"

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
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { addToast } = useToast()
  
  const logoutHandler = () => {
    request(authService.logout())
      .then(() => {
        navigate(PATHS.login)
        refresh()
      })
      .catch(err => {
        addToast("Error al cerrar sesión", "error")
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
            onClick={() => setIsDialogOpen(true)}
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
          onDone={() => setIsModalOpen(false)}
        />
      </Modal>
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Cerrar sesión"
        onConfirm={logoutHandler}
      >
        ¿Estás seguro de que deseas cerrar sesión?
      </Dialog>
    </>
  )
}

type ProfileFormProps = {
  user: meResponse
  onDone: () => void
}
function ProfileForm({
  user,
  onDone
}: ProfileFormProps) {
  const { request, isLoading } = useApi()
  const { addToast } = useToast()

  const submitHandler = (data: meRequest) => {
    const validation = validateData(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    request(authService.upd(data))
    .then(() => {
      addToast("Perfil actualizado correctamente", "success")
      onDone()
    })
    .catch(err => {
      addToast("Error al actualizar el perfil", "error")
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
      <div className="flex justify-center">
        <Button
          className="px-6"
          type="submit"
          disabled={isLoading}
        >
          Guardar cambios
        </Button>
      </div>
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
