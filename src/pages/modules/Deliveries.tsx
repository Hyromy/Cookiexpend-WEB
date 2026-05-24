import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"

export default function Deliveries() {
  const { data, error, isLoading } = useApi()

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Repartos" }}
    >
      {null}
    </StateGate>
  )
}
