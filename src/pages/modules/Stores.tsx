import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"

export default function Stores() {
  const { data, error, isLoading } = useApi()

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Expendios" }}
    >
      {null}
    </StateGate>
  )
}
