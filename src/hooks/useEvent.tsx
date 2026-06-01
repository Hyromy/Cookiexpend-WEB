import { useCallback, useEffect, type SetStateAction } from "react"
import { API_URL } from "../constants/config"
import type { eventAction, eventData, eventModel } from "../types/events"
import type { eventResponse, itemResponse } from "../types/api"

type updatable = itemResponse & eventResponse

/**
 * Custom React hook for subscribing to server-sent events (SSE) with optional filtering by event model and action. The hook establishes an EventSource connection to the specified API endpoint and listens for incoming events. It provides a callback function that is invoked whenever a relevant event is received, allowing components to react to real-time updates from the server.
 * 
 * @param from Optional array of event models to filter incoming events. If provided, only events with a model included in this array will trigger the callback.
 * @param on Optional array of event actions to filter incoming events. If provided, only events with an action included in this array will trigger the callback.
 * @param cb A callback function that is called with the event data whenever a relevant event is received. The event data is expected to conform to the `eventData` type, which includes information about the event model, action, and associated data.
 * 
 * @example
 * useEvent({
 *   from: ["product"],
 *   on: ["created", "deleted"],
 *   cb: (e) => {
 *     console.log("Received event", e)
 *   }
 * })
 */
export default function useEvent({ from, on, cb }: {
  from?: eventModel[]
  on?: eventAction[]
  cb: (data: eventData) => void
}) {
  useEffect(() => {
    const eventSource = new EventSource(API_URL + "api/events/", {
      withCredentials: true,
    })

    eventSource.onmessage = (event) => {
      try {
        const data: eventData = JSON.parse(event.data)

        if (
          (data.status == "connected")
          || (from && !from.includes(data.model))
          || (on && !on.includes(data.action))
        ) {
          return
        }
        
        cb(data)
      } catch (err) {
        console.error("Error parsing event data:", err)
      }
    }

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [cb, from, on])
}

/**
 * Custom React hook for handling Create, Update, and Delete (CUD) events with a state setter function.
 * Designed to be used in conjunction with the useEvent hook, this helper function provides a convenient way to update component state based on incoming events that indicate when items have been created, updated, or deleted.
 * 
 * @param setter State setter function returned by useState for the relevant data array. This function will be used to update the state based on incoming events.
 * 
 * @example
 * const [products, setProducts] = useState<productResponse[] | null>(null)
 * 
 * // This will subscribe to product events and automatically update the products state array based on created, updated, and deleted events
 * useEvent({
 *   from: ["product"],
 *   cb: useEventOnCUD(setProducts)
 * })
 */
export function useEventOnCUD<T extends updatable>(
  setter: (data: SetStateAction<T[] | null>) => void,
){
  return useCallback((e: eventData) => {
    const data = e.data as T
    switch (e.action) {
      case "created": return onAdd(setter, data)
      case "updated": return onUpdate(setter, data)
      case "deleted": return onDelete(setter, data)
    }
  }, [setter])
}

/**
 * Helper function to handle adding a new item to the state
 * 
 * @param setter The state setter function returned by useState for the relevant data array
 * @param item The new item to be added, which should conform to the updatable type (including id and version properties)
 * 
 * @example
 * const [products, setProducts] = useState<productResponse[] | null>(null)
 * 
 * const newProduct = { id: 123, version: 1, name: "New Product", ... }
 * onAdd(setProducts, newProduct) // This will add newProduct to the products state array if it doesn't already exist based on id
 */
export const onAdd = <T extends updatable>(
  setter: (data: SetStateAction<T[] | null>) => void,
  item: T
) => {
  setter((prev) => {
    if (!prev) return [item]
    if (prev.some((p) => p.id == item.id)) return prev
    return [...prev, item]
  })
}

/**
 * Helper function to handle updating an existing item in the state based on id and version
 * 
 * @param setter The state setter function returned by useState for the relevant data array
 * @param item The updated item, which should conform to the updatable type (including id and version properties)
 * 
 * @example
 * const [products, setProducts] = useState<productResponse[] | null>(null)
 * 
 * const updatedProduct = { id: 123, version: 2, name: "Updated Product", ... }
 * onUpdate(setProducts, updatedProduct) // This will update the existing product in the products state array with id 123 if the version is newer than the current one
 */
export const onUpdate = <T extends updatable>(
  setter: (data: SetStateAction<T[] | null>) => void,
  item: T
) => {
  setter((prev) => {
    if (!prev) return prev

    const current = prev.find((p) => p.id == item.id)
    if (current && current.version >= item.version) return prev

    return prev.map((p) =>
      p.id == item.id
        ? { ...p, ...item }
        : p
    )
  })
}

/**
 * Helper function to handle deleting an item from the state based on id
 * 
 * @param setter The state setter function returned by useState for the relevant data array
 * @param item The item to be deleted, which should conform to the updatable type (including id property)
 * 
 * @example
 * const [products, setProducts] = useState<productResponse[] | null>(null)
 * 
 * const productToDelete = { id: 123, version: 1, name: "Product to Delete", ... }
 * onDelete(setProducts, productToDelete) // This will remove the product with id 123 from the products state array
 */
export const onDelete = <T extends updatable>(
  setter: (data: SetStateAction<T[] | null>) => void,
  item: T
) => {
  setter((prev) => {
    if (!prev) return prev
    return prev.filter((p) => p.id != item.id)
  })
}
