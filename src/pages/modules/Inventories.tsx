import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { inventoryService } from "../../services/cookiexpend"
import type { inventoryResponse, productResponse, saleResponse, storeResponse } from "../../types/api"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { Table } from "../../components/Table"
import type { eventData, eventModel } from "../../types/events"

const INVENTORY_EVENTS = ["inventory"] as eventModel[]
const SELL_EVENTS = ["sell"] as eventModel[]

export default function Inventories() {
  const { data, error, isLoading, request, setData } = useApi<inventoryResponse[]>()
  const requestData = useCallback(() => request(inventoryService.get()), [request])

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

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Inventario" }}
      errorProps={{ onRetry: requestData }}
    >
      <Table
        data={parseData(data!)}
        exportToExcel
        filename="Inventarios"
        columns={[
          { accessorKey: "store.establishment.name", header: "Expendio" },
          {
            accessorKey: "products",
            header: "Productos",
            cell: ({ getValue }) => (
              (getValue() as parsedData["products"])
                .map(p => `${p.product.name} (x${p.quantity})`)
                .join(", ")
            )
          }
        ]}
      />
    </StateGate>
  )
}

type parsedData = {
  store: storeResponse
  products: Array<{
    product: productResponse
    quantity: number
  }>
}

const parseData = (rawData: inventoryResponse[]): parsedData[] => {
  const data: parsedData[] = []
  
  rawData?.forEach(r => {
    const found = data.find(d => d?.store?.id == r.store.id)

    if (!found) {
      data.push({
        store: r.store,
        products: [{
          product: r.product,
          quantity: r.quantity
        }]
      })
    } else {
      found.products.push({
        product: r.product,
        quantity: r.quantity
      })
    }
  })

  return data
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
