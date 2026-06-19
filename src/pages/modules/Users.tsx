import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { establishmentService, profileService } from "../../services/cookiexpend"
import { Table } from "../../components/Table"
import { Button } from "../../components/Button"
import { Pencil, Trash } from "lucide-react"
import type { establishmentResponse, profileRequest, profileResponse, userRoleName } from "../../types/api"
import { Dialog, Modal } from "../../components/Modal"
import { Form, SelectField, TextField } from "../../components/Form"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import useAuth from "../../hooks/useAuth"

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

  const btnAdd = <Button onClick={openCreate}>Agregar Usuario</Button>

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Usuarios", content: "No deberías poder ver este mensaje" }}
        errorProps={{ onRetry: requestData }}
      >
        {btnAdd}
        <Table
          data={data!}
          exportToExcel
          filename="Usuarios"
          excludeFromView={row => row.user.id == user?.id}
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
                <>
                  <Button onClick={() => openEdit(row.original)}><Pencil /></Button>
                  <Button onClick={() => openDelete(row.original)}><Trash /></Button>
                </>
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
  const options: { value: userRoleName, label: string }[] = [
    { value: "store", label: "Responsable de expendio" },
    { value: "factory", label: "Responsable de planta" },
  ]

  const { isLoading, request, setData } = useApi()
  const [currentRole, setCurrentRole] = useState<userRoleName>(options[0].value)

  useEffect(() => { if (profile) setData(profile) }, [profile, setData])

  const onSubmitHandler = (data: profileRequest) => {
    const validation = validateSubmit(data)
    if (validation != true) {
      alert(validation)
      return
    }

    (profile
      ? request(profileService.upd(profile.id, data))
      : request(profileService.new(data))
    
    ).then((response) => {
      console.warn("data sended, the default password is '0987654aA'")

      if (!response) return
      alert("Perfil " + (profile ? "actualizado" : "creado") + " exitosamente")
      onDone?.()
    
    }).catch((error) => {
      console.error(error)
      alert("Error al " + (profile ? "actualizar" : "crear") + " el perfil")
    })
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <TextField
        name="username"
        placeholder="Nombre de usuario"
        defaultValue={profile?.user.username}
      />
      <TextField
        name="email"
        placeholder="Correo electrónico"
        defaultValue={profile?.user.email}
      />
      <SelectField
        name="role"
        selected={profile?.role}
        options={options}
        onChange={v => setCurrentRole(v as userRoleName)}
      />
      <EstablishmentSelect
        role={currentRole!}
        profile={profile}
      />
      <Button type="submit" disabled={isLoading}>
        Enviar
      </Button>
    </Form>
  )
}

type EstablishmentSelectProps = {
  role: userRoleName
  profile?: profileResponse | null
}
function EstablishmentSelect({
  role,
  profile
}: EstablishmentSelectProps) {
  const { data, request, isLoading } = useApi<establishmentResponse[]>()

  useEffect(() => { request(establishmentService.get()) }, [])

  return !isLoading && (
    <SelectField
      name="establishment"
      options={data
        ?.filter(e => e.type == role)
        .map(e => ({ value: e.id.toString(), label: e.name }))
        || []
      }
      selected={profile?.[role]?.establishment.id.toString()}
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
  
  const requestDelete = () => {
    if (!profile) return
    request(profileService.del(profile.id))
      .then(() => {
        setProfile(null)
        setIsOpen(false)
      })
      .catch((error) => {
        console.error(error)
        alert("Error al eliminar el perfil")
      })
  }
  
  return (
    <Dialog
      title="Eliminar perfil"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que deseas eliminar el perfil "{profile?.user.username}"?
    </Dialog>
  )
}

const validateSubmit = (data: profileRequest): string | true => {
  if (!data.username) return "El nombre de usuario es requerido"
  //if (!data.email) return "El correo electrónico es requerido"
  if (!data.role) return "El rol es requerido"
  if (!data.establishment) return "El establecimiento es requerido"
  
  return true
}
