import { useCallback, useEffect, useMemo, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { establishmentService, profileService } from "../../services/cookiexpend"
import { Table } from "../../components/Table"
import { ActionButton, Button } from "../../components/Button"
import type { ApiRequestError, establishmentResponse, profileRequest, profileResponse, userRoleName } from "../../types/api"
import { Dialog, Modal } from "../../components/Modal"
import { Form, SelectField, TextField, type SelectFieldProps } from "../../components/Form"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import useAuth from "../../hooks/useAuth"
import { EMAIL_REGEX, USERNAME_REGEX } from "../../constants/regex"
import useToast from "../../hooks/useToast"

export default function Users() {
  const { data, error, isLoading, request, setData } = useApi<profileResponse[]>()
  const requestData = useCallback(() => request(profileService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<profileResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState<profileResponse | null>(null)
  const { user } = useAuth()

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: ["profile"],
    cb: useEventOnCUD<profileResponse>(setData)
  })

  const profiles = useMemo(() => data?.filter(p => p.user.id != user?.id) || [], [data, user?.id])

  const openCreate = () => {
    setEditingProfile(null)
    setIsModalOpen(true)
  }
  const openEdit = (profile: profileResponse) => {
    setEditingProfile(profile)
    setIsModalOpen(true)
  }
  const openDelete = (profile: profileResponse) => {
    setDeletingProfile(profile)
    setIsDialogOpen(true)
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Usuario
    </Button>
  )

  return (
    <>
      <StateGate
        data={profiles}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Usuarios", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={profiles}
          exportToExcel
          filename="Usuarios"
          columns={[
            { accessorKey: "user.last_name", header: "Apellido" },
            { accessorKey: "user.first_name", header: "Nombre" },
            { accessorKey: "user.username", header: "Usuario" },
            { accessorKey: "user.email", header: "Correo" },
            { 
              accessorKey: "role",
              header: "Rol",
              cell: ({ getValue }) => getValue() == "factory" ? "R. Planta" : "R. Expendio"
            },
            {
              id: "actions",
              header: "Acciones",
              cell: ({ row }) => (
                <div className="flex gap-2">
                  <ActionButton
                    variant="warning"
                    icon="pencil"
                    cb={() => openEdit(row.original)}
                  />
                  <ActionButton
                    variant="danger"
                    icon="trash"
                    cb={() => openDelete(row.original)}
                  />
                </div>
              )
            }
          ]}
        />
      </StateGate>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={(editingProfile ? "Editar" : "Agregar") + " usuario"}
      >
        <UserForm
          profile={editingProfile}
          onDone={() => {
            setEditingProfile(null)
            setIsModalOpen(false)
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        profile={deletingProfile}
        setProfile={setDeletingProfile}
      />
    </>
  )
}

type UserFormProps = {
  profile: profileResponse | null
  onDone: () => void
}
function UserForm({
  profile,
  onDone
}: UserFormProps) {
  const options: SelectFieldProps["options"] = [
    { value: "", label: "Seleccione un rol", disabled: true },
    { value: "store", label: "Responsable de expendio" },
    { value: "factory", label: "Responsable de planta" },
  ]

  const { isLoading, request, setData } = useApi()
  const [currentRole, setCurrentRole] = useState<userRoleName | "">(
    profile?.role || (options[0].value as userRoleName | "")
  )
  const { addToast } = useToast()

  useEffect(() => { 
    if (profile) {
      setData(profile)
      setCurrentRole(profile.role)
    }
  }, [profile, setData])

  const onSubmitErrorHandler = (err: ApiRequestError, action: "crear" | "actualizar") => {
    const errData: Record<string, string> = err.data as Record<string, string>

    if (errData?.username?.includes("is required")) {
      addToast("El nombre de usuario es requerido", "warning")
      return
    }
    if (errData?.username?.includes("already in use")) {
      addToast("El nombre de usuario ya está en uso", "warning")
      return
    }
    if (errData?.email?.includes("is required")) {
      addToast("El correo electrónico es requerido", "warning")
      return
    }
    if (errData?.email?.includes("already in use")) {
      addToast("El correo electrónico ya está en uso", "warning")
      return
    }

    addToast(`Ocurrió un error inesperado al ${action} el usuario. Por favor, inténtelo más tarde.`, "error")
  }

  const onSubmitHandler = (data: profileRequest) => {
    const validation = validateSubmit(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (profile
      ? request(profileService.upd(profile.id, data))
      : request(profileService.new(data))
    
    ).then(() => {
      addToast("Usuario " + (profile ? "actualizado" : "creado") + " exitosamente", "success")
      onDone?.()
    
    }).catch(err => onSubmitErrorHandler(err, profile ? "actualizar" : "crear"))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <div>
        <TextField
          required
          name="username"
          label="Nombre de usuario"
          defaultValue={profile?.user.username}
          cleanRegex={new RegExp(`[^${USERNAME_REGEX}]`, "g")}
        />
      </div>
      <div>
        <TextField
          required
          name="email"
          label="Correo electrónico"
          defaultValue={profile?.user.email}
          cleanRegex={new RegExp(`[^${EMAIL_REGEX}]`, "g")}
        />
      </div>
      <SelectField
        name="role"
        label="Rol de usuario"
        required
        selected={profile?.role}
        options={options}
        onChange={v => setCurrentRole(v as userRoleName)}
      />
      <EstablishmentSelect
        key={currentRole}
        role={currentRole!}
        profile={profile}
      />
      <div className="flex justify-center">
        <Button
          type="submit"
          disabled={isLoading}
          className="px-6"
        >
          Enviar
        </Button>
      </div>
    </Form>
  )
}

type EstablishmentSelectProps = {
  role: userRoleName | ""
  profile?: profileResponse | null
}
function EstablishmentSelect({
  role,
  profile
}: EstablishmentSelectProps) {
  const { data, request, isLoading } = useApi<establishmentResponse[]>()

  useEffect(() => { request(establishmentService.get()) }, [request])

  const options = useMemo(() => {
    const thisData: SelectFieldProps["options"] = []
    if (!role) {
      thisData.push({ value: "", label: "Seleccione un rol primero", disabled: true })
    }

    if (data) {
      thisData.push(
        {
          label: "Seleccione un" + (role == "factory" ? "a planta" : " expendio"),
          value: "",
          disabled: true
        },
        ...data.filter(e => e.type == role).map(e => ({
          value: e.id.toString(),
          label: e.name
        }))
      )
    }
    return thisData
  }, [data, role])

  return (
    <SelectField
      disabled={!role || isLoading}
      required
      label="Establecimiento"
      name="establishment"
      options={options}
      selected={role && profile?.[role]?.establishment.id.toString()}
    />
  )
}

type DeleteDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  profile: profileResponse | null
  setProfile: (profile: profileResponse | null) => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  profile,
  setProfile,
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!profile) return
    request(profileService.del(profile.id))
      .then(() => {
        setProfile(null)
        setIsOpen(false)
        addToast("Usuario eliminado exitosamente", "success")
      })
      .catch((error) => {
        console.error(error)
        addToast("Error al eliminar el usuario", "error")
      })
  }
  
  return (
    <Dialog
      title="Eliminar usuario"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que deseas eliminar el usuario "{profile?.user.username}"?
    </Dialog>
  )
}

const validateSubmit = (data: profileRequest): string | true => {
  if (!data.username) return "El nombre de usuario es requerido"
  if (!data.email) return "El correo electrónico es requerido"
  if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "El correo electrónico no es válido"
  if (!data.role) return "El rol es requerido"
  if (!data.establishment) return "El establecimiento es requerido"
  
  return true
}
