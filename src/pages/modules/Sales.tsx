import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { Table } from "../../components/Table"
import { Form, SelectField, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import { productService, saleService, storeService } from "../../services/cookiexpend"
import type { productResponse, saleRequest, saleResponse, storeResponse } from "../../types/api"
import useEvent, { onAdd, onDelete, onUpdate } from "../../hooks/useEvent"

type rawSaleData = {
  store: string
  [key: `product-${number}`]: string
}

export default function Sales() {
  const { data, error, isLoading, request, setData } = useApi<saleResponse[]>()

  const requestData = useCallback(() => request(saleService.get()), [request])

  useEffect(() => { requestData() }, [requestData])

  useEvent({ from: ["sale"], cb: useCallback(e => {
    const data = e.data as saleResponse
    switch (e.action) {
      case "created": return onAdd(setData, data)
      case "updated": return onUpdate(setData, data)
      case "deleted": return onDelete(setData, data)
    }
  }, [setData]) })

  return (
    <>
      <SalesForm />
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Ventas" }}
        errorProps={{ onRetry: requestData }}
      >
        <Table
          headers={["ID", "Expendio", "Detalles", "Fecha", "Total"]}
          data={data!}
          row={x => [
            x.id,
            x.store.establishment.name,
            x.details.map(d => `${d.product.name} x${d.quantity}`).join(", "),
            x.date,
            x.total
          ]}
        />
      </StateGate>
    </>
  )
}

const parseData = (data: rawSaleData): saleRequest => {
  const products = Object.keys(data)
    .filter(key => key.startsWith("product-"))
    .map(key => ({
      product: key.replace("product-", ""),
      quantity: parseInt(data[key as `product-${number}`])
    }))
    .filter(p => p.quantity > 0)

  return {
    store: data.store,
    products
  }
}

const validateData = (data: saleRequest): boolean => {
  if (!data.store) {
    alert("Por favor, selecciona un expendio")
    return false
  }

  if (data.products.length <= 0) {
    alert("Por favor, ingresa al menos una cantidad para vender")
    return false
  }

  return true
}

function SalesForm() {
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const { data, request } = useApi<productResponse[]>()

  const {
    error: pushError,
    isLoading: pushLoading,
    request: pushRequest
  } = useApi<saleResponse>()

  const clearForm = () => {
    setQuantities({})
  }

  useEffect(() => {
    request(productService.get())
  }, [request])

  useEffect(() => {
    if (pushError) {
      console.error("Error al registrar la venta: ", pushError)
      alert("Ocurrió un error al registrar la venta. Por favor, intenta de nuevo.")
    }
  }, [pushError])

  const handleQuantityChange = (productId: number, quantity: string) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: parseInt(quantity) || 0
    }))
  }

  const total = data?.reduce((acc, product) => {
    const qty = quantities[product.id] || 0
    return acc + (qty * parseFloat(product.price))
  }, 0) || 0

  const onSubmitHandler = async (data: rawSaleData) => {
    const parsedData = parseData(data)
    if (!validateData(parsedData)) return

    const response = await pushRequest(saleService.new(parsedData))
    if (response) {
      alert("Venta registrada exitosamente")
      clearForm()
    }
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <StoreSelector />
      <ProductChooser
        products={data!}
        onQuantityChange={handleQuantityChange}
        quantities={quantities}
      />
      <PriceDisplay total={total} />
      <Button
        type="submit"
        disabled={pushLoading}
      >
        Vender
      </Button>
      <Button
        type="reset"
        onClick={clearForm}
        disabled={pushLoading}
      >
        Restablecer
      </Button>
    </Form>
  )
}

function StoreSelector() {
  const { data, error, isLoading, request } = useApi<storeResponse[]>()

  useEffect(() => { request(storeService.get()) }, [request])

  useEffect(() => {
    if (error) {
      console.error("Error al cargar los expendios: ", error)
    }
  }, [error])

  return !isLoading && (
    <SelectField
      name="store"
      options={data?.map((store) => ({
        value: store.id.toString(),
        label: store.establishment.name
      })) || []}
      placeholder="Selecciona un expendio"
    />
  )
}

function ProductChooser({
  products,
  onQuantityChange,
  quantities
}: {
  products?: productResponse[],
  onQuantityChange: (id: number, val: string) => void,
  quantities: Record<number, number>
}) {
  return (
    <>
      {products?.map((product) => (
        <div key={product.id} className="flex items-center gap-2">
          <label className="min-w-32">{product.name}</label>
          <span className="text-gray-500 w-20"> - ${product.price} </span>
          <TextField
            name={`product-${product.id}`}
            placeholder="0"
            type="number"
            value={quantities[product.id] || ""}
            onChange={(e) => onQuantityChange(product.id, e.target.value)}
          />
        </div>
      ))}
    </>
  )
}

function PriceDisplay({ total }: { total: number }) {
  return (
    <div className="text-xl font-bold">
      <span>Total: </span>
      <span>${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
    </div>
  )
}
