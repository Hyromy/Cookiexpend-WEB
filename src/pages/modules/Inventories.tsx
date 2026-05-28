import { useCallback, useEffect } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { inventoryService } from "../../services/cookiexpend"
import type { inventoryResponse } from "../../types/api"
import useEvent, { onAdd, onDelete, onUpdate } from "../../hooks/useEvent"

export default function Inventories() {
  const { data, error, isLoading, request, setData } = useApi<inventoryResponse[]>()

  const requestData = useCallback(() => request(inventoryService.get({ store: 1 })), [request])

  useEffect(() => { requestData() }, [requestData])

  useEvent({ from: ["inventory"], cb: useCallback((e) => {
    const data = e.data as inventoryResponse
    switch (e.action) {
      case "created": return onAdd(setData, data)
      case "updated": return onUpdate(setData, data)
      case "deleted": return onDelete(setData, data)
    }
  }, [setData])})

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Inventario" }}
      errorProps={{ onRetry: requestData }}
    >
      <pre>
        {JSON.stringify(data, null, 4)}
      </pre>
    </StateGate>
  )
}
