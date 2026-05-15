import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"

export default function Sales() {
  const { data, error, isLoading } = useApi()

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Ventas" }}
    >
      {null}
    </StateGate>
  )
}