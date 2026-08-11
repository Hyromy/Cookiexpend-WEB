import { useCallback, useEffect, useState } from "react"
import { X } from "lucide-react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { departmentService, subjectService } from "../../services/cookiexpend"
import type { ApiRequestError, departmentRequest, departmentResponse, subjectResponse } from "../../types/api"
import { ActionButton, Button } from "../../components/Button"
import { Form, TextField } from "../../components/Form"
import { Table } from "../../components/Table"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"

export default function Departments() {
  const { data, error, isLoading, request } = useApi<departmentResponse[]>()
  const requestData = useCallback(() => request(departmentService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<departmentResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingDepartment, setDeletingDepartment] = useState<departmentResponse | null>(null)

  useEffect(() => { requestData() }, [requestData])

  const openCreate = () => {
    setEditingDepartment(null)
    setIsModalOpen(true)
  }
  const openEdit = (department: departmentResponse) => {
    setEditingDepartment(department)
    setIsModalOpen(true)
  }
  const openDelete = (department: departmentResponse) => {
    setDeletingDepartment(department)
    setIsDialogOpen(true)
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Departamento
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Departamentos", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Departamentos"
          columns={[
            { accessorKey: "name", header: "Nombre" },
            { accessorKey: "email", header: "Correo" },
            { accessorKey: "order", header: "Orden" },
            {
              id: "subjects",
              header: "Asuntos",
              cell: ({ row }) => row.original.subjects.length
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
        title={(editingDepartment ? "Editar" : "Agregar") + " departamento"}
      >
        <DepartmentForm
          department={editingDepartment}
          onDone={() => {
            setEditingDepartment(null)
            setIsModalOpen(false)
            requestData()
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        department={deletingDepartment}
        setDepartment={setDeletingDepartment}
        onDeleted={requestData}
      />
    </>
  )
}

type DepartmentFormProps = {
  department: departmentResponse | null
  onDone?: () => void
}
function DepartmentForm({ department, onDone }: DepartmentFormProps) {
  const { isLoading, request, setData } = useApi()
  const { addToast } = useToast()
  const [subjects, setSubjects] = useState<subjectResponse[]>(() => department?.subjects ?? [])

  useEffect(() => { if (department) setData(department) }, [department, setData])

  const submitErrorHandler = (err: ApiRequestError) => {
    const errData = err.data as Record<string, string[]>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)

    if (errData?.name?.find(thisIncludes("already exists"))) {
      addToast("Ya existe un departamento con ese nombre", "warning")
      return
    }

    addToast("Error al guardar el departamento, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: departmentRequest) => {
    clearData(data)
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (department
      ? request(departmentService.upd(department.id, data))
      : request(departmentService.new(data))

    ).then(() => {
      addToast(`Departamento ${department ? "actualizado" : "creado"} con éxito`, "success")
      onDone?.()

    }).catch(err => submitErrorHandler(err))
  }

  return (
    <>
      <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
        <div>
          <TextField
            cleanEmpty
            required
            name="name"
            label="Nombre"
            defaultValue={department?.name}
          />
        </div>
        <div>
          <TextField
            cleanEmpty
            name="email"
            label="Correo de contacto"
            defaultValue={department?.email}
          />
        </div>
        <div>
          <TextField
            cleanRegex={/\D/}
            name="order"
            label="Orden"
            defaultValue={department?.order}
            placeholder="0"
          />
        </div>
        <div className="flex justify-center">
          <Button
            className="px-6"
            type="submit"
            disabled={isLoading}
          >
            Guardar
          </Button>
        </div>
      </Form>
      {department
        ? (
          <SubjectsField
            departmentId={department.id}
            subjects={subjects}
            onChange={setSubjects}
          />
        )
        : (
          <p className="mt-4 text-sm opacity-60 text-center">
            Podrás agregar asuntos después de guardar el departamento.
          </p>
        )
      }
    </>
  )
}

type SubjectsFieldProps = {
  departmentId: number
  subjects: subjectResponse[]
  onChange: (subjects: subjectResponse[]) => void
}
function SubjectsField({ departmentId, subjects, onChange }: SubjectsFieldProps) {
  const { isLoading, request } = useApi<subjectResponse>()
  const { addToast } = useToast()
  const [label, setLabel] = useState("")

  const handleAdd = () => {
    const trimmed = label.trim()
    if (!trimmed) return

    request(subjectService.new({ label: trimmed, department: departmentId, order: subjects.length }))
      .then((newSubject) => {
        onChange([...subjects, newSubject!])
        setLabel("")
      })
      .catch(() => addToast("Error al agregar el asunto, por favor intente más tarde", "error"))
  }

  const handleRemove = (subjectId: number) => {
    request(subjectService.del(subjectId))
      .then(() => onChange(subjects.filter(s => s.id != subjectId)))
      .catch(() => addToast("Error al eliminar el asunto, por favor intente más tarde", "error"))
  }

  return (
    <div className="w-full space-y-2 mt-4">
      <label className="block text-sm/6 font-medium">Asuntos</label>
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {subjects.map(subject => (
            <span
              key={subject.id}
              className="flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2.5 py-1 text-xs font-medium"
            >
              {subject.label}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleRemove(subject.id)}
                className="hover:cursor-pointer hover:opacity-70 disabled:opacity-50"
                aria-label={`Quitar ${subject.label}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          disabled={isLoading}
          value={label}
          onInput={(e) => setLabel(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Nuevo asunto..."
          className="block w-full rounded-md px-3 py-1.5 text-base sm:text-sm/6 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-primary transition-all duration-150"
        />
        <Button
          type="button"
          disabled={isLoading || !label.trim()}
          onClick={handleAdd}
          className="px-4 shrink-0"
        >
          Agregar
        </Button>
      </div>
    </div>
  )
}

type DeleteDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  department: departmentResponse | null
  setDepartment: (department: departmentResponse | null) => void
  onDeleted: () => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  department,
  setDepartment,
  onDeleted
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!department) return
    request(departmentService.del(department.id))
      .then(() => {
        setDepartment(null)
        setIsOpen(false)
        addToast("Departamento eliminado con éxito", "success")
        onDeleted()
      })
      .catch(err => {
        console.error(err)
        addToast("Error al eliminar el departamento", "error")
      })
  }

  return (
    <Dialog
      title="Eliminar departamento"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar el departamento "{department?.name}"?
    </Dialog>
  )
}

const clearData = (data: departmentRequest) => {
  data.name = data.name?.trim().replace(/\s+/g, " ")
  data.email = data.email?.trim()
  if (!data.email) delete data.email
  if (!String(data.order ?? "").trim()) delete data.order
}

const validate = (data: departmentRequest): string | true => {
  if (!data.name) {
    return "Por favor, complete todos los campos obligatorios."
  }

  return true
}