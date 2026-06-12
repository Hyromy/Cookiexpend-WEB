import { useCallback, useEffect } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { userService } from "../../services/cookiexpend"
import { Table } from "../../components/Table"
import { Button } from "../../components/Button"
import { Pencil, Trash } from "lucide-react"
import type { userInfoResponse } from "../../types/api"

export default function Users() {
  const { data, error, isLoading, request } = useApi<userInfoResponse[]>()

  const requestData = useCallback(() => request(userService.get()), [request])

  useEffect(() => { requestData() }, [requestData])

  const onEditHandler = (user: userInfoResponse) => {
    alert("{pendiente} Editar usuario: " + user.username)
  }
  const onDeleteHandler = (user: userInfoResponse) => {
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
        data={data!}
        exportToExcel
        filename="Usuarios"
        columns={[
          { accessorKey: "id", header: "ID" },
          { accessorKey: "username", header: "Usuario" },
          { accessorKey: "email", header: "Correo" },
          { accessorKey: "first_name", header: "Nombre" },
          { accessorKey: "last_name", header: "Apellido" },
          {
            id: "actions",
            header: "Acciones",
            cell: ({ row }) => (
              <>
                <Button onClick={() => onEditHandler(row.original)}><Pencil /></Button>
                <Button onClick={() => onDeleteHandler(row.original)}><Trash /></Button>
              </>
            )
          }
        ]}
      />
    </StateGate>
  )
}
