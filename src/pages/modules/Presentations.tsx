import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { presentationService } from "../../services/cookiexpend"
import type { ApiRequestError, presentationRequest, presentationResponse } from "../../types/api"
import { ActionButton, Button } from "../../components/Button"
import { Form, TextField } from "../../components/Form"
import { Table } from "../../components/Table"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"

export default function Presentations() {
  const { data, error, isLoading, request } = useApi<presentationResponse[]>()
  const requestData = useCallback(() => request(presentationService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPresentation, setEditingPresentation] = useState<presentationResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingPresentation, setDeletingPresentation] = useState<presentationResponse | null>(null)

  useEffect(() => { requestData() }, [requestData])

  const openCreate = () => {
    setEditingPresentation(null)
    setIsModalOpen(true)
  }
  const openEdit = (presentation: presentationResponse) => {
    setEditingPresentation(presentation)
    setIsModalOpen(true)
  }
  const openDelete = (presentation: presentationResponse) => {
    setDeletingPresentation(presentation)
    setIsDialogOpen(true)
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Presentación
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Presentaciones", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Presentaciones"
          columns={[
            { accessorKey: "label", header: "Nombre" },
            { accessorKey: "order", header: "Orden" },
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
        title={(editingPresentation ? "Editar" : "Agregar") + " presentación"}
      >
        <PresentationForm
          presentation={editingPresentation}
          onDone={() => {
            setEditingPresentation(null)
            setIsModalOpen(false)
            requestData()
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        presentation={deletingPresentation}
        setPresentation={setDeletingPresentation}
        onDeleted={requestData}
      />
    </>
  )
}

type PresentationFormProps = {
  presentation: presentationResponse | null
  onDone?: () => void
}
function PresentationForm({ presentation, onDone }: PresentationFormProps) {
  const { isLoading, request, setData } = useApi()
  const { addToast } = useToast()

  useEffect(() => { if (presentation) setData(presentation) }, [presentation, setData])

  const submitErrorHandler = (err: ApiRequestError) => {
    const errData = err.data as Record<string, string[]>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)

    if (errData?.label?.find(thisIncludes("already exists"))) {
      addToast("Ya existe una presentación con ese nombre", "warning")
      return
    }

    addToast("Error al guardar la presentación, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: presentationRequest) => {
    clearData(data)
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (presentation
      ? request(presentationService.upd(presentation.id, data))
      : request(presentationService.new(data))

    ).then(() => {
      addToast(`Presentación ${presentation ? "actualizada" : "creada"} con éxito`, "success")
      onDone?.()

    }).catch(err => submitErrorHandler(err))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <div>
        <TextField
          cleanEmpty
          cleanRegex={/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,\s-]/g}
          required
          name="label"
          label="Nombre"
          defaultValue={presentation?.label}
        />
      </div>
      <div>
        <TextField
          cleanRegex={/\D/}
          name="order"
          label="Orden"
          defaultValue={presentation?.order}
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
  )
}

type DeleteDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  presentation: presentationResponse | null
  setPresentation: (presentation: presentationResponse | null) => void
  onDeleted: () => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  presentation,
  setPresentation,
  onDeleted
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!presentation) return
    request(presentationService.del(presentation.id))
      .then(() => {
        setPresentation(null)
        setIsOpen(false)
        addToast("Presentación eliminada con éxito", "success")
        onDeleted()
      })
      .catch(err => {
        console.error(err)
        addToast("Error al eliminar la presentación", "error")
      })
  }

  return (
    <Dialog
      title="Eliminar presentación"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar la presentación "{presentation?.label}"?
    </Dialog>
  )
}

const clearData = (data: presentationRequest) => {
  data.label = data.label?.trim().replace(/\s+/g, " ")
  if (!String(data.order ?? "").trim()) delete data.order
}

const validate = (data: presentationRequest): string | true => {
  if (!data.label) {
    return "Por favor, complete todos los campos obligatorios."
  }

  return true
}