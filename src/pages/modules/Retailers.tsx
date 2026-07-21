import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { brandService, retailerService } from "../../services/cookiexpend"
import type { ApiRequestError, brandResponse, retailerRequest, retailerResponse } from "../../types/api"
import { ActionButton, Button } from "../../components/Button"
import { FileField, Form, SelectField, TextField, type SelectFieldProps } from "../../components/Form"
import { Table } from "../../components/Table"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"

export default function Retailers() {
  const { data, error, isLoading, request } = useApi<retailerResponse[]>()
  const requestData = useCallback(() => request(retailerService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRetailer, setEditingRetailer] = useState<retailerResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingRetailer, setDeletingRetailer] = useState<retailerResponse | null>(null)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState("")

  useEffect(() => { requestData() }, [requestData])

  const openCreate = () => {
    setEditingRetailer(null)
    setIsModalOpen(true)
  }
  const openEdit = (retailer: retailerResponse) => {
    setEditingRetailer(retailer)
    setIsModalOpen(true)
  }
  const openDelete = (retailer: retailerResponse) => {
    setDeletingRetailer(retailer)
    setIsDialogOpen(true)
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Retailer
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Retailers", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Retailers"
          columns={[
            { accessorKey: "name", header: "Nombre" },
            { accessorKey: "brand.name", header: "Marca" },
            { accessorKey: "state", header: "Estado" },
            { accessorKey: "municipality", header: "Municipio" },
            { accessorKey: "address", header: "Dirección" },
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
        title={(editingRetailer ? "Editar" : "Agregar") + " retailer"}
        size="xl"
      >
        <RetailerForm
          retailer={editingRetailer}
          onDone={() => {
            setEditingRetailer(null)
            setIsModalOpen(false)
            requestData()
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        retailer={deletingRetailer}
        setRetailer={setDeletingRetailer}
        onDeleted={requestData}
      />
      <Modal
        isOpen={isImageOpen}
        onClose={() => {
          setIsImageOpen(false)
          setTimeout(() => setImageSrc(""), 300)
        }}
        title="Logo del retailer"
      >
        {imageSrc && (
          <img
            className="w-full h-full object-cover"
            src={imageSrc}
            alt="Retailer"
          />
        )}
      </Modal>
    </>
  )
}

type RetailerFormProps = {
  retailer: retailerResponse | null
  onDone?: () => void
}
function RetailerForm({ retailer, onDone }: RetailerFormProps) {
  const { isLoading, request, setData } = useApi()
  const { addToast } = useToast()

  useEffect(() => { if (retailer) setData(retailer) }, [retailer, setData])

  const submitErrorHandler = (err: ApiRequestError) => {
    const errData = err.data as Record<string, string[]>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)

    if (errData?.logo?.find(thisIncludes("valid image"))) {
      addToast("Por favor, seleccione una imagen válida", "warning")
      return
    }

    addToast("Error al guardar el retailer, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: retailerRequest) => {
    clearData(data)
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (retailer
      ? request(retailerService.upd(retailer.id, data))
      : request(retailerService.new(data))

    ).then(() => {
      addToast(`Retailer ${retailer ? "actualizado" : "creado"} con éxito`, "success")
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
          defaultValue={retailer?.name}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField
          cleanEmpty
          required
          name="state"
          label="Estado"
          defaultValue={retailer?.state}
        />
        <TextField
          cleanEmpty
          required
          name="municipality"
          label="Municipio"
          defaultValue={retailer?.municipality}
        />
      </div>
      <div>
        <TextField
          cleanEmpty
          required
          name="address"
          label="Dirección"
          defaultValue={retailer?.address}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField
          cleanRegex={/[^0-9.-]/}
          name="lat"
          label="Latitud"
          defaultValue={retailer?.lat ?? undefined}
        />
        <TextField
          cleanRegex={/[^0-9.-]/}
          name="lng"
          label="Longitud"
          defaultValue={retailer?.lng ?? undefined}
        />
      </div>
      <div>
        <BrandSelectField defaultValue={retailer?.brand?.id.toString()} />
      </div>
      <div>
        <FileField
          label="Logo"
          name="logo"
          value={retailer?.logo_url}
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

type BrandSelectFieldProps = {
  defaultValue?: string
}
function BrandSelectField({ defaultValue }: BrandSelectFieldProps) {
  const { data, request } = useApi<brandResponse[]>()

  useEffect(() => { request(brandService.get()) }, [request])

  const options: SelectFieldProps["options"] = (data ?? []).map(b => ({
    value: b.id.toString(),
    label: b.name,
  }))

  return (
    <SelectField
      name="brand"
      label="Marca"
      placeholder="Sin marca"
      selected={defaultValue}
      options={options}
    />
  )
}

type DeleteDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  retailer: retailerResponse | null
  setRetailer: (retailer: retailerResponse | null) => void
  onDeleted: () => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  retailer,
  setRetailer,
  onDeleted
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!retailer) return
    request(retailerService.del(retailer.id))
      .then(() => {
        setRetailer(null)
        setIsOpen(false)
        addToast("Retailer eliminado con éxito", "success")
        onDeleted()
      })
      .catch(err => {
        console.error(err)
        addToast("Error al eliminar el retailer", "error")
      })
  }

  return (
    <Dialog
      title="Eliminar retailer"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar el retailer "{retailer?.name}"?
    </Dialog>
  )
}

const clearData = (data: retailerRequest) => {
  data.name = data.name?.trim().replace(/\s+/g, " ")
  data.address = data.address?.trim()
  data.state = data.state?.trim()
  data.municipality = data.municipality?.trim()
  if (!String(data.lat ?? "").trim()) delete data.lat
  if (!String(data.lng ?? "").trim()) delete data.lng
}

const validate = (data: retailerRequest): string | true => {
  if (!data.name || !data.address || !data.state || !data.municipality) {
    return "Por favor, complete todos los campos obligatorios."
  }

  return true
}
