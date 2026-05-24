import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"

export default function Inventories() {
  const { data, error, isLoading } = useApi()

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Inventario" }}
    >
      {null}
    </StateGate>
  )
}
