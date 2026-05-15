import { useCallback, useEffect } from "react"
import useApi from "../../hooks/useApi"
import type { productResponse } from "../../types/api"
import { productService } from "../../services/cookiexpend"
import useEvent, { onAdd, onDelete, onUpdate } from "../../hooks/useEvent"
import { StateGate } from "../../components/State"

export default function Products() {
  const { data, error, isLoading, request, setData } = useApi<productResponse[]>()
  
  const requestData = useCallback(() => request(productService.get()), [request])

  useEffect(() => { requestData() }, [requestData])

  useEffect(() => {
    if (error) {
      console.log("Failed to fetch products: " + error.message)
    }
  }, [error])

  useEvent({ from: ["product"], cb: useCallback((e) => {
    const data = e.data as productResponse
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
      errorProps={{ onRetry: requestData }}
    >
      <pre>
        {JSON.stringify(data, null, 4)}
      </pre>
    </StateGate>
  )
}
