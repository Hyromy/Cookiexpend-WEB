import { useCallback, useEffect } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import type { establishmentRequest, establishmentResponse, storeResponse } from "../../types/api"
import { storeService } from "../../services/cookiexpend"
import useEvent, { onAdd, onDelete, onUpdate } from "../../hooks/useEvent"
import { Form, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import { Table } from "../../components/Table"
import { Pencil, Trash } from "lucide-react"

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

  const onEditHandler = (store: storeResponse) => {
    alert("{pendiente} Editar expendio: " + store.establishment.name)
  }
  const onDeleteHandler = (store: storeResponse) => {
    alert("{pendiente} Eliminar expendio: " + store.establishment.name)
  }

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
        <Table
          headers={["Nombre", "Municipio", "Colonia", "Calle", "Número", "Acciones"]}
          data={data!}
          row={x => [
            x.establishment.name,
            x.establishment.municipality,
            x.establishment.neighborhood,
            x.establishment.street,
            x.establishment.number,
            <>
              <Button onClick={() => onEditHandler(x)}><Pencil /></Button>
              <Button onClick={() => onDeleteHandler(x)}><Trash /></Button>
            </>
          ]}
        />
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
