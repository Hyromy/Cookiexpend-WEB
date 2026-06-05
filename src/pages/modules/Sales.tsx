import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { Table } from "../../components/Table"
import { Form, SelectField, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import { productService, saleService, storeService } from "../../services/cookiexpend"
import type { productResponse, saleRequest, saleResponse, storeResponse } from "../../types/api"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import type { eventModel } from "../../types/events"
import { Modal } from "../../components/Modal"

const SALE_EVENTS = ["sale"] as eventModel[]

export default function Sales() {
  const { data, error, isLoading, request, setData } = useApi<saleResponse[]>()
  const requestData = useCallback(() => request(saleService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: SALE_EVENTS,
    cb: useEventOnCUD<saleResponse>(setData)
  })

  const openSale = () => {
    setIsModalOpen(true)
  }

  const btnSale = <Button onClick={openSale}>Registrar Nueva Venta</Button>

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Ventas", content: btnSale }}
        errorProps={{ onRetry: requestData }}
      >
        {btnSale}
        <Table
          headers={["ID", "Expendio", "Detalles", "Fecha", "Total"]}
          data={data!}
          row={x => [
            x.id,
            x.store.establishment.name,
            x.details.map(d => `${d.product.name} $${d.price} x${d.quantity}`).join(", "),
            x.date,
            x.total
          ]}
        />
      </StateGate>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        blockMissClick
        title="Registrar nueva venta"
      >
        <SalesForm onDone={() => setIsModalOpen(false)} />
      </Modal>
    </>
  )
}

type rawSaleData = {
  store: string
  [key: `product-${number}`]: string
}

type SalesFormProps = {
  onDone: () => void
}
function SalesForm({
  onDone
}: SalesFormProps) {
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const { data, request } = useApi<productResponse[]>()
  const { isLoading: pushLoading, request: pushRequest } = useApi<saleResponse>()

  useEffect(() => { request(productService.get()) }, [request])

  const clearForm = () => setQuantities({})

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

    pushRequest(saleService.new(parsedData))
    .then(() => {
      alert("Venta registrada exitosamente")
      clearForm()
      onDone()
    })
    .catch((error) => {
      console.error(error)
      alert("Ocurrió un error al registrar la venta. Por favor, intenta de nuevo.")
    })
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
