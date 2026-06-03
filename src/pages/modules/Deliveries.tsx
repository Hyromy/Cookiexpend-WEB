import { type ChangeEvent, type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import type { deliveryRequest, deliveryResponse, establishmentResponse, factoryResponse, packageResponse, productResponse, storeResponse } from "../../types/api"
import { deliveryService, factoryService, productService, storeService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { Form, SelectField, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import { Table } from "../../components/Table"
import { Pencil, Trash } from "lucide-react"
import type { eventAction, eventData, eventModel } from "../../types/events"
import { Dialog, Modal } from "../../components/Modal"

const DELIVERY_EVENTS = ["delivery"] as eventModel[]
const STORE_FACTORY_EVENTS = ["store", "factory"] as eventModel[]
const ESTABLISHMENT_EVENTS = ["establishment"] as eventModel[]
const ON_EDITABLE_EVENTS = ["updated", "deleted"] as eventAction[]

export default function Deliveries() {
  const { data, error, isLoading, request, setData } = useApi<deliveryResponse[]>()
  const requestData = useCallback(() => request(deliveryService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDelivery, setEditingDelivery] = useState<deliveryResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingDelivery, setDeletingDelivery] = useState<deliveryResponse | null>(null)

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: DELIVERY_EVENTS,
    cb: useEventOnCUD<deliveryResponse>(setData)
  })
  useEvent({
    from: STORE_FACTORY_EVENTS,
    on: ON_EDITABLE_EVENTS,
    cb: useCallback((e) => factoryStoreEvents({ e, setData }), [setData])
  })
  useEvent({
    from: ESTABLISHMENT_EVENTS,
    on: ON_EDITABLE_EVENTS,
    cb: useCallback((e) => establishmentEvents({ e, setData }), [setData])
  })

  const openCreate = () => {
    setEditingDelivery(null)
    setIsModalOpen(true)
  }
  const openEdit = (delivery: deliveryResponse) => {
    setEditingDelivery(delivery)
    setIsModalOpen(true)
  }
  const openDelete = (delivery: deliveryResponse) => {
    setDeletingDelivery(delivery)
    setIsDialogOpen(true)
  }

  const btnAdd = <Button onClick={openCreate}>Agregar Reparto</Button>

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Repartos", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        {btnAdd}
        <Table
          headers={["ID", "Planta", "Expendio", "Productos", "Acciones"]}
          data={data!}
          row={x => [
            x.id,
            x.factory.establishment.name,
            x.store.establishment.name,
            x.package.map(p => `${p.product.name} (x${p.quantity})`).join(", "),
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
        title={(editingDelivery ? "Editar" : "Agregar") + " reparto"}
      >
        <DeliveryForm
          delivery={editingDelivery}
          onDone={() => {
            setEditingDelivery(null)
            setIsModalOpen(false)
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        delivery={deletingDelivery}
        setDelivery={setDeletingDelivery}
      />
    </>
  )
}

type DeliveryFormProps = {
  delivery: deliveryResponse | null
  onDone?: () => void
}
function DeliveryForm({ delivery, onDone }: DeliveryFormProps) {
  const { isLoading, request, setData } = useApi<deliveryResponse>()
  const [packages, setPackages] = useState<Record<number, number>>({})

  useEffect(() => {
    if (delivery) { 
      setData(delivery)
    }
  }, [delivery])

  const parseData = (data: deliveryRequest) => {
    for (const key in data) {
      if (key.startsWith("prod-")) delete data[key as keyof deliveryRequest]
    }

    data.package = Object.entries(packages)
      .filter(([, quantity]) => quantity >= 1)
      .map(([id, quantity]) => ({ product: Number(id), quantity }))
  }

  const onSubmitHandler = (data: deliveryRequest) => {
    parseData(data)
    if (!data.factory || !data.store || data.package.length == 0) {
      alert("Por favor llena todos los campos y agrega al menos un producto")
      return
    }

    (delivery
      ? request(deliveryService.upd(delivery.id, data))
      : request(deliveryService.new(data))
    
    ).then((response) => {
      if (!response) return
      alert("Reparto creado con exito!")
      onDone?.()

    }).catch((error) => {
      console.error(error)
      alert("Error al crear el reparto")
    })
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <ThisSelect
        getter={() => storeService.get()}
        name="store"
        placeholder="Selecciona un expendio"
        defaultValue={delivery?.store.id.toString()}
      />
      <ThisSelect
        getter={() => factoryService.get()}
        name="factory"
        placeholder="Selecciona una planta"
        defaultValue={delivery?.factory.id.toString()}
      />
      <ProductList
        onChange={setPackages}
        defaultValue={delivery?.package}
      />
      <Button type="submit" disabled={isLoading}>
        Crear nuevo reparto
      </Button>
    </Form>
  )
}

type ThisSelectProps = {
  getter: () => Promise<factoryResponse | factoryResponse[] | storeResponse | storeResponse[]>
  name: string
  placeholder: string
  defaultValue?: string
}
function ThisSelect({
  getter,
  name,
  placeholder,
  defaultValue
}: ThisSelectProps) {
  const { data, error, isLoading, request } = useApi<Array<factoryResponse | storeResponse>>()
  
  const getterRef = useRef(getter)

  useEffect(() => { getterRef.current = getter }, [getter])
  useEffect(() => { request(getterRef.current()) }, [request])

  useEffect(() => {
    if (error) {
      console.error(error)
    }
  }, [error])

  return !isLoading && (
    <SelectField
      name={name}
      placeholder={placeholder}
      selected={defaultValue}
      options={
        (data || []).map((x) =>
          ({ value: x.id.toString(), label: x.establishment.name })
        )
      }
    />
  )
}

type ProductListProps = {
  onChange: (data: Record<number, number>) => void
  defaultValue?: packageResponse[]
}
function ProductList({ onChange, defaultValue }: ProductListProps) {
  const { data, isLoading, request } = useApi<productResponse[]>()
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  useEffect(() => { request(productService.get()) }, [request])
  useEffect(() => {
    if (data && defaultValue) {
      const initial: Record<number, number> = {}
      defaultValue.forEach(pkg => {
        initial[pkg.product.id] = pkg.quantity
      })
      setQuantities(initial)
      onChange(initial)
    }
  }, [data, defaultValue, onChange])

  const handleQuantityChange = (id: number, val: string) => {
    const num = Math.max(0, parseInt(val) || 0)
    const newQuantities = { ...quantities, [id]: num }
    setQuantities(newQuantities)
    onChange(newQuantities)
  }

  return !isLoading && (
    <>
      {(data ?? []).map((p) => (
        <div key={p.id}>
          <span>{p.name}</span>
          <TextField
            name={`prod-${p.id}`}
            type="number"
            placeholder="0"
            defaultValue={defaultValue?.find(pkg => pkg.product.id == p.id)?.quantity.toString()}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleQuantityChange(p.id, e.currentTarget.value)
            }
          />
        </div>
      ))}
    </>
  )
}

type DeleteDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  delivery: deliveryResponse | null
  setDelivery: (delivery: deliveryResponse | null) => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  delivery,
  setDelivery
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()

  const requestDelete = () => {
    if (!delivery) return
    request(deliveryService.del(delivery.id))
      .then(() => {
        setDelivery(null)
        setIsOpen(false)
      })
      .catch((error) => {
        console.error(error)
        alert("Error al eliminar el reparto")
      })
  }

  return (
    <Dialog
      title="Eliminar reparto"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar el reparto con ID "{delivery?.id}"?
    </Dialog>
  )
}

type UpdaterEventsProps<T> = {
  e: eventData
  setData: Dispatch<SetStateAction<T | null>>
}
const factoryStoreEvents = ({ e, setData }: UpdaterEventsProps<deliveryResponse[]>) => {
  const data = e.data as storeResponse | factoryResponse
  const model = e.model as "store" | "factory"
    
  switch (e.action) {
    case "updated":
      return setData((prev) => {
        if (!prev) return prev
        return prev.map(x => (
          x[model].id == data.id
            ? { ...x, [model]: data }
            : x
        ))
      })

    case "deleted":
      return setData((prev) => {
        if (!prev) return prev
        return prev.filter(x => x[model].id != data.id)
      })
  }
}
const establishmentEvents = ({ e, setData }: UpdaterEventsProps<deliveryResponse[]>) => {
  const data = e.data as establishmentResponse
  switch (e.action) {
    case "updated":
      return setData((prev) => {
        if (!prev) return prev
        return prev.map(d => {
          const storeMatch = d.store.establishment.id == data.id
          const factoryMatch = d.factory.establishment.id == data.id

          if (!storeMatch && !factoryMatch) return d

          return {
            ...d,
            store: storeMatch ? { ...d.store, establishment: data } : d.store,
            factory: factoryMatch ? { ...d.factory, establishment: data } : d.factory,
          }
        })
      })

    case "deleted":
      return setData((prev) => {
        if (!prev) return prev
        return prev.filter(d => (
          d.store.establishment.id != data.id
          && d.factory.establishment.id != data.id
        ))
      })
  }
}
