import { useCallback, useEffect, useMemo, useState } from "react"
import useApi from "../../hooks/useApi"
import type { ApiRequestError, categoryResponse, presentationResponse, productRequest, productResponse } from "../../types/api"
import { categoryService, presentationService, productService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { StateGate } from "../../components/State"
import { FileField, Form, MultiSelectField, SelectField, TextAreaField, TextField, type SelectFieldProps } from "../../components/Form"
import { ActionButton, Button } from "../../components/Button"
import { Table } from "../../components/Table"
import type { eventModel } from "../../types/events"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"
import Dropdown from "../../components/Dropdown"

const PRODUCT_EVENTS = ["product"] as eventModel[]

const PRODUCT_REQUIRED_ARGS = [
  "sku",
  "name",
  "price",
  "img",
] as (keyof productRequest)[]

export default function Products() {
  const { data, error, isLoading, request, setData } = useApi<productResponse[]>()
  const requestData = useCallback(() => request(productService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<productResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<productResponse | null>(null)
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState("")

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

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Producto
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "Productos", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="Productos"
          columns={[
            { accessorKey: "sku", header: "SKU" },
            { accessorKey: "name", header: "Nombre" },
            {
              accessorKey: "badge",
              header: "Etiqueta",
              cell: ({ getValue }) => getValue() && (
                <span className="rounded-full bg-primary/15 text-primary px-2.5 py-1 text-xs font-medium">
                  {getValue() as string}
                </span>
              )
            },
            { accessorKey: "category.label", header: "Categoría" },
            {
              accessorKey: "price",
              header: "Precio",
              cell: ({ getValue }) => `$${getValue()}`,
              meta: {
                setCellToExport: row => `$${row.price}`
              }
            },
            {
              accessorKey: "img",
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
              ),
              meta: {
                setCellToExport: row => row.img ? `=IMAGE("${row.img}")` : "-"
              }
            },
            {
              id: "variants",
              header: "Variantes",
              cell: ({ row }) => {
                const variants = row.original.variants
                if (!variants.length) return null

                return (
                  <Dropdown
                    options={variants.map(v => (
                      <span key={v.id} className="block px-4 py-2 text-sm text-fg">
                        {v.name}
                      </span>
                    ))}
                  >
                    {variants.length}
                  </Dropdown>
                )
              }
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
      <Modal
        isOpen={isImageOpen}
        onClose={() => {
          setIsImageOpen(false)
          setTimeout(() => setImageSrc(""), 300)
        }}
        title="Imagen del producto"
      >
        {imageSrc && (
          <img 
            className="w-full h-full object-cover"
            src={imageSrc}
            alt="Producto"
          />
        )}
      </Modal>
    </>
  )
}

type ProductFormProps = {
  product: productResponse | null,
  onDone?: () => void
}
function ProductForm({ product, onDone }: ProductFormProps) {
  const { isLoading, request, setData } = useApi()
  const { addToast } = useToast()
  const [variantIds, setVariantIds] = useState<string[]>(
    () => product?.variants.map(v => v.id.toString()) ?? []
  )

  useEffect(() => { if (product) setData(product) }, [product, setData])

  const submitErrorHandler = (err: ApiRequestError) => {
    const errData: Record<string, string[]> = err.data as Record<string, string[]>
    const thisIncludes = (str: string) => (i: string) => i.includes(str)

    if (errData?.sku?.find(thisIncludes("already exists"))) {
      addToast("Ya existe un producto con el mismo SKU, por favor ingrese uno diferente", "warning")
      return
    }
    if (errData?.name?.find(thisIncludes("already exists"))) {
      addToast("Ya existe un producto con el mismo nombre, por favor ingrese uno diferente", "warning")
      return
    }
    if (errData?.price?.find(thisIncludes("no more than"))) {
      addToast("El precio no puede ser mayor a 9999.99", "warning")
      return
    }
    if (errData?.img?.find(thisIncludes("valid image"))) {
      addToast("Por favor, seleccione una imagen válida", "warning")
      return
    }

    addToast("Error al guardar el producto, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: productRequest) => {
    data.variants = variantIds
    clearData(data)
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (product
      ? request(productService.upd(product.id, data))
      : request(productService.new(data))

    ).then(() => {
      addToast(`Producto ${product ? "actualizado" : "creado"} con éxito`, "success")
      onDone?.()

    }).catch((error) => submitErrorHandler(error))
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <div>
        <TextField
          cleanRegex={/[^a-zA-Z0-9-]/}
          maxLen={18}
          required
          name="sku"
          label="SKU"
          defaultValue={product?.sku}
        />
      </div>
      <div>
        <TextField
          required
          cleanRegex={/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,\s-]/g}
          name="name"
          label="Nombre"
          defaultValue={product?.name}  
        />
      </div>
      <div>
        <TextField
          required
          cleanRegex={/[^0-9.]|(?<=\..*)\./g}
          name="price"
          label="Precio"
          defaultValue={product?.price}
          placeholder="0.00"
        />
      </div>
      <div>
        <FileField
          label="Imagen"
          required={!product}
          name="img"
          value={product?.img}
        />
      </div>
      <div>
        <TextField
          maxLen={50}
          name="badge"
          label="Etiqueta"
          placeholder="Ej. Nuevo, Oferta"
          defaultValue={product?.badge}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <CategorySelectField defaultValue={product?.category?.id.toString()} />
        <PresentationSelectField defaultValue={product?.presentation?.id.toString()} />
      </div>
      <div>
        <TextAreaField
          maxLen={500}
          name="description"
          label="Descripción"
          defaultValue={product?.description}
        />
      </div>
      <div>
        <VariantsField
          excludeId={product?.id}
          selected={variantIds}
          onChange={setVariantIds}
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

type CategorySelectFieldProps = {
  defaultValue?: string
}
function CategorySelectField({ defaultValue }: CategorySelectFieldProps) {
  const { data, request } = useApi<categoryResponse[]>()

  useEffect(() => { request(categoryService.get()) }, [request])

  const options: SelectFieldProps["options"] = (data ?? []).map(c => ({
    value: c.id.toString(),
    label: c.label,
  }))

  return (
    <SelectField
      name="category"
      label="Categoría"
      placeholder="Sin categoría"
      selected={defaultValue}
      options={options}
    />
  )
}

type PresentationSelectFieldProps = {
  defaultValue?: string
}
function PresentationSelectField({ defaultValue }: PresentationSelectFieldProps) {
  const { data, request } = useApi<presentationResponse[]>()

  useEffect(() => { request(presentationService.get()) }, [request])

  const options: SelectFieldProps["options"] = (data ?? []).map(p => ({
    value: p.id.toString(),
    label: p.label,
  }))

  return (
    <SelectField
      name="presentation"
      label="Presentación"
      placeholder="Sin presentación"
      selected={defaultValue}
      options={options}
    />
  )
}

type VariantsFieldProps = {
  excludeId?: number
  selected: string[]
  onChange: (values: string[]) => void
}
function VariantsField({ excludeId, selected, onChange }: VariantsFieldProps) {
  const { data, request } = useApi<productResponse[]>()

  useEffect(() => { request(productService.get()) }, [request])

  const options = useMemo(() => (
    (data ?? [])
      .filter(p => p.id != excludeId)
      .map(p => ({ value: p.id.toString(), label: p.name }))
  ), [data, excludeId])

  return (
    <MultiSelectField
      label="Variantes"
      placeholder="Buscar productos..."
      options={options}
      selected={selected}
      onChange={onChange}
    />
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
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!product) return
    request(productService.del(product.id))
      .then(() => {
        setProduct(null)
        setIsOpen(false)
        addToast("Producto eliminado con éxito", "success")
      })
      .catch((error) => {
        console.error(error)
        addToast("Error al eliminar el producto", "error")
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

const clearData = (data: productRequest) => {
  const record = data as Record<string, unknown>
  PRODUCT_REQUIRED_ARGS.filter(k => k != "img").forEach(key => {
    const value = record[key]
    if (typeof value == "string" && value) {
      record[key] = value.trim().replace(/\s+/g, " ")
    }
  })

  if (data.badge) data.badge = data.badge.trim().replace(/\s+/g, " ")
  if (data.description) data.description = data.description.trim()

  data.price = parseFloat(data.price).toFixed(2)
}

const validate = (data: productRequest): string | true => {
  if (PRODUCT_REQUIRED_ARGS.some(k => !data[k])) {
    return "Por favor, complete todos los campos obligatorios."
  }
  if (parseFloat(data.price) <= 0) {
    return "Por favor, ingrese un precio válido"
  }
  if (parseInt(data.sku) <= 0) {
    return "Por favor, ingrese un SKU numérico válido"
  }

  return true
}
