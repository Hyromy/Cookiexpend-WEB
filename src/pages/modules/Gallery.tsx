import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { galleryItemService } from "../../services/cookiexpend"
import type { ApiRequestError, galleryItemRequest, galleryItemResponse } from "../../types/api"
import { ActionButton, Button } from "../../components/Button"
import { FileField, Form, TextField } from "../../components/Form"
import { Table } from "../../components/Table"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"

export default function Gallery() {
  const { data, error, isLoading, request } = useApi<galleryItemResponse[]>()
  const requestData = useCallback(() => request(galleryItemService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<galleryItemResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<galleryItemResponse | null>(null)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState("")

  useEffect(() => { requestData() }, [requestData])

  const openCreate = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }
  const openEdit = (item: galleryItemResponse) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }
  const openDelete = (item: galleryItemResponse) => {
    setDeletingItem(item)
    setIsDialogOpen(true)
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Imagen
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Galería", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Galería"
          columns={[
            { accessorKey: "alt", header: "Descripción" },
            { accessorKey: "order", header: "Orden" },
            {
              accessorKey: "url",
              header: "Imagen",
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
        title={(editingItem ? "Editar" : "Agregar") + " imagen"}
      >
        <GalleryItemForm
          item={editingItem}
          onDone={() => {
            setEditingItem(null)
            setIsModalOpen(false)
            requestData()
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        item={deletingItem}
        setItem={setDeletingItem}
        onDeleted={requestData}
      />
      <Modal
        isOpen={isImageOpen}
        onClose={() => {
          setIsImageOpen(false)
          setTimeout(() => setImageSrc(""), 300)
        }}
        title="Imagen"
      >
        {imageSrc && (
          <img
            className="w-full h-full object-cover"
            src={imageSrc}
            alt=""
          />
        )}
      </Modal>
    </>
  )
}

type GalleryItemFormProps = {
  item: galleryItemResponse | null
  onDone?: () => void
}
function GalleryItemForm({ item, onDone }: GalleryItemFormProps) {
  const { isLoading, request, setData } = useApi()
  const { addToast } = useToast()

  useEffect(() => { if (item) setData(item) }, [item, setData])

  const submitErrorHandler = (err: ApiRequestError) => {
    const errData = err.data as Record<string, string[]>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)

    if (errData?.url?.find(thisIncludes("valid image"))) {
      addToast("Por favor, seleccione una imagen válida", "warning")
      return
    }
    if (errData?.url?.find(thisIncludes("required"))) {
      addToast("Por favor, seleccione una imagen", "warning")
      return
    }

    addToast("Error al guardar la imagen, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: galleryItemRequest) => {
    clearData(data)
    const validation = validate(data, item)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (item
      ? request(galleryItemService.upd(item.id, data))
      : request(galleryItemService.new(data))

    ).then(() => {
      addToast(`Imagen ${item ? "actualizada" : "agregada"} con éxito`, "success")
      onDone?.()

    }).catch(err => submitErrorHandler(err))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <div>
        <FileField
          label="Imagen"
          required={!item}
          name="url"
          value={item?.url}
        />
      </div>
      <div>
        <TextField
          cleanEmpty
          maxLen={200}
          name="alt"
          label="Descripción"
          defaultValue={item?.alt}
        />
      </div>
      <div>
        <TextField
          cleanRegex={/\D/}
          name="order"
          label="Orden"
          defaultValue={item?.order}
          placeholder="0"
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
  item: galleryItemResponse | null
  setItem: (item: galleryItemResponse | null) => void
  onDeleted: () => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  item,
  setItem,
  onDeleted
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!item) return
    request(galleryItemService.del(item.id))
      .then(() => {
        setItem(null)
        setIsOpen(false)
        addToast("Imagen eliminada con éxito", "success")
        onDeleted()
      })
      .catch(err => {
        console.error(err)
        addToast("Error al eliminar la imagen", "error")
      })
  }

  return (
    <Dialog
      title="Eliminar imagen"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar esta imagen de la galería?
    </Dialog>
  )
}

const clearData = (data: galleryItemRequest) => {
  data.alt = data.alt?.trim().replace(/\s+/g, " ")
  if (!String(data.order ?? "").trim()) delete data.order
}

const validate = (data: galleryItemRequest, item: galleryItemResponse | null): string | true => {
  if (!item && !data.url) {
    return "Por favor, seleccione una imagen."
  }

  return true
}