import { type ChangeEvent, type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import type { deliveryRequest, deliveryResponse, establishmentResponse, factoryResponse, packageResponse, productResponse, storeResponse } from "../../types/api"
import { deliveryService, factoryService, productService, storeService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { Form, SelectField, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import { Table } from "../../components/Table"
import { Pencil, Trash, Check, CircleSlash } from "lucide-react"
import type { eventAction, eventData, eventModel } from "../../types/events"
import { Dialog, Modal } from "../../components/Modal"

const DELIVERY_EVENTS = ["delivery"] as eventModel[]
const STORE_FACTORY_EVENTS = ["store", "factory"] as eventModel[]
const ESTABLISHMENT_EVENTS = ["establishment"] as eventModel[]
const ON_EDITABLE_EVENTS = ["updated", "deleted"] as eventAction[]

export default function Deliveries() {
  const { data, error, isLoading, request, setData } = useApi<deliveryResponse[]>()
  const requestData = useCallback(() => request(deliveryService.get()), [request])
  const [operation, setOperation] = useState<"create" | "edit" | "delete" | "status" | null>(null)
  const [currentDelivery, setCurrentDelivery] = useState<deliveryResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusStep, setStatusStep] = useState<1 | -1>(1)

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
    setCurrentDelivery(null)
    setOperation("create")
    setIsModalOpen(true)
  }
  const openEdit = (delivery: deliveryResponse) => {
    setCurrentDelivery(delivery)
    setOperation("edit")
    setIsModalOpen(true)
  }
  const openDelete = (delivery: deliveryResponse) => {
    setCurrentDelivery(delivery)
    setOperation("delete")
    setIsDialogOpen(true)
  }
  const openStatus = (delivery: deliveryResponse) => {
    setCurrentDelivery(delivery)
    setOperation("status")
    setIsDialogOpen(true)
  }
  const clear = () => {
    setCurrentDelivery(null)
    setOperation(null)
    setIsModalOpen(false)
    setIsDialogOpen(false)
  }
  const renderActionButtons = (delivery: deliveryResponse) => {
    const upd = <Button onClick={() => openEdit(delivery)}><Pencil /></Button>
    const status = (
      <Button
        onClick={() => {
          setStatusStep(1)
          openStatus(delivery)
        }}
      >
        <Check />
      </Button>
    )
    const allButtons = (
      <>
        {upd}
        <Button onClick={() => openDelete(delivery)}><Trash /></Button>
        {status}
      </>
    )

    switch(delivery.status.name) {
      case "pending":
        return allButtons

      case "in_progress":
        return (
          <>
            <Button
            onClick={() => {
              setStatusStep(-1)
              openStatus(delivery)
            }}
            >
              <CircleSlash />
            </Button>
            {status}
          </>
        )

      case "completed":
        return null

      case "cancelled":
        return allButtons

      default:
        return null
    }
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
          headers={["ID", "Planta", "Expendio", "Estado", "Productos", "Acciones"]}
          data={data!}
          row={x => [
            x.id,
            x.factory.establishment.name,
            x.store.establishment.name,
            x.status.name,
            x.package.map(p => `${p.product.name} (x${p.quantity})`).join(", "),
            renderActionButtons(x)
          ]}
        />
      </StateGate>
      <Modal
        isOpen={isModalOpen}
        onClose={clear}
        title={(currentDelivery ? "Editar" : "Agregar") + " reparto"}
      >
        <DeliveryForm
          delivery={currentDelivery}
          onDone={clear}
        />
      </Modal>
      <ThisDialog
        isOpen={isDialogOpen}
        delivery={currentDelivery}
        operation={operation as "delete" | "status"}
        onDone={clear}
        statusStep={statusStep}
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
  }, [delivery, setData])

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
        key={delivery?.id ?? "new"}
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
  const initialQuantities = useMemo(() => {
    const initial: Record<number, number> = {}
    defaultValue?.forEach(pkg => {
      initial[pkg.product.id] = pkg.quantity
    })
    return initial
  }, [defaultValue])
  const [quantities, setQuantities] = useState<Record<number, number>>(initialQuantities)

  useEffect(() => { request(productService.get()) }, [request])
  useEffect(() => { if (data) onChange(initialQuantities) }, [data, initialQuantities, onChange])

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

type ThisDialogProps = {
  isOpen: boolean
  delivery: deliveryResponse | null
  operation: "delete" | "status"
  statusStep: 1 | -1
  onDone: () => void
}
function ThisDialog({
  isOpen,
  delivery,
  operation,
  statusStep,
  onDone
}: ThisDialogProps) {
  const { isLoading, request } = useApi<void | deliveryResponse>()

  const errorHandler = (error: Error, msg: string) => {
    console.error(error)
    alert(msg)
  }

  const requestDelete = () => {
    request(deliveryService.del(delivery!.id))
      .then(onDone)
      .catch((error) => errorHandler(error, "Error al eliminar el reparto"))
  }
  const requestStatusChange = () => {
    request(deliveryService.changeStatus(delivery!.id, statusStep))
      .then(() => {
        alert("Estado del reparto cambiado con exito!")
        onDone()
      })
      .catch((error) => errorHandler(error, "Error al cambiar el estado del reparto"))
  }

  const isDelete = operation == "delete"

  return (
    <Dialog
      title={(isDelete ? "Eliminar" : "Cambiar estado del ") + " reparto"}
      isOpen={isOpen}
      onClose={onDone}
      loading={isLoading}
      blockMissClick
      onConfirm={() => {
        if (!delivery) {
          return alert("Error: No se encontró el reparto")
        }
        if (isDelete) requestDelete()
        else requestStatusChange()
      }}
    >
      ¿Estás seguro que quieres {isDelete ? "eliminar" : "cambiar el estado de"} el reparto con ID "{delivery?.id}"?
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
