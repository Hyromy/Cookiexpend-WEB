import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import type { deliveryRequest, deliveryResponse, establishmentResponse, factoryResponse, productResponse, storeResponse } from "../../types/api"
import { deliveryService, factoryService, productService, storeService } from "../../services/cookiexpend"
import useEvent, { onAdd, onDelete, onUpdate } from "../../hooks/useEvent"
import { Form, SelectField, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import { Table } from "../../components/Table"
import { Pencil, Trash } from "lucide-react"

export default function Deliveries() {
  const { data, error, isLoading, request, setData } = useApi<deliveryResponse[]>()
  
  const requestData = useCallback(() => request(deliveryService.get()), [request])
    
  useEffect(() => { requestData() }, [requestData])

  useEvent({ from: ["delivery"], cb: useCallback((e) => {
    const data = e.data as deliveryResponse
    switch (e.action) {
      case "created": return onAdd(setData, data)
      case "updated": return onUpdate(setData, data)
      case "deleted": return onDelete(setData, data)
    }
  }, [setData])})

  useEvent({ from: ["store", "factory"], on: ["updated", "deleted"], cb: useCallback((e) => {
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
  }, [setData])})

  useEvent({ from: ["establishment"], on: ["updated", "deleted"], cb: useCallback((e) => {
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
  }, [setData])})

  const onEditHandler = (delivery: deliveryResponse) => {
    alert("{pendiente} Editar reparto: " + delivery.id)
  }
  const onDeleteHandler = (delivery: deliveryResponse) => {
    alert("{pendiente} Eliminar reparto: " + delivery.id)
  }

  return (
  <>
    <DeliveryForm />
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Repartos" }}
      errorProps={{ onRetry: requestData }}
    >
      <Table
        headers={["ID", "Planta", "Expendio", "Productos", "Acciones"]}
        data={data!}
        row={x => [
          x.id,
          x.factory.establishment.name,
          x.store.establishment.name,
          x.package.map(p => `${p.product.name} (x${p.quantity})`).join(", "),
          <>
            <Button onClick={() => onEditHandler(x)}><Pencil /></Button>
            <Button onClick={() => onDeleteHandler(x)}><Trash /></Button>
          </>
        ]}
      />
    </StateGate>
  </>
  )
}

function DeliveryForm() {
  const { data, error, isLoading, request } = useApi<deliveryResponse>()

  const [packages, setPackages] = useState<Record<number, number>>({})

  useEffect(() => {
    if (data) {
      alert("Reparto creado con exito!")
    }
    if (error) {
      console.error(error)
      alert("Error al crear el reparto")
    }
  }, [data, error])

  const onSubmitHandler = (data: deliveryRequest) => {
    const activePackages = Object.entries(packages)
      .filter(([, quantity]) => quantity >= 1)
      .map(([id, quantity]) => ({ product: Number(id), quantity }))

    if (!data.factory || !data.store || activePackages.length == 0) {
      alert("Por favor llena todos los campos y agrega al menos un producto")
      return
    }

    data.package = activePackages

    request(deliveryService.new(data))
  }

  return (
    <Form onSubmit={onSubmitHandler}>
      <div>
        <ThisSelect
          getter={() => storeService.get()}
          name="store"
          placeholder="Selecciona un expendio"
        />
        <ThisSelect
          getter={() => factoryService.get()}
          name="factory"
          placeholder="Selecciona una planta"
        />
      </div>
      <ProductList onChange={setPackages} />
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
}
function ThisSelect({
  getter,
  name,
  placeholder
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
      options={
        (data ?? []).map((x) =>
          ({ value: x.id.toString(), label: x.establishment.name })
        )
      }
    />
  )
}

function ProductList({ onChange }: { onChange: (data: Record<number, number>) => void }) {
  const { data, isLoading, request } = useApi<productResponse[]>()
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  useEffect(() => { request(productService.get() as Promise<productResponse[]>) }, [request])

  const handleQuantityChange = (id: number, val: string) => {
    const num = Math.max(0, parseInt(val) || 0)
    const newQuantities = { ...quantities, [id]: num }
    setQuantities(newQuantities)
    onChange(newQuantities)
  }

  if (isLoading) return <p>Cargando productos...</p>

  return (
    <>
      {(data ?? []).map((p) => (
        <div key={p.id}>
          <span>{p.name}</span>
          <TextField
            name={`prod-${p.id}`}
            type="number"
            placeholder="0"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleQuantityChange(p.id, e.currentTarget.value)
            }
          />
        </div>
      ))}
    </>
  )
}
