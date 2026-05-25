import { useCallback, useEffect, type SetStateAction } from "react"
import useApi from "../../hooks/useApi"
import type { productRequest, productResponse } from "../../types/api"
import { productService } from "../../services/cookiexpend"
import useEvent, { onAdd, onDelete, onUpdate } from "../../hooks/useEvent"
import { StateGate } from "../../components/State"
import { Form, TextField } from "../../components/Form"
import { Button } from "../../components/Button"

export default function Products() {
  const { data, error, isLoading, request, setData } = useApi<productResponse[]>()
  
  const requestData = useCallback(() => request(productService.get()), [request])

  useEffect(() => { requestData() }, [requestData])

  useEffect(() => {
    if (error) {
      console.log("Failed to fetch products: " + error.message)
    }
  }, [error])

  useEvent({ from: ["product"], cb: useCallback((e) => {
    const data = e.data as productResponse
    switch (e.action) {
      case "created": return onAdd(setData, data)
      case "updated": return onUpdate(setData, data)
      case "deleted": return onDelete(setData, data)
    }
  }, [setData])})

  return (
    <>
      <ProductForm setter={setData} />
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        errorProps={{ onRetry: requestData }}
      >
        <pre>
          {JSON.stringify(data, null, 4)}
        </pre>
      </StateGate>
    </>
  )
}

function ProductForm({ setter }: { setter: (data: SetStateAction<productResponse[] | null>) => void }) {
  const { data, error, isLoading, request } = useApi()

  useEffect(() => {
    if (error) {
      console.log("Failed to create product: " + error.message)
    }

    if (data) {
      onAdd(setter, data as productResponse)
    }
  }, [error, data, setter])

  const onSubmitHandler = (product: productRequest) => {
    if (product.name == "" || parseFloat(product.price) <= 0) {
      alert("Por favor, ingrese un nombre y un precio válidos.")
      return
    }

    request(productService.new(product))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <TextField name="name" placeholder="nombre" />
      <TextField name="price" placeholder="precio" />
      <Button type="submit" disabled={isLoading}>
        Enviar
      </Button>
    </Form>
  )
}
