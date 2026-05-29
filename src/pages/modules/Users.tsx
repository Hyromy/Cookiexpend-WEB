import { useCallback, useEffect } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { userService } from "../../services/cookiexpend"
import { Table } from "../../components/Table"
import { Button } from "../../components/Button"
import { Pencil, Trash } from "lucide-react"

export default function Users() {
  const { data, error, isLoading, request } = useApi<any[]>()

  const requestData = useCallback(() => request(userService.get()), [request])

  useEffect(() => { requestData() }, [requestData])

  const onEditHandler = (user: any) => {
    alert("{pendiente} Editar usuario: " + user.username)
  }
  const onDeleteHandler = (user: any) => {
    alert("{pendiente} Eliminar usuario: " + user.username)
  }

  return (
    <StateGate
      data={data}
      error={error}
      loading={isLoading}
      emptyProps={{ title: "Usuarios" }}
      errorProps={{ onRetry: requestData }}
    >
      <Table
        headers={["ID", "Usuario", "Correo", "Nombre", "Apellido", "Acciones"]}
        data={data!}
        row={x => [
          x.id,
          x.username,
          x.email,
          x.first_name,
          x.last_name,
          <>
            <Button onClick={() => onEditHandler(x)}><Pencil /></Button>
            <Button onClick={() => onDeleteHandler(x)}><Trash /></Button>
          </>
        ]}
      />
    </StateGate>
  )
}