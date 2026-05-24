import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"

export default function Factories() {
  const { data, error, isLoading } = useApi()

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Plantas" }}
    >
      {null}
    </StateGate>
  )
}
