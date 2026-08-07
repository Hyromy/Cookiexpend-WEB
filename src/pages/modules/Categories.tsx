import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { categoryService } from "../../services/cookiexpend"
import type { ApiRequestError, categoryRequest, categoryResponse } from "../../types/api"
import { ActionButton, Button } from "../../components/Button"
import { FileField, Form, TextField } from "../../components/Form"
import { Table } from "../../components/Table"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"

export default function Categories() {
  const { data, error, isLoading, request } = useApi<categoryResponse[]>()
  const requestData = useCallback(() => request(categoryService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<categoryResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<categoryResponse | null>(null)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState("")

  useEffect(() => { requestData() }, [requestData])

  const openCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }
  const openEdit = (category: categoryResponse) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }
  const openDelete = (category: categoryResponse) => {
    setDeletingCategory(category)
    setIsDialogOpen(true)
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Categoría
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Categorías", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Categorías"
          columns={[
            { accessorKey: "label", header: "Nombre" },
            { accessorKey: "order", header: "Orden" },
            {
              accessorKey: "logo",
              header: "Logo",
              cell: ({ getValue }) => getValue() && (
                <ActionButton
                  variant="info"
                  icon="image"
                  disabled={!getValue()}
                  cb={() => {
                    setImageSrc(getValue() as string)
                    setIsImageOpen(true)
                  }}
                />
              )
            },
            {
              id: "actions",
              header: "Acciones",
              cell: ({ row }) => (
                <div className="flex gap-2">
                  <ActionButton
                    variant="warning"
                    icon="pencil"
                    cb={() => openEdit(row.original)}
                  />
                  <ActionButton
                    variant="danger"
                    icon="trash"
                    cb={() => openDelete(row.original)}
                  />
                </div>
              )
            }
          ]}
        />
      </StateGate>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={(editingCategory ? "Editar" : "Agregar") + " categoría"}
      >
        <CategoryForm
          category={editingCategory}
          onDone={() => {
            setEditingCategory(null)
            setIsModalOpen(false)
            requestData()
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        category={deletingCategory}
        setCategory={setDeletingCategory}
        onDeleted={requestData}
      />
      <Modal
        isOpen={isImageOpen}
        onClose={() => {
          setIsImageOpen(false)
          setTimeout(() => setImageSrc(""), 300)
        }}
        title="Logo de la categoría"
      >
        {imageSrc && (
          <img
            className="w-full h-full object-cover"
            src={imageSrc}
            alt="Categoría"
          />
        )}
      </Modal>
    </>
  )
}

type CategoryFormProps = {
  category: categoryResponse | null
  onDone?: () => void
}
function CategoryForm({ category, onDone }: CategoryFormProps) {
  const { isLoading, request, setData } = useApi()
  const { addToast } = useToast()

  useEffect(() => { if (category) setData(category) }, [category, setData])

  const submitErrorHandler = (err: ApiRequestError) => {
    const errData = err.data as Record<string, string[]>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)

    if (errData?.label?.find(thisIncludes("already exists"))) {
      addToast("Ya existe una categoría con ese nombre", "warning")
      return
    }
    if (errData?.logo?.find(thisIncludes("valid image"))) {
      addToast("Por favor, seleccione una imagen válida", "warning")
      return
    }

    addToast("Error al guardar la categoría, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: categoryRequest) => {
    clearData(data)
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (category
      ? request(categoryService.upd(category.id, data))
      : request(categoryService.new(data))

    ).then(() => {
      addToast(`Categoría ${category ? "actualizada" : "creada"} con éxito`, "success")
      onDone?.()

    }).catch(err => submitErrorHandler(err))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <div>
        <TextField
          cleanEmpty
          cleanRegex={/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,\s-]/g}
          required
          name="label"
          label="Nombre"
          defaultValue={category?.label}
        />
      </div>
      <div>
        <TextField
          cleanRegex={/\D/}
          name="order"
          label="Orden"
          defaultValue={category?.order}
          placeholder="0"
        />
      </div>
      <div>
        <FileField
          label="Logo"
          name="logo"
          value={category?.logo}
        />
      </div>
      <div className="flex justify-center">
        <Button
          className="px-6"
          type="submit"
          disabled={isLoading}
        >
          Guardar
        </Button>
      </div>
    </Form>
  )
}

type DeleteDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  category: categoryResponse | null
  setCategory: (category: categoryResponse | null) => void
  onDeleted: () => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  category,
  setCategory,
  onDeleted
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!category) return
    request(categoryService.del(category.id))
      .then(() => {
        setCategory(null)
        setIsOpen(false)
        addToast("Categoría eliminada con éxito", "success")
        onDeleted()
      })
      .catch(err => {
        console.error(err)
        addToast("Error al eliminar la categoría", "error")
      })
  }

  return (
    <Dialog
      title="Eliminar categoría"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar la categoría "{category?.label}"?
    </Dialog>
  )
}

const clearData = (data: categoryRequest) => {
  data.label = data.label?.trim().replace(/\s+/g, " ")
  if (!String(data.order ?? "").trim()) delete data.order
}

const validate = (data: categoryRequest): string | true => {
  if (!data.label) {
    return "Por favor, complete todos los campos obligatorios."
  }

  return true
}
