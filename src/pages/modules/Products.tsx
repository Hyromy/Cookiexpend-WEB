import { useCallback, useEffect, useState } from "react"
import useApi from "../../hooks/useApi"
import type { productRequest, productResponse } from "../../types/api"
import { productService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { StateGate } from "../../components/State"
import { Form, TextField } from "../../components/Form"
import { Button } from "../../components/Button"
import { Table } from "../../components/Table"
import { Pencil, Trash } from "lucide-react"
import type { eventModel } from "../../types/events"
import { Dialog, Modal } from "../../components/Modal"

const PRODUCT_EVENTS = ["product"] as eventModel[]

export default function Products() {
  const { data, error, isLoading, request, setData } = useApi<productResponse[]>()
  const requestData = useCallback(() => request(productService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<productResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<productResponse | null>(null)

  useEffect(() => { requestData() }, [requestData])
  useEvent({
    from: PRODUCT_EVENTS,
    cb: useEventOnCUD<productResponse>(setData)
  })

  const openCreate = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }
  const openEdit = (product: productResponse) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }
  const openDelete = (product: productResponse) => {
    setDeletingProduct(product)
    setIsDialogOpen(true)
  }

  const btnAdd = <Button onClick={openCreate}>Agregar Producto</Button>

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Productos", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        {btnAdd}
        <Table
          data={data!}
          exportToExcel
          filename="Productos"
          columns={[
            { accessorKey: "id", header: "ID" },
            { accessorKey: "name", header: "Nombre" },
            {
              accessorKey: "price",
              header: "Precio",
              cell: ({ getValue }) => `$${getValue()}`
            },
            {
              id: "actions",
              header: "Acciones",
              cell: ({ row }) => (
                <>
                  <Button onClick={() => openEdit(row.original)}><Pencil /></Button>
                  <Button onClick={() => openDelete(row.original)}><Trash /></Button>
                </> 
              )
            }
          ]}
        />
      </StateGate>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={(editingProduct ? "Editar" : "Agregar") + " producto"}
      >
        <ProductForm
          product={editingProduct}
          onDone={() => {
            setEditingProduct(null)
            setIsModalOpen(false)
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        product={deletingProduct}
        setProduct={setDeletingProduct}
      />
    </>
  )
}

type ProductFormProps = {
  product: productResponse | null,
  onDone?: () => void
}
function ProductForm({ product, onDone }: ProductFormProps) {
  const { isLoading, request, setData } = useApi()

  useEffect(() => { if (product) setData(product) }, [product, setData])

  const onSubmitHandler = (data: productRequest) => {
    if (Object.values(data).some(v => !v)) {
      alert("Por favor llena todos los campos antes de registrar")
      return
    }
    if (parseFloat(data.price) <= 0) {
      alert("Por favor, ingrese un precio válido")
      return
    }

    (product
      ? request(productService.upd(product.id, data))
      : request(productService.new(data))

    ).then((response) => {
      if (!response) return
      alert("Producto creado con exito!")
      onDone?.()

    }).catch((error) => {
      console.error(error)
      alert("Error al crear el producto")
    })
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <TextField
        name="name"
        placeholder="nombre"
        defaultValue={product?.name}  
      />
      <TextField
        name="price"
        placeholder="precio"
        defaultValue={product?.price}  
      />
      <Button type="submit" disabled={isLoading}>
        Enviar
      </Button>
    </Form>
  )
}

type DeleteDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  product: productResponse | null
  setProduct: (product: productResponse | null) => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  product,
  setProduct
} : DeleteDialogProps) {
  const { isLoading, request } = useApi()

  const requestDelete = () => {
    if (!product) return
    request(productService.del(product.id))
      .then(() => {
        setProduct(null)
        setIsOpen(false)
      })
      .catch((error) => {
        console.error(error)
        alert("Error al eliminar el producto")
      })
  }

  return (
    <Dialog
      title="Eliminar producto"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que deseas eliminar el producto "{product?.name}"?
    </Dialog>
  )
}
