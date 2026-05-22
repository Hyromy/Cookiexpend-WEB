import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"

const range = (i: number): number[] => {
  const items: number[] = []
  let c = 0
  while (c < i) {
    items[c] = c
    c++
  }
  return items
}

export default function Users() {
  const { data, error, isLoading } = useApi()

  return (
    <StateGate
      data={data || true}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Usuarios" }}
    >
      <div className="flex flex-col">
        {range(30).map((x) => (
          <p key={x} className="m-3">
            {x}
          </p>
        ))}
      </div>
    </StateGate>
  )
}