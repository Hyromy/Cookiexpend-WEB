import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { Table } from "../../components/Table"
import { Form } from "../../components/Form"
import { ActionButton, Button } from "../../components/Button"
import { inventoryService, saleService } from "../../services/cookiexpend"
import type { inventoryResponse, saleRequest, saleResponse } from "../../types/api"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import type { eventModel } from "../../types/events"
import { Modal } from "../../components/Modal"
import useAuth from "../../hooks/useAuth"
import { Minus, Plus, Image } from "lucide-react"
import { parseDate, parseInventory, type parsedInventory } from "../../utils/parser"
import { API_URL } from "../../constants/config"
import { Ticket } from "../../components/Ticket"
import { useReactToPrint } from "react-to-print"
import Dropdown from "../../components/Dropdown"

const SALE_EVENTS = ["sell"] as eventModel[]

export default function Sales() {
  const { user } = useAuth()
  const { data, error, isLoading, request, setData } = useApi<saleResponse[]>()
  const requestData = useCallback(() => request(saleService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const ticketRef = useRef<HTMLDivElement | null>(null)
  const [selectedSale, setSelectedSale] = useState<saleResponse | null>(null)

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: SALE_EVENTS,
    cb: useEventOnCUD<saleResponse>(setData)
  })

  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: "Ticket",
  })

  const prepareAndPrint = (sale: saleResponse) => {
    setSelectedSale(sale)
    setTimeout(() => {
      handlePrint?.()
    }, 100)
  }

  const btnSale = (
    <Button
      onClick={() => { setIsModalOpen(true) }}
      className="px-6"
    >
      Registrar Nueva Venta
    </Button>
  )
  const showBtnSale = useMemo(() => {
    if (user?.role == "Store manager") return btnSale
  }, [user?.role, btnSale])

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Ventas", content: showBtnSale }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {showBtnSale}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Ventas"
          columns={[
            { accessorKey: "id", header: "ID" },
            ...((user?.role == "Factory manager")
              ? [{ accessorKey: "store.establishment.name", header: "Expendio" }]
              : []
            ),
            {
              accessorKey: "details",
              header: "Productos vendidos",
              cell: ({ getValue }) => {
                const totalProducts = (getValue() as saleResponse["details"]).flatMap(p => Array(p.quantity).fill(p)).length
    
                return (
                  <>
                    <span className="hidden">
                      {totalProducts}
                    </span>
                    <Dropdown
                      options={(getValue() as saleResponse["details"]).map(p => (
                        <span
                          key={p.product.id}
                          className="block px-4 py-2 text-sm text-fg"
                        >
                          {p.product.name} (x{p.quantity}), ${p.price}
                        </span>
                      ))}
                    >
                      {totalProducts}
                    </Dropdown>
                  </>
                )
              }
            },
            { 
              accessorKey: "date",
              header: "Fecha",
              cell: ({ getValue }) => parseDate(getValue() as string)
            },
            {
              accessorKey: "total",
              header: "Total",
              cell: ({ getValue }) => `$${getValue()}`
            },
            {
              id: "actions",
              header: "Acciones",
              cell: ({ row }) => (
                <ActionButton
                  variant="info"
                  icon="ticket"
                  cb={() => prepareAndPrint(row.original)}
                />
              )
            }
          ]}
        />
      <div className="hidden">
        {selectedSale && <ThisTicket ref={ticketRef} sale={selectedSale} />}
      </div>
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

type ThisTicketProps = {
  ref: React.Ref<HTMLDivElement>
  sale: saleResponse
}
function ThisTicket({ ref, sale }: ThisTicketProps) {
  const totalProductsQty = sale.details?.reduce((acc, detail) => acc + detail.quantity, 0) || 0

  const header = (
    <>
      <h2 className="text-sm font-bold tracking-wider uppercase">
        {sale.store.establishment.name}
      </h2>
      <p className="text-[10px] leading-tight text-gray-600">
        {sale.store.establishment.street} {sale.store.establishment?.number ? `#${sale.store.establishment.number}` : ''}<br />
        Col. {sale.store.establishment.neighborhood}
      </p>
    </>
  )
  const identifiers = (
    <>
      <div><span className="font-bold">No. Ticket:</span> #{sale.id}</div>
      <div><span className="font-bold">Fecha:</span> {parseDate(sale.date)}</div>
      <div><span className="font-bold">Cajero:</span> {"{User}"}</div>
    </>
  )
  const body = (
    <table className="w-full text-left table-fixed">
      <thead>
        <tr className="border-b border-black font-bold">
          <th className="pb-1 w-1/2">Prod</th>
          <th className="pb-1 text-center w-1/6">Cant</th>
          <th className="pb-1 text-right w-1/3">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-dashed divide-gray-200">
        {sale.details?.map((detail) => (
          <tr key={detail.id} className="align-top">
            <td className="py-1 pr-1 truncate">{detail.product?.name}</td>
            <td className="py-1 text-center font-bold">{detail.quantity}</td>
            <td className="py-1 text-right">${(Number(detail.price) * detail.quantity).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
  const summary = (
    <>
      <div className="flex justify-between text-[10px] text-gray-700">
        <span>Cant. Total Productos:</span>
        <span className="font-bold">{totalProductsQty}</span>
      </div>
      <div className="flex justify-between font-bold text-xs pt-1 border-t-2 border-double border-black">
        <span>TOTAL:</span>
        <span>${sale.total}</span>
      </div>
      <div className="pt-1 text-[10px] space-y-0.5 border-t border-dashed border-gray-300">
        <div className="flex justify-between">
          <span>Recibido:</span>
          <span>${sale.total}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Cambio:</span>
          <span>${0}</span>
        </div>
      </div>
    </>
  )
  const footer = (
    <>
      <p className="font-bold tracking-wide">¡GRACIAS POR SU COMPRA!</p>
      <p className="text-[8px] text-gray-500">Para aclaraciones presente este comprobante.</p>
    </>
  )

  return (
    <Ticket
      ref={ref}
      header={header}
      identifiers={identifiers}
      body={body}
      summary={summary}
      footer={footer}
    />
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
  const { data, request } = useApi<inventoryResponse[]>()
  const { isLoading: pushLoading, request: pushRequest } = useApi<saleResponse>()

  useEffect(() => { request(inventoryService.get()) }, [request])

  const clearForm = () => setQuantities({})

  const handleQuantityChange = (productId: number, quantity: string) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: parseInt(quantity) || 0
    }))
  }

  const inventoryItems = useMemo(() => {
    const parsed = parseInventory(data ?? [])
    return parsed[0]?.products ?? []
  }, [data])
  const total = useMemo(() => {
    return inventoryItems.reduce((acc, item) => {
      const qty = quantities[item.product.id] || 0
      return acc + (qty * parseFloat(item.product.price))
    }, 0)
  }, [inventoryItems, quantities])

  const onSubmitHandler = async (data: rawSaleData) => {
    const parsedData = parseData(data)
    const validation = validateData(parsedData)
    if (validation != true) {
      alert(validation)
      return
    }

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
      <ProductChooser
        inventoryItems={inventoryItems}
        onQuantityChange={handleQuantityChange}
        quantities={quantities}
      />
      <hr className="border-muted" />
      <PriceDisplay total={total} />
      <div className="flex flex-row gap-4">
        <Button
          type="reset"
          variant="secondary"
          onClick={clearForm}
          disabled={pushLoading}
          className="px-6"
        >
          Restablecer
        </Button>
        <Button
          type="submit"
          disabled={pushLoading}
          className="px-6"
        >
          Vender
        </Button>
      </div>
    </Form>
  )
}

type ProductCardProps = {
  item: parsedInventory["products"][number]
  currentQuantity?: number
  onQuantityChange: (id: number, val: string) => void
  handleStepChange: (id: number, value: number, step: number) => void
}
function ProductCard({
  item,
  currentQuantity = 0,
  onQuantityChange,
  handleStepChange
}: ProductCardProps) {
  const { product, quantity: stock } = item

  const ProductHeader = (
    <div className="flex justify-between">
      <h4 className="font-semibold">{product.name}</h4>
      <span className="text-muted">${product.price}</span>
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
      max={stock}
      value={currentQuantity}
      onChange={(e) => {
        const val = Math.min(stock, parseInt(e.target.value) || 0)
        onQuantityChange(product.id, val.toString())
      }}
      className="w-12 text-center bg-transparent border-none text-sm text-fg font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )

  const IncrementButton = (
    <button
      type="button"
      onClick={() => handleStepChange(product.id, currentQuantity, 1)}
      className="px-3 h-full cursor-pointer"
      disabled={currentQuantity >= stock}
    >
      <Plus className="w-4 h-4" />
    </button>
  )

  const imgClasses = "w-full h-full object-cover"
  return (
    <div className="w-full max-w-64 h-64 flex flex-col justify-between p-3 bg-card border border-muted rounded-xl shadow-xs">
      {ProductHeader}
      <div
        className="w-full h-32 flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={() => currentQuantity < stock && handleStepChange(product.id, currentQuantity, 1)}
      >
        {product.img ? (
          <img 
            src={API_URL + product.img}
            alt={product.name}
            className={imgClasses}
          />
        ) : (
          <Image className={imgClasses} />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-muted">
        <span className="text-xs text-muted">
          {stock} pz
        </span>
        <div className="flex items-center border border-muted rounded-lg overflow-hidden h-9">
          {DecrementButton}
          {QuantityInput}
          {IncrementButton}
        </div>
      </div>
    </div>
  )
}

function ProductChooser({
  inventoryItems,
  onQuantityChange,
  quantities
}: {
  inventoryItems: parsedInventory["products"] // [{ product, quantity }]
  onQuantityChange: (id: number, val: string) => void
  quantities: Record<number, number>
}) {
  const handleStepChange = (id: number, value: number, step: number) => {
    const item = inventoryItems.find(i => i.product.id === id)
    const maxStock = item ? item.quantity : Infinity
    
    const newValue = Math.min(maxStock, Math.max(0, value + step))
    onQuantityChange(id, newValue.toString())
  }

  return (
    <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex flex-wrap gap-2 justify-center">
        {inventoryItems?.filter(i => i.quantity)?.map((item) => (
          <ProductCard
            key={item.product.id}
            item={item}
            currentQuantity={quantities[item.product.id] || 0}
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
  return { products: Object.keys(data)
    .filter(key => key.startsWith("product-"))
    .map(key => ({
      product: key.replace("product-", ""),
      quantity: parseInt(data[key as `product-${number}`])
    }))
    .filter(p => p.quantity > 0)
  }
}

const validateData = (data: saleRequest): string | true => {
  if (data.products.length <= 0) {
    return "Por favor, ingresa al menos una cantidad para vender"
  }

  return true
}
