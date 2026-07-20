import { type ChangeEvent, type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import type { ApiRequestError, deliveryRequest, deliveryResponse, establishmentResponse, factoryResponse, packageResponse, productResponse, statusName, storeResponse } from "../../types/api"
import { deliveryService, productService, storeService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { Form, SelectField, TextField, type SelectFieldProps } from "../../components/Form"
import { ActionButton, Button } from "../../components/Button"
import { Table } from "../../components/Table"
import type { eventAction, eventData, eventModel } from "../../types/events"
import { Dialog, Modal } from "../../components/Modal"
import useAuth from "../../hooks/useAuth"
import Dropdown from "../../components/Dropdown"
import { clsx } from "clsx"
import useToast from "../../hooks/useToast"

const DELIVERY_EVENTS = ["delivery"] as eventModel[]
const STORE_FACTORY_EVENTS = ["store", "factory"] as eventModel[]
const ESTABLISHMENT_EVENTS = ["establishment"] as eventModel[]
const ON_EDITABLE_EVENTS = ["updated", "deleted"] as eventAction[]

const statusText: Record<statusName, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completado",
  cancelled: "Cancelado",
  stopped: "Detenido"
}

export default function Deliveries() {
  const { data, error, isLoading, request, setData } = useApi<deliveryResponse[]>()
  const requestData = useCallback(() => request(deliveryService.get()), [request])
  const [operation, setOperation] = useState<"create" | "edit" | "delete" | "status" | null>(null)
  const [currentDelivery, setCurrentDelivery] = useState<deliveryResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusStep, setStatusStep] = useState<1 | -1>(1)
  const { user } = useAuth()

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
    const upd = <ActionButton variant="warning" icon="pencil" cb={() => openEdit(delivery)} />
    const status = (
      <ActionButton
        variant="success"
        icon="check"
        cb={() => {
          setStatusStep(1)
          openStatus(delivery)
        }}
      />
    )
    const allButtons = (
      <>
        {upd}
        <ActionButton
          variant="danger"
          icon="trash"
          cb={() => openDelete(delivery)}
        />
        {status}
      </>
    )

    switch(delivery.status.name) {
      case "pending":
        return user?.role == "Factory manager" && allButtons

      case "in_progress":
        return user?.role == "Store manager"
        ? status
        : (
          <ActionButton
            variant="danger"
            icon="forbidden"
            cb={() => {
              setStatusStep(-1)
              openStatus(delivery)
            }}
          />
        )

      case "completed":
        return null

      case "cancelled":
        return allButtons

      default:
        return null
    }
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Reparto
    </Button>
  )
  const showBtnAdd = user?.role == "Factory manager" && btnAdd

  const filteredData = useMemo(() => {
    if (!data) return null

    if (user?.role == "Factory manager") return data

    return data.filter(
      d => ([
        "in_progress",
        "completed"
      ] as statusName[]).includes(d.status.name)
    )
  }, [data, user?.role])

  return (
    <>
      <StateGate
        data={filteredData}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Repartos", content: showBtnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {showBtnAdd}
        </div>
        <Table
          data={filteredData!}
          exportToExcel={{
            sheetName: "Repartos",
            sheets: [
              {
                sheetName: "Productos",
                getData: (ordersList) => {
                  const detailRows: Record<string, unknown>[] = []

                  ordersList.forEach((order) => {
                    order.package.forEach((p) => {
                      detailRows.push({
                        "ID Pedido": order.id,
                        "Producto": p.product.name,
                        "Cantidad": p.quantity,
                        "SKU": p.product.sku,
                      })
                    })
                  })
                
                  return detailRows
                }
              }
            ]
          }}
          filename={"Repartos" + ((user?.role == "Store manager") && ` - ${user?.establishment?.name}`)}
          columns={[
            { accessorKey: "id", header: "ID" },
            { accessorKey: "factory.establishment.name", header: "Planta" },
            ...(user?.role == "Factory manager"
              ? [{ accessorKey: "store.establishment.name", header: "Expendio" }]
              : []
            ),
            {
              id: "status",
              header: "Estado",
              cell: ({ row }) => <StatusBadge status={row.original.status.name} />,
              meta: {
                setCellToExport: row => statusText[row.status.name]
              }
            },
            {
              id: "products",
              header: "Productos",
              cell: ({ row }) => {
                const totalProducts = row.original.package.flatMap(p => Array(p.quantity).fill(p)).length

                return (
                  <>
                    <span className="hidden">
                      {totalProducts}
                    </span>
                    <Dropdown
                      options={row.original.package.map(p => (
                        <span
                          key={p.product.id}
                          className="block px-4 py-2 text-sm text-fg"
                        >
                          {p.product.name} (x{p.quantity})
                        </span>
                      ))}
                    >
                      {totalProducts}
                    </Dropdown>
                  </>
                )
              },
              meta: {
                setCellToExport: row => row.package.flatMap(p => Array(p.quantity).fill(p)).length
              }
            },
            {
              id: "actions",
              header: "Acciones",
              cell: ({ row }) => (
                <div className="flex gap-2">
                  {renderActionButtons(row.original)}
                </div>
              )
            }
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
  const { addToast } = useToast()

  useEffect(() => {
    if (delivery) { 
      setData(delivery)
    }
  }, [delivery, setData])

  const onSubmitErrorHandler = (err: ApiRequestError) => {
    const errData: Record<string, string[]> = err.data as Record<string, string[]>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)
    
    if (errData?.factory?.find(thisIncludes("field is required"))) {
      addToast("No se pudo determinar la planta de origen. Por favor, inténtelo más tarde.", "error")
      return
    }
  
    addToast("Error al guardar el reparto, por favor intente más tarde", "error")
  }

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
    const validation = validateSubmit(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (delivery
      ? request(deliveryService.upd(delivery.id, data))
      : request(deliveryService.new(data))
    
    ).then(() => {
      addToast(`Reparto ${delivery ? "actualizado" : "creado"} con éxito`, "success")
      onDone?.()

    }).catch(err => onSubmitErrorHandler(err))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <ThisSelect
        getter={() => storeService.get()}
        name="store"
        placeholder="Selecciona un expendio"
        defaultValue={delivery?.store.id.toString()}
      />
      <div className="grid grid-cols-2 gap-4">
        <ProductList
          key={delivery?.id ?? "new"}
          onChange={setPackages}
          defaultValue={delivery?.package}
        />
      </div>
      <div className="flex justify-center">
        <Button
          className="px-6"
          type="submit"
          disabled={isLoading}
        >
          Crear nuevo reparto
        </Button>
      </div>
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

  const displayData = useMemo(() => {
    const thisData: SelectFieldProps["options"] = [
      { value: "", label: "Seleccione una opción", disabled: true }
    ]
    if (data) {
      thisData.push(...data.map((x) => (
        { value: x.id.toString(), label: x.establishment.name }
      )))
    }
    return thisData
  }, [data])

  return !isLoading && (
    <SelectField
      required
      name={name}
      label={placeholder}
      selected={defaultValue}
      options={displayData}
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
        <div key={p.id} className="">
          <TextField
            name={`prod-${p.id}`}
            cleanRegex={/\D/}
            label={p.name}
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
  const { addToast } = useToast()

  const errorHandler = (error: Error, msg: string) => {
    console.error(error)
    addToast(msg, "error")
  }

  const requestDelete = () => {
    request(deliveryService.del(delivery!.id))
      .then(() => {
        addToast("Reparto eliminado con éxito", "success")
        onDone()
      })
      .catch((error) => errorHandler(error, "Error al eliminar el reparto"))
  }
  const requestStatusChange = () => {
    request(deliveryService.changeStatus(delivery!.id, statusStep))
      .then(() => {
        addToast("Estado del reparto cambiado con éxito!", "success")
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
          addToast("No se encontró el reparto para eliminar", "error")
          return
        }
        if (isDelete) requestDelete()
        else requestStatusChange()
      }}
    >
      ¿Estás seguro que quieres {isDelete ? "eliminar" : "cambiar el estado de"} el reparto con ID "{delivery?.id}"?
    </Dialog>
  )
}

function StatusBadge({ status }: { status: statusName }) {
  const statusClasses = {
    pending: "bg-warning/30",
    in_progress: "bg-info/30",
    completed: "bg-success/30",
    cancelled: "bg-danger/30",
    stopped: "bg-danger/30"
  }

  return (
    <span className={clsx("px-2 py-1 rounded-lg text-sm font-semibold", statusClasses[status])}>
      {statusText[status]}
    </span>
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

const validateSubmit = (data: deliveryRequest): string | true => {
  if (!data.store) return "Por favor selecciona un expendio"
  if (!data.package || data.package.length == 0) return "Por favor agrega al menos un producto"

  return true
}
