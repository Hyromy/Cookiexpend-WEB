import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { factoryService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import type { establishmentRequest, establishmentResponse, factoryResponse } from "../../types/api"
import { Button } from "../../components/Button"
import { Form, TextField } from "../../components/Form"
import { Table } from "../../components/Table"
import { Pencil, Trash } from "lucide-react"
import type { eventAction, eventData, eventModel } from "../../types/events"
import { Dialog, Modal } from "../../components/Modal"

const FACTORY_EVENTS = ["factory"] as eventModel[]
const ESTABLISHMENT_EVENTS = ["establishment"] as eventModel[]
const ON_EDITABLE_EVENTS = ["updated", "deleted"] as eventAction[]

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

  const btnAdd = <Button onClick={openCreate}>Agregar Planta</Button>

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Plantas", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        {btnAdd}
        <Table
          headers={["Nombre", "Municipio", "Colonia", "Calle", "Número", "Acciones"]}
          data={data!}
          row={x => [
            x.establishment.name,
            x.establishment.municipality,
            x.establishment.neighborhood,
            x.establishment.street,
            x.establishment.number,
            <>
              <Button onClick={() => openEdit(x)}><Pencil /></Button>
              <Button onClick={() => openDelete(x)}><Trash /></Button>
            </>
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

  useEffect(() => { if (factory) setData(factory.establishment) }, [factory, setData])

  const onSubmitHandler = (data: establishmentRequest) => {
    if (Object.values(data).some(v => !v)) {
      alert("Por favor llena todos los campos antes de registrar")
      return
    }
    
    (factory
      ? request(factoryService.upd(factory.id, { establishment: data }))
      : request(factoryService.new({ establishment: data }))
    
    ).then((response) => {
      if (!response) return
      alert("Planta creada con exito!")
      onDone?.()
    
    }).catch((error) => {
      console.error(error)
      alert("Error al crear la planta")
    })
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <TextField
        name="municipality"
        placeholder="Municipio"
        defaultValue={factory?.establishment.municipality}
      />
      <TextField
        name="name"
        placeholder="Nombre"
        defaultValue={factory?.establishment.name}
      />
      <TextField
        name="neighborhood"
        placeholder="Colonia"
        defaultValue={factory?.establishment.neighborhood}
      />
      <TextField
        name="street"
        placeholder="Calle"
        defaultValue={factory?.establishment.street}
      />
      <TextField
        name="number"
        placeholder="Número"
        defaultValue={factory?.establishment.number}
      />
      <Button type="submit" disabled={isLoading}>
        Enviar
      </Button>
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

  const requestDelete = () => {
    if (!factory) return
    request(factoryService.del(factory.id))
      .then(() => {
        setFactory(null)
        setIsOpen(false)
      })
      .catch((error) => {
        console.error(error)
        alert("Error al eliminar la planta")
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
