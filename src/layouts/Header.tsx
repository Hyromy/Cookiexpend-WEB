import { Button, ThemeButton } from "../components/Button"
import { User2, Menu, LogOut } from "lucide-react"
import useSidebar from "../hooks/useSidebar"
import useAuth from "../hooks/useAuth"
import Dropdown from "../components/Dropdown"
import useApi from "../hooks/useApi"
import { authService } from "../services/cookiexpend"
import { useNavigate } from "react-router-dom"
import { PATHS } from "../routes/paths"
import { Modal } from "../components/Modal"
import { useState } from "react"
import { Form, TextField } from "../components/Form"
import type { meRequest, meResponse } from "../types/api"

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
        options={[
          <Button
            className="w-full flex flex-row gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <User2 />
            Perfil
          </Button>,
          <Button
            className="w-full flex flex-row gap-2"
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
      <TextField
        name="first_name"
        placeholder="Nombre"
        defaultValue={user?.first_name}
      />
      <TextField
        name="last_name"
        placeholder="Apellido"
        defaultValue={user?.last_name}
      />
      <TextField
        name="email"
        placeholder="Correo electrónico"
        defaultValue={user?.email}
      />
      <TextField
        name="password"
        placeholder="Contraseña"
        type="password"
      />
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
