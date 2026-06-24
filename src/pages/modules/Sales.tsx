import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { Table } from "../../components/Table"
import { Form, SelectField } from "../../components/Form"
import { Button } from "../../components/Button"
import { productService, saleService, storeService } from "../../services/cookiexpend"
import type { productResponse, saleRequest, saleResponse, storeResponse } from "../../types/api"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import type { eventModel } from "../../types/events"
import { Modal } from "../../components/Modal"
import useAuth from "../../hooks/useAuth"
import NotFound from "../public/NotFound"
import { Minus, Plus, Image } from "lucide-react"

const SALE_EVENTS = ["sell"] as eventModel[]

export default function Sales() {
  const { user } = useAuth()
  switch (user?.role) {
    case "Factory manager":
      return <SalesForFactoryManager />

    case "Store manager":
      return <SalesForStoreManager />

    default:
      console.warn("Unknown role: ", user?.role)
      return <NotFound />
  }
}

function SalesForFactoryManager() {
  const { data, error, isLoading, request, setData } = useApi<saleResponse[]>()
  const requestData = useCallback(() => request(saleService.get()), [request])

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: SALE_EVENTS,
    cb: useEventOnCUD<saleResponse>(setData)
  })

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Ventas" }}
        errorProps={{ onRetry: requestData }}
      >
        <Table
          data={data!}
          exportToExcel
          filename="Ventas"
          columns={[
            { accessorKey: "id", header: "ID" },
            { accessorKey: "store.establishment.name", header: "Expendio" },
            { 
              accessorKey: "details",
              header: "Detalles",
              cell: ({ getValue }) => (
                (getValue() as saleResponse["details"])
                  .map(d => `${d.product.name} $${d.price} x${d.quantity}`)
                  .join(", ")
              )
            },
            { accessorKey: "date", header: "Fecha" },
            {
              accessorKey: "total",
              header: "Total",
              cell: ({ getValue }) => `$${getValue()}`
            }
          ]}
        />
      </StateGate>
    </>
  )
}

function SalesForStoreManager() {
  const { data, error, isLoading, request, setData } = useApi<saleResponse[]>()
  const requestData = useCallback(() => request(saleService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: SALE_EVENTS,
    cb: useEventOnCUD<saleResponse>(setData)
  })

  const btnSale = <Button onClick={() => { setIsModalOpen(true) }}>Registrar Nueva Venta</Button>

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
          data={data!}
          exportToExcel
          filename="Ventas"
          columns={[
            { accessorKey: "id", header: "ID" },
            { accessorKey: "store.establishment.name", header: "Expendio" },
            { 
              accessorKey: "details",
              header: "Detalles",
              cell: ({ getValue }) => (
                (getValue() as saleResponse["details"])
                  .map(d => `${d.product.name} $${d.price} x${d.quantity}`)
                  .join(", ")
              )
            },
            { accessorKey: "date", header: "Fecha" },
            {
              accessorKey: "total",
              header: "Total",
              cell: ({ getValue }) => `$${getValue()}`
            }
          ]}
        />
      </StateGate>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        blockMissClick
        title="Registrar nueva venta"
        size="xxl"
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
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-2">
      <StoreSelector />
      <ProductChooser
        products={data!}
        onQuantityChange={handleQuantityChange}
        quantities={quantities}
      />
      <hr className="border-muted" />
      <PriceDisplay total={total} />
      <div className="flex flex-row">
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
      </div>
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

type ProductCardProps = {
  product: productResponse,
  currentQuantity?: number,
  onQuantityChange: (id: number, val: string) => void,
  handleStepChange: (id: number, value: number, step: number) => void
}
function ProductCard({
  product,
  currentQuantity = 0,
  onQuantityChange,
  handleStepChange
}: ProductCardProps) {
  const ProductHeader = (
    <div className="flex justify-between">
      <h4 className="font-semibold">
        {product.name}
      </h4>
      <span className="text-muted">
        ${product.price}
      </span>
    </div>
  )
  const DecrementButton = (
    <button
      type="button"
      onClick={() => handleStepChange(product.id, currentQuantity, -1)}
      className="px-3 h-full cursor-pointer"
      disabled={currentQuantity <= 0}
    >
      <Minus className="w-4 h-4" />
    </button>
  )
  const QuantityInput = (
    <input
      type="number"
      name={`product-${product.id}`}
      placeholder="0"
      min="0"
      value={currentQuantity}
      onChange={(e) => onQuantityChange(product.id, e.target.value)}
      className="w-12 text-center bg-transparent border-none text-sm text-fg font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
  const IncrementButton = (
    <button
      type="button"
      onClick={() => handleStepChange(product.id, currentQuantity, 1)}
      className="px-3 h-full cursor-pointer"
    >
      <Plus className="w-4 h-4" />
    </button>
  )

  return (
    <div
      className="w-full max-w-64 h-64 flex flex-col justify-between p-3 bg-card border border-muted rounded-xl shadow-xs"
    >
      {ProductHeader}
      <div
        className="w-full h-32flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => handleStepChange(product.id, currentQuantity, 1)}
      >
        <Image className="w-full h-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-muted">
        <span className="text-xs text-muted">
          {"{stock}"}
        </span>
        <div className="flex items-center border border-muted rounded-lg  overflow-hidden h-9">
          {DecrementButton}
          {QuantityInput}
          {IncrementButton}
        </div>
      </div>
    </div>
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
  const handleStepChange = (id: number, value: number, step: number) => {
    const newValue = Math.max(0, value + step)
    onQuantityChange(id, newValue.toString())
  }

  return (
    <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex flex-wrap gap-2 justify-center">
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currentQuantity={quantities[product.id] || 0}
            onQuantityChange={onQuantityChange}
            handleStepChange={handleStepChange}
          />
        ))}
      </div>
    </div>
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
