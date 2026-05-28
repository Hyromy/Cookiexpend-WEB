import { useCallback, useEffect } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { userService } from "../../services/cookiexpend"


export default function Users() {
  const { data, error, isLoading, request } = useApi()

  const requestData = useCallback(() => request(userService.get()), [request])

  useEffect(() => { requestData() }, [requestData])

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Usuarios" }}
      errorProps={{ onRetry: requestData }}
    >
      <pre>
        {JSON.stringify(data, null, 4)}
      </pre>
    </StateGate>
  )
}