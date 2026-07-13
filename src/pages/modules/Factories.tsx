import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { factoryService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import type { ApiRequestError, establishmentRequest, establishmentResponse, factoryResponse } from "../../types/api"
import { ActionButton, Button } from "../../components/Button"
import { Form, TextField } from "../../components/Form"
import { Table } from "../../components/Table"
import type { eventAction, eventData, eventModel } from "../../types/events"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"

const FACTORY_EVENTS = ["factory"] as eventModel[]
const ESTABLISHMENT_EVENTS = ["establishment"] as eventModel[]
const ON_EDITABLE_EVENTS = ["updated", "deleted"] as eventAction[]

const FACTORY_REQUIRED_ARGS = [
  "name",
  "municipality",
  "neighborhood",
  "street",
] as (keyof establishmentRequest)[]

export default function Factories() {
  const { data, error, isLoading, request, setData } = useApi<factoryResponse[]>()
  const requestData = useCallback(() => request(factoryService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFactory, setEditingFactory] = useState<factoryResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingFactory, setDeletingFactory] = useState<factoryResponse | null>(null)

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: FACTORY_EVENTS,
    cb: useEventOnCUD<factoryResponse>(setData)
  })
  useEvent({ 
    from: ESTABLISHMENT_EVENTS,
    on: ON_EDITABLE_EVENTS,
    cb: useCallback((e) => establishmentEvents(e, setData), [setData])
  })

  const openCreate = () => {
    setEditingFactory(null)
    setIsModalOpen(true)
  }
  const openEdit = (factory: factoryResponse) => {
    setEditingFactory(factory)
    setIsModalOpen(true)
  }
  const openDelete = (factory: factoryResponse) => {
    setDeletingFactory(factory)
    setIsDialogOpen(true)
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Planta
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Plantas", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Plantas"
          columns={[
            { accessorKey: "establishment.name", header: "Nombre" },
            { accessorKey: "establishment.municipality", header: "Municipio" },
            { accessorKey: "establishment.neighborhood", header: "Colonia" },
            { accessorKey: "establishment.street", header: "Calle" },
            { accessorKey: "establishment.number", header: "Número" },
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
        title={(editingFactory ? "Editar" : "Agregar") + " planta"}
      >
        <FactoryForm
          factory={editingFactory}
          onDone={() => {
            setEditingFactory(null)
            setIsModalOpen(false)
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        factory={deletingFactory}
        setFactory={setDeletingFactory}
      />
    </>
  )
}

type FactoryFormProps = {
  factory: factoryResponse | null
  onDone?: () => void
}
function FactoryForm({ factory, onDone }: FactoryFormProps) {
  const { isLoading, request, setData } = useApi<establishmentRequest>()
  const { addToast } = useToast()

  useEffect(() => { if (factory) setData(factory.establishment) }, [factory, setData])

  const submitErrorHandler = (err: ApiRequestError) => {
    const errData = err.data as Record<string, Record<string, string[]>>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)

    if (errData?.establishment?.name?.find(thisIncludes("already exists"))) {
      addToast("Ya existe una planta o expendio con ese nombre", "warning")
      return
    }

    addToast("Error al guardar la planta, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: establishmentRequest) => {
    clearData(data)
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (factory
      ? request(factoryService.upd(factory.id, { establishment: data }))
      : request(factoryService.new({ establishment: data }))
    
    ).then(() => {
      addToast(`Planta ${factory ? "actualizada" : "creada"} con éxito`, "success")
      onDone?.()

    }).catch(err => submitErrorHandler(err))
  }
  
  const dangerChars = /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,\s-]/g

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <div>
        <TextField
          cleanEmpty
          cleanRegex={dangerChars}
          required
          name="name"
          label="Nombre"
          defaultValue={factory?.establishment.name}
        />
      </div>
      <div>
        <TextField
          cleanEmpty
          cleanRegex={dangerChars}
          required
          name="municipality"
          label="Municipio"
          defaultValue={factory?.establishment.municipality}
        />
      </div>
      <div>
        <TextField
          cleanEmpty
          cleanRegex={dangerChars}
          required
          name="neighborhood"
          label="Colonia"
          defaultValue={factory?.establishment.neighborhood}
        />
      </div>
      <div>
        <TextField
          cleanEmpty
          cleanRegex={dangerChars}
          required
          name="street"
          label="Calle"
          defaultValue={factory?.establishment.street}
        />
      </div>
      <div>
        <TextField
          cleanRegex={/\D/}
          name="number"
          label="Número"
          defaultValue={factory?.establishment.number}
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
  factory: factoryResponse | null
  setFactory: (factory: factoryResponse | null) => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  factory,
  setFactory
} : DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!factory) return
    request(factoryService.del(factory.id))
      .then(() => {
        setFactory(null)
        setIsOpen(false)
        addToast("Planta eliminada con éxito", "success")
      })
      .catch(err => {
        console.error(err)
        addToast("Error al eliminar la planta", "error")
      })
  }

  return (
    <Dialog
      title="Eliminar planta"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar la planta "{factory?.establishment.name}"?
    </Dialog>
  )
}

const establishmentEvents = (e: eventData, setData: Dispatch<SetStateAction<factoryResponse[] | null>>) => {
  const data = e.data as establishmentResponse
  switch (e.action) {
    case "updated":
      return setData((prev) => {
        if (!prev) return prev
        return prev.map(f => (
          f.establishment.id == data.id
            ? { ...f, establishment: data }
            : f
        ))
      })

    case "deleted":
      return setData((prev) => {
        if (!prev) return prev
        return prev.filter(f => f.establishment.id != data.id)
      })
  }
}

const clearData = (data: establishmentRequest) => {
  FACTORY_REQUIRED_ARGS.forEach(key => {
    if (data[key]) {
      data[key] = data[key].trim().replace(/\s+/g, " ")
    }
  })

  if (!data.number?.trim()) delete data.number
}

const validate = (data: establishmentRequest): string | true => {
  if (FACTORY_REQUIRED_ARGS.some(k => !data[k])) {
    return "Por favor, complete todos los campos obligatorios."
  }

  return true
}
