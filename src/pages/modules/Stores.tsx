import { useCallback, useEffect } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import type { establishmentRequest, establishmentResponse, storeResponse } from "../../types/api"
import { storeService } from "../../services/cookiexpend"
import useEvent, { onAdd, onDelete, onUpdate } from "../../hooks/useEvent"
import { Form, TextField } from "../../components/Form"
import { Button } from "../../components/Button"

export default function Stores() {
  const { data, error, isLoading, request, setData } = useApi<storeResponse[]>()
  
  const requestData = useCallback(() => request(storeService.get()), [request])
  
  useEffect(() => { requestData() }, [requestData])

  useEvent({ from: ["store"], cb: useCallback((e) => {
    const data = e.data as storeResponse
    switch (e.action) {
      case "created": return onAdd(setData, data)
      case "updated": return onUpdate(setData, data)
      case "deleted": return onDelete(setData, data)
    }
  }, [setData])})

  useEvent({ from: ["establishment"], on: ["updated", "deleted"], cb: useCallback((e) => {
    const data = e.data as establishmentResponse
    switch (e.action) {
      case "updated":
        return setData((prev) => {
          if (!prev) return prev
          return prev.map(f => (
            f.establishment.id == data.id
              ? { ...f, establishment: data }
              : f
          ))
        })

      case "deleted":
        return setData((prev) => {
          if (!prev) return prev
          return prev.filter(f => f.establishment.id != data.id)
        })
    }
  }, [setData])})

  return (
    <>
      <StoreForm />
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Expendios" }}
        errorProps={{ onRetry: requestData }}
      >
        <pre>
          {JSON.stringify(data, null, 4)}
        </pre>
      </StateGate>
    </>
  )
}

function StoreForm() {
  const { data, error, isLoading, request } = useApi<storeResponse>()

  useEffect(() => {
    if (data) {
      alert("Expendio creado con exito!")
    }
    if (error) {
      console.error(error)
      alert("Error al crear el expendio")
    }
  }, [data, error])

  const onSubmitHandler = (data: establishmentRequest) => {
    if (Object.values(data).some(v => !v)) {
      alert("Por favor llena todos los campos")
      return
    }

    request(storeService.new({ establishment: data }))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <TextField name="municipality" placeholder="Municipio" />
      <TextField name="name" placeholder="Nombre" />
      <TextField name="neighborhood" placeholder="Colonia" />
      <TextField name="street" placeholder="Calle" />
      <TextField name="number" placeholder="Número" />
      <Button type="submit" disabled={isLoading}>
        Crear nuevo expendio
      </Button>
    </Form>
  )
}
