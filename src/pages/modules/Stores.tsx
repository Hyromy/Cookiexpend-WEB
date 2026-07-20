import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import type { ApiRequestError, establishmentRequest, establishmentResponse, storeResponse } from "../../types/api"
import { storeService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { Form, TextField } from "../../components/Form"
import { ActionButton, Button } from "../../components/Button"
import { Table } from "../../components/Table"
import type { eventAction, eventData, eventModel } from "../../types/events"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"

const STORE_EVENTS = ["store"] as eventModel[]
const ESTABLISHMENT_EVENTS = ["establishment"] as eventModel[]
const ON_EDITABLE_EVENTS = ["updated", "deleted"] as eventAction[]

const STORE_REQUIRED_ARGS = [
  "name",
  "municipality",
  "neighborhood",
  "street",
] as (keyof establishmentRequest)[]

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
  
  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Expendio
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Expendios", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Expendios"
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
  const { isLoading, request, setData } = useApi<storeResponse>()
  const { addToast } = useToast()

  useEffect(() => { if (store) setData(store) }, [store, setData])

  const submitErrorHandler = (err: ApiRequestError) => {
    const errData = err.data as Record<string, Record<string, string[]>>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)
    
    if (errData?.establishment?.name?.find(thisIncludes("already exists"))) {
      addToast("Ya existe una planta o expendio con ese nombre", "warning")
      return
    }
  
    addToast("Error al guardar el expendio, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: establishmentRequest) => {
    clearData(data)
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (store
      ? request(storeService.upd(store.id, { establishment: data }))
      : request(storeService.new({ establishment: data }))
    
    ).then(() => {
      addToast(`Expendio ${store ? "actualizado" : "creado"} con éxito`, "success")
      onDone?.()

    }).catch((error) => submitErrorHandler(error))
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
          defaultValue={store?.establishment.name}
        />
      </div>
      <div>
        <TextField
          cleanEmpty
          cleanRegex={dangerChars}
          required
          name="municipality"
          label="Municipio"
          defaultValue={store?.establishment.municipality}
        />
      </div>
      <div>
        <TextField
          cleanEmpty
          cleanRegex={dangerChars}
          required
          name="neighborhood"
          label="Colonia"
          defaultValue={store?.establishment.neighborhood}
        />
      </div>
      <div>
        <TextField
          cleanEmpty
          cleanRegex={dangerChars}
          required
          name="street"
          label="Calle"
          defaultValue={store?.establishment.street}
        />
      </div>
      <div>
        <TextField
          cleanRegex={/\D/}
          name="number"
          label="Número"
          defaultValue={store?.establishment.number}
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
  store: storeResponse | null
  setStore: (store: storeResponse | null) => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  store,
  setStore
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!store) return
    request(storeService.del(store.id))
      .then(() => {
        setStore(null)
        setIsOpen(false)
        addToast("Expendio eliminado con éxito", "success")
      })
      .catch((error) => {
        console.error(error)
        addToast("Error al eliminar el expendio", "error")
      })
  }

  return (
    <Dialog
      title="Eliminar expendio"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar el expendio {store?.establishment.name}?
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

const clearData = (data: establishmentRequest) => {
  STORE_REQUIRED_ARGS.forEach(key => {
    if (data[key]) {
      data[key] = data[key].trim().replace(/\s+/g, " ")
    }
  })

  if (!data.number?.trim()) delete data.number
}

const validate = (data: establishmentRequest): string | true => {
  if (STORE_REQUIRED_ARGS.some(k => !data[k])) {
    return "Por favor, complete todos los campos obligatorios."
  }

  return true
}
