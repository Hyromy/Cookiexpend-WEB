import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { brandService } from "../../services/cookiexpend"
import type { ApiRequestError, brandRequest, brandResponse } from "../../types/api"
import { ActionButton, Button } from "../../components/Button"
import { FileField, Form, TextField } from "../../components/Form"
import { Table } from "../../components/Table"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"

export default function Brands() {
  const { data, error, isLoading, request } = useApi<brandResponse[]>()
  const requestData = useCallback(() => request(brandService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<brandResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingBrand, setDeletingBrand] = useState<brandResponse | null>(null)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState("")

  useEffect(() => { requestData() }, [requestData])

  const openCreate = () => {
    setEditingBrand(null)
    setIsModalOpen(true)
  }
  const openEdit = (brand: brandResponse) => {
    setEditingBrand(brand)
    setIsModalOpen(true)
  }
  const openDelete = (brand: brandResponse) => {
    setDeletingBrand(brand)
    setIsDialogOpen(true)
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Marca
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Marcas", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Marcas"
          columns={[
            { accessorKey: "name", header: "Nombre" },
            {
              accessorKey: "logo_url",
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
        title={(editingBrand ? "Editar" : "Agregar") + " marca"}
      >
        <BrandForm
          brand={editingBrand}
          onDone={() => {
            setEditingBrand(null)
            setIsModalOpen(false)
            requestData()
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        brand={deletingBrand}
        setBrand={setDeletingBrand}
        onDeleted={requestData}
      />
      <Modal
        isOpen={isImageOpen}
        onClose={() => {
          setIsImageOpen(false)
          setTimeout(() => setImageSrc(""), 300)
        }}
        title="Logo de la marca"
      >
        {imageSrc && (
          <img
            className="w-full h-full object-cover"
            src={imageSrc}
            alt="Marca"
          />
        )}
      </Modal>
    </>
  )
}

type BrandFormProps = {
  brand: brandResponse | null
  onDone?: () => void
}
function BrandForm({ brand, onDone }: BrandFormProps) {
  const { isLoading, request, setData } = useApi()
  const { addToast } = useToast()

  useEffect(() => { if (brand) setData(brand) }, [brand, setData])

  const submitErrorHandler = (err: ApiRequestError) => {
    const errData = err.data as Record<string, string[]>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)

    if (errData?.logo?.find(thisIncludes("valid image"))) {
      addToast("Por favor, seleccione una imagen válida", "warning")
      return
    }

    addToast("Error al guardar la marca, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: brandRequest) => {
    clearData(data)
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (brand
      ? request(brandService.upd(brand.id, data))
      : request(brandService.new(data))

    ).then(() => {
      addToast(`Marca ${brand ? "actualizada" : "creada"} con éxito`, "success")
      onDone?.()

    }).catch(err => submitErrorHandler(err))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <div>
        <TextField
          cleanEmpty
          required
          name="name"
          label="Nombre"
          defaultValue={brand?.name}
        />
      </div>
      <div>
        <FileField
          label="Logo"
          name="logo"
          value={brand?.logo_url}
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
  brand: brandResponse | null
  setBrand: (brand: brandResponse | null) => void
  onDeleted: () => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  brand,
  setBrand,
  onDeleted
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!brand) return
    request(brandService.del(brand.id))
      .then(() => {
        setBrand(null)
        setIsOpen(false)
        addToast("Marca eliminada con éxito", "success")
        onDeleted()
      })
      .catch(err => {
        console.error(err)
        addToast("Error al eliminar la marca", "error")
      })
  }

  return (
    <Dialog
      title="Eliminar marca"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar la marca "{brand?.name}"?
    </Dialog>
  )
}

const clearData = (data: brandRequest) => {
  data.name = data.name?.trim().replace(/\s+/g, " ")
}

const validate = (data: brandRequest): string | true => {
  if (!data.name) {
    return "Por favor, complete todos los campos obligatorios."
  }

  return true
}
