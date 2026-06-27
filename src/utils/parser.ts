import type { inventoryResponse, productResponse, storeResponse } from "../types/api"

export type parsedInventory = {
  store: storeResponse
  products: Array<{
    product: productResponse
    quantity: number
  }>
}

/**
 * Parses the raw inventory data into a structured format grouped by store, with each store containing its associated products and their quantities.
 * 
 * @param rawData - An array of inventoryResponse objects representing the raw inventory data.
 */
export const parseInventory = (rawData: inventoryResponse[]): parsedInventory[] => {
  const data: parsedInventory[] = []
  
  rawData?.forEach(r => {
    const found = data.find(d => d?.store?.id == r.store.id)

    if (!found) {
      data.push({
        store: r.store,
        products: [{
          product: r.product,
          quantity: r.quantity
        }]
      })
    } else {
      found.products.push({
        product: r.product,
        quantity: r.quantity
      })
    }
  })

  return data
}
