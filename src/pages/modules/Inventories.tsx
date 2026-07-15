import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { inventoryService } from "../../services/cookiexpend"
import type { inventoryResponse, saleResponse } from "../../types/api"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { Table } from "../../components/Table"
import type { eventData, eventModel } from "../../types/events"
import useAuth from "../../hooks/useAuth"
import { Image } from "lucide-react"
import { parseInventory, type parsedInventory } from "../../utils/parser"
import { API_URL } from "../../constants/config"
import Dropdown from "../../components/Dropdown"

const INVENTORY_EVENTS = ["inventory"] as eventModel[]
const SELL_EVENTS = ["sell"] as eventModel[]

export default function Inventories() {
  const { data, error, isLoading, request, setData } = useApi<inventoryResponse[]>()
  const requestData = useCallback(() => request(inventoryService.get()), [request])
  const { user } = useAuth()

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: INVENTORY_EVENTS,
    cb: useEventOnCUD<inventoryResponse>(setData)
  })
  useEvent({
    from: SELL_EVENTS,
    on: ["created"],
    cb: useCallback((e) => {sellEvents({ e, setData })}, [setData])
  })

  const parsedData = parseInventory(data || [])
  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Inventario" }}
      errorProps={{ onRetry: requestData }}
    >
      {user?.role == "Factory manager"
      ? (
        <ThisTable data={parsedData} />
      ) : (
        <div className="flex flex-wrap gap-4 justify-center p-4">
          <ThisInventory data={parsedData[0]?.products} />
        </div>
      )}
    </StateGate>
  )
}

function ThisTable({ data }: { data: parsedInventory[] }) {
  return (
    <Table
      data={data}
      exportToExcel={{
        sheetName: "Expendios",
        sheets: [
          {
            sheetName: "Inventario",
            getData: data => {
              const rows: Record<string, unknown>[] = []

              data.forEach(inventory => {
                inventory.products.forEach(product => {
                  rows.push({
                    "Expendio": inventory.store.establishment.name,
                    "Producto": product.product.name,
                    "Cantidad": product.quantity,
                    "SKU": product.product.sku,
                  })
                })
              })

              return rows
            }
          }
        ]
      }}
      filename="Inventarios"
      columns={[
        { accessorKey: "store.establishment.name", header: "Expendio" },
        {
          accessorKey: "products",
          header: "Productos",
          cell: ({ getValue }) => {
            const totalProducts = (getValue() as parsedInventory["products"]).flatMap(p => Array(p.quantity).fill(p)).length

            return (
              <Dropdown
                options={(getValue() as parsedInventory["products"]).map(p => (
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
            )
          },
          meta: {
            setCellToExport: row => row.products.flatMap(p => Array(p.quantity).fill(p)).length
          }
        },
      ]}
    />
  )
}

function ThisInventory({ data }: { data: parsedInventory["products"] }) {
  const imgClasses = "w-full h-full object-cover"

  return data.filter(i => i.quantity > 0).map(i => (
    <div
      key={i.product.id}
      className="border-muted border rounded-lg w-64 hover:scale-105 transition-transform duration-300"
    >
      <div className="flex justify-between p-1 px-2 border-b border-muted">
        <span className="font-bold">{i.product.name}</span>
        <span>x{i.quantity}</span>
      </div>
      <div>
        {i.product.img
          ? (
            <img 
              src={API_URL + i.product.img}
              alt={i.product.name}
              className={imgClasses}
            />
          ) : (
            <Image className={imgClasses} />
          )
        }
      </div>
      <div className="flex justify-end p-1 px-2 border-t border-muted">
        ${i.product.price}
      </div>
    </div>
  ))
}

type UpdaterEventsProps<T> = {
  e: eventData
  setData: Dispatch<SetStateAction<T | null>>
}
const sellEvents = ({ e, setData }: UpdaterEventsProps<inventoryResponse[]>) => {
  const data = e.data as saleResponse
  setData(prev => {
    if (!prev) return prev
    return prev.map(i => {
      if (i.store.id != data.store.id) return i
      const found = data.details.find(d => d.product.id == i.product.id)
      if (found) {
        return {
          ...i,
          quantity: i.quantity - found.quantity
        }
      }
      return i
    })
  })
}
