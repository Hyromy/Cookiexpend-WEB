import { useState } from "react"
import useToast from "./useToast"

type Orderable = {
  id: number
  order: number
}

export default function useOrderable<T extends Orderable>(
  items: T[] | null | undefined,
  setItems: (items: T[]) => void,
  updateOrder: (id: number, order: number) => Promise<unknown>,
  onError: () => void
) {
  const { addToast } = useToast()
  const [isPending, setIsPending] = useState(false)

  const sorted = () => [...(items ?? [])].sort((a, b) => a.order - b.order)

  const applyAndPersist = (reordered: T[]) => {
    const updates = reordered
      .map((item, newOrder) => ({ id: item.id, newOrder, changed: item.order != newOrder }))
      .filter(u => u.changed)

    if (!updates.length) return

    const optimistic = reordered.map((item, index) => ({ ...item, order: index }))

    setItems(optimistic)
    setIsPending(true)
    Promise.all(updates.map(u => updateOrder(u.id, u.newOrder)))
      .catch(() => {
        addToast("Error al reordenar, por favor intente más tarde", "error")
        onError()
      })
      .finally(() => setIsPending(false))
  }

  const move = (item: T, direction: -1 | 1) => {
    const list = sorted()
    const index = list.findIndex(i => i.id == item.id)
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= list.length) return

    const reordered = [...list]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    applyAndPersist(reordered)
  }

  const moveToEdge = (item: T, edge: "first" | "last") => {
    const list = sorted()
    const withoutItem = list.filter(i => i.id != item.id)
    const reordered = edge == "first" ? [item, ...withoutItem] : [...withoutItem, item]
    applyAndPersist(reordered)
  }

  const reorder = (reordered: T[]) => applyAndPersist(reordered)

  const isFirst = (item: T) => sorted()[0]?.id == item.id
  const isLast = (item: T) => sorted().at(-1)?.id == item.id
  const rank = (item: T) => sorted().findIndex(i => i.id == item.id) + 1

  return {
    move,
    moveToEdge,
    reorder,
    isFirst,
    isLast,
    rank,
    isBusy: isPending,
    nextOrder: () => (sorted().at(-1)?.order ?? -1) + 1,
  }
}
