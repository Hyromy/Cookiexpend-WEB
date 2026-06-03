import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import type { establishmentRequest, establishmentResponse, storeResponse } from "../../types/api"
import { storeService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { Form, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import { Table } from "../../components/Table"
import { Pencil, Trash } from "lucide-react"
import type { eventAction, eventData, eventModel } from "../../types/events"
import { Dialog, Modal } from "../../components/Modal"

const STORE_EVENTS = ["store"] as eventModel[]
const ESTABLISHMENT_EVENTS = ["establishment"] as eventModel[]
const ON_EDITABLE_EVENTS = ["updated", "deleted"] as eventAction[]

export default function Stores() {
  const { data, error, isLoading, request, setData } = useApi<storeResponse[]>()
  const requestData = useCallback(() => request(storeService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<storeResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingStore, setDeletingStore] = useState<storeResponse | null>(null)
  
  useEffect(() => { requestData() }, [requestData])
  useEvent({ 
    from: STORE_EVENTS,
    cb: useEventOnCUD<storeResponse>(setData)
  })
  useEvent({ 
    from: ESTABLISHMENT_EVENTS,
    on: ON_EDITABLE_EVENTS,
    cb: useCallback((e) => establishmentEvents(e, setData), [setData])
  })

  const openCreate = () => {
    setEditingStore(null)
    setIsModalOpen(true)
  }
  const openEdit = (store: storeResponse) => {
    setEditingStore(store)
    setIsModalOpen(true)
  }
  const openDelete = (store: storeResponse) => {
    setDeletingStore(store)
    setIsDialogOpen(true)
  }
  
  const btnAdd = <Button onClick={openCreate}>Agregar Planta</Button>

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Expendios", content: btnAdd }}
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
        title={(editingStore ? "Editar" : "Agregar") + " expendio"}
      >
        <StoreForm
          store={editingStore}
          onDone={() => {
            setEditingStore(null)
            setIsModalOpen(false)
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        store={deletingStore}
        setStore={setDeletingStore}
      />
    </>
  )
}

type StoreFormProps = {
  store: storeResponse | null
  onDone?: () => void
}
function StoreForm({ store, onDone }: StoreFormProps) {
  const { data, error, isLoading, request, setData } = useApi<storeResponse>()
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { if (store) setData(store) }, [store, setData])
  useEffect(() => {
    if (submitted && data) {
      alert("Expendio creado con exito!")
      onDone?.()
      setSubmitted(false)
    }
    if (error) {
      console.error(error)
      alert("Error al crear el expendio")
      setSubmitted(false)
    }
  }, [data, error, onDone, submitted])

  const onSubmitHandler = (data: establishmentRequest) => {
    if (Object.values(data).some(v => !v)) {
      alert("Por favor llena todos los campos")
      return
    }

    setSubmitted(true)
    store
      ? request(storeService.upd(store.id, { establishment: data }))
      : request(storeService.new({ establishment: data }))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <TextField
        name="municipality"
        placeholder="Municipio"
        defaultValue={store?.establishment.municipality}  
      />
      <TextField
        name="name"
        placeholder="Nombre"
        defaultValue={store?.establishment.name}  
      />
      <TextField
        name="neighborhood"
        placeholder="Colonia"
        defaultValue={store?.establishment.neighborhood}  
      />
      <TextField
        name="street"
        placeholder="Calle"
        defaultValue={store?.establishment.street}  
      />
      <TextField
        name="number"
        placeholder="Número"
        defaultValue={store?.establishment.number}  
      />
      <Button type="submit" disabled={isLoading}>
        Crear nuevo expendio
      </Button>
    </Form>
  )
}

type DeleteDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  store: storeResponse | null
  setStore: (store: storeResponse | null) => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  store,
  setStore
}: DeleteDialogProps) {
  const { data, error, isLoading, request } = useApi()
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (submitted && data != null) {
      alert("Expendio eliminado con exito!")
      setStore(null)
      setIsOpen(false)
      setSubmitted(false)
    }
    if (error) {
      console.error(error)
      alert("Error al eliminar el expendio")
      setSubmitted(false)
    }
  }, [data, error, setStore, setIsOpen, submitted])

  return (
    <Dialog
      title="Eliminar expendio"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={() => {
        console.log(store)
        if (!store) return
        setSubmitted(true)
        request(storeService.del(store.id))
      }}
    >
      <p>¿Estás seguro que quieres eliminar el expendio {store?.establishment.name}?</p>
    </Dialog>
  )
}

const establishmentEvents = (e: eventData, setData: Dispatch<SetStateAction<storeResponse[] | null>>) => {
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
