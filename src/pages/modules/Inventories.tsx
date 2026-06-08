import { useCallback, useEffect } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { inventoryService } from "../../services/cookiexpend"
import type { inventoryResponse, productResponse, storeResponse } from "../../types/api"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { Table } from "../../components/Table"
import type { eventModel } from "../../types/events"

const INVENTORY_EVENTS = ["inventory"] as eventModel[]

export default function Inventories() {
  const { data, error, isLoading, request, setData } = useApi<inventoryResponse[]>()
  const requestData = useCallback(() => request(inventoryService.get()), [request])

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: INVENTORY_EVENTS,
    cb: useEventOnCUD<inventoryResponse>(setData)
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
        headers={["Expendio", "Productos"]}
        data={parseData(data!)}
        row={x => [
          x.store.establishment.name,
          x.products.map(p => `${p.product.name} (${p.quantity})`).join(", ")
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
