import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { Download, Image as ImageIcon, Trash, Upload } from "lucide-react"
import { clsx } from "clsx"
import useApi from "../../hooks/useApi"
import type { ApiRequestError, categoryResponse, presentationResponse, productImageResponse, productRequest, productResponse } from "../../types/api"
import { categoryService, presentationService, productImageService, productService } from "../../services/cookiexpend"
import useEvent, { useEventOnCUD } from "../../hooks/useEvent"
import { StateGate } from "../../components/State"
import { Form, MultiSelectField, SelectField, TextAreaField, TextField, type SelectFieldProps } from "../../components/Form"
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
  "description",
  "category",
  "presentation",
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
          exportToExcel={{
            sheetName: "Productos",
            sheets: [{
              sheetName: "Variantes",
              // Variant links are one level deep only (VariantSerializer on the
              // backend returns id/slug/name, never nested variants), so this
              // can't recurse.
              getData: (products) => products.flatMap(p => (
                p.variants.map(v => ({
                  "Producto SKU": p.sku,
                  "Producto": p.name,
                  "Variante": v.name,
                }))
              ))
            }]
          }}
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
              id: "img",
              header: "Imagen",
              cell: ({ row }) => {
                const src = row.original.images[0]?.img
                return src && (
                  <ActionButton
                    variant="info"
                    icon="image"
                    cb={() => {
                      setImageSrc(src)
                      setIsImageOpen(true)
                    }}
                  />
                )
              },
              meta: {
                setCellToExport: row => row.images[0]?.img ? `=IMAGE("${row.images[0].img}")` : "-"
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
              },
              meta: {
                setCellToExport: row => row.variants.map(v => v.name).join(", ") || "-"
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
        size="xl"
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
  const [images, setImages] = useState<productImageResponse[]>(() => product?.images ?? [])
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([])
  const [isUploadingImages, setIsUploadingImages] = useState(false)

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

    addToast("Error al guardar el producto, por favor intente más tarde", "error")
  }

  const uploadStagedImages = (productId: number) => {
    return stagedImages.reduce<Promise<void>>(
      (chain, staged, index) => chain.then(() => (
        request(productImageService.new({ product: productId, img: staged.file, order: index }))
          .then(() => {})
          .catch(() => {
            addToast("El producto se guardó, pero una de las imágenes adicionales no se pudo subir", "warning")
          })
      )),
      Promise.resolve()
    )
  }

  const onSubmitHandler = (data: productRequest) => {
    data.variants = variantIds
    clearData(data)
    const hasImages = product ? images.length > 0 : stagedImages.length > 0
    const validation = validate(data, hasImages)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    setIsUploadingImages(!product && stagedImages.length > 0);

    (product
      ? request(productService.upd(product.id, data))
      : request(productService.new(data))

    ).then(async (savedProduct) => {
      if (!product && stagedImages.length > 0 && savedProduct) {
        await uploadStagedImages(savedProduct.id)
      }
      addToast(`Producto ${product ? "actualizado" : "creado"} con éxito`, "success")
      onDone?.()

    }).catch((error) => submitErrorHandler(error))
      .finally(() => setIsUploadingImages(false))
  }

  const formId = product ? `product-form-${product.id}` : "product-form-new"

  return (
    <>
      <Form id={formId} onSubmit={onSubmitHandler} className="flex flex-col gap-4">
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
            required
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
      </Form>
      {product
        ? (
          <ProductImagesField
            productId={product.id}
            images={images}
            onChange={setImages}
          />
        )
        : (
          <StagedImagesField
            staged={stagedImages}
            onChange={setStagedImages}
          />
        )
      }
      <div className="flex justify-center mt-4">
        <Button
          className="px-6"
          type="submit"
          form={formId}
          disabled={isLoading || isUploadingImages}
        >
          {isUploadingImages ? "Subiendo imágenes..." : "Guardar"}
        </Button>
      </div>
    </>
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
      required
      name="category"
      label="Categoría"
      placeholder="Selecciona una categoría"
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
      required
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

type ImageRowProps = {
  label: string
  href: string
  onRemove: () => void
  disabled?: boolean
}
function ImageRow({ label, href, onRemove, disabled }: ImageRowProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex grow items-center gap-2 rounded-md px-3 py-1.5 text-base sm:text-sm/6 outline-1 -outline-offset-1 bg-initial">
        <ImageIcon className="size-4 shrink-0 opacity-60 text-primary" />
        <span className="truncate opacity-80 grow">{label}</span>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-base sm:text-sm/6 outline-1 -outline-offset-1 hover:bg-neutral-500/5 font-medium transition-colors duration-150 h-full shrink-0"
        title="Ver imagen"
      >
        <Download className="p-1 text-primary opacity-60" />
      </a>
      <button
        type="button"
        disabled={disabled}
        onClick={onRemove}
        className="flex items-center justify-center gap-1 rounded-md px-3 py-1.5 outline-1 -outline-offset-1 hover:bg-danger/10 transition-colors duration-150 h-full shrink-0 disabled:opacity-50 hover:cursor-pointer"
        title="Eliminar imagen"
      >
        <Trash className="p-1 text-danger opacity-70" />
      </button>
    </div>
  )
}

type MultiImagePickerProps = {
  disabled?: boolean
  onSelect: (files: File[]) => void
}
function MultiImagePicker({ disabled, onSelect }: MultiImagePickerProps) {
  const [key, setKey] = useState(0)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onSelect(files)
    setKey(k => k + 1)
  }

  return (
    <label
      className={clsx(
        "flex items-center gap-2 rounded-md px-3 py-1.5 text-base sm:text-sm/6 outline-1 -outline-offset-1 transition-all duration-50 bg-initial",
        "has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-primary",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-neutral-500/5"
      )}
    >
      <input
        key={key}
        type="file"
        accept="image/*"
        multiple
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />
      <Upload className="size-4 shrink-0 opacity-60 text-primary" />
      <span className="truncate opacity-80 grow">Agregar imágenes...</span>
    </label>
  )
}

type ProductImagesFieldProps = {
  productId: number
  images: productImageResponse[]
  onChange: (images: productImageResponse[]) => void
}
function ProductImagesField({ productId, images, onChange }: ProductImagesFieldProps) {
  const { isLoading, request } = useApi<productImageResponse>()
  const { addToast } = useToast()

  const handleSelect = async (files: File[]) => {
    let current = images
    for (const file of files) {
      try {
        const newImage = await request(productImageService.new({ product: productId, img: file, order: current.length }))
        current = [...current, newImage!]
        onChange(current)
      } catch {
        addToast("Error al agregar una de las imágenes, por favor intente más tarde", "error")
      }
    }
  }

  const handleRemove = (imageId: number) => {
    request(productImageService.del(imageId))
      .then(() => onChange(images.filter(i => i.id != imageId)))
      .catch(() => addToast("Error al eliminar la imagen, por favor intente más tarde", "error"))
  }

  return (
    <div className="w-full space-y-2 mt-4">
      <label className="block text-sm/6 font-medium"><strong className="text-red-500 mr-1">*</strong>Imágenes</label>
      {images.length > 0 && (
        <div className="space-y-1.5">
          {images.map((image, index) => (
            <ImageRow
              key={image.id}
              label={`Imagen ${index + 1}`}
              href={image.img}
              disabled={isLoading}
              onRemove={() => handleRemove(image.id)}
            />
          ))}
        </div>
      )}
      <MultiImagePicker disabled={isLoading} onSelect={handleSelect} />
    </div>
  )
}

type StagedImage = {
  file: File
  previewUrl: string
}

type StagedImagesFieldProps = {
  staged: StagedImage[]
  onChange: (staged: StagedImage[]) => void
}
function StagedImagesField({ staged, onChange }: StagedImagesFieldProps) {
  const stagedRef = useRef(staged)
  useEffect(() => { stagedRef.current = staged })

  useEffect(() => () => {
    stagedRef.current.forEach(s => URL.revokeObjectURL(s.previewUrl))
  }, [])

  const handleSelect = (files: File[]) => {
    const added = files.map(file => ({ file, previewUrl: URL.createObjectURL(file) }))
    onChange([...staged, ...added])
  }

  const handleRemove = (index: number) => {
    URL.revokeObjectURL(staged[index].previewUrl)
    onChange(staged.filter((_, i) => i != index))
  }

  return (
    <div className="w-full space-y-2 mt-4">
      <label className="block text-sm/6 font-medium"><strong className="text-red-500 mr-1">*</strong>Imágenes</label>
      {staged.length > 0 && (
        <div className="space-y-1.5">
          {staged.map((img, index) => (
            <ImageRow
              key={img.previewUrl}
              label={img.file.name}
              href={img.previewUrl}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
      )}
      <MultiImagePicker onSelect={handleSelect} />
    </div>
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
  PRODUCT_REQUIRED_ARGS.forEach(key => {
    const value = record[key]
    if (typeof value == "string" && value) {
      record[key] = value.trim().replace(/\s+/g, " ")
    }
  })

  if (data.badge) data.badge = data.badge.trim().replace(/\s+/g, " ")

  data.price = parseFloat(data.price).toFixed(2)
}

const validate = (data: productRequest, hasImages: boolean): string | true => {
  if (PRODUCT_REQUIRED_ARGS.some(k => !data[k])) {
    return "Por favor, complete todos los campos obligatorios."
  }
  if (parseFloat(data.price) <= 0) {
    return "Por favor, ingrese un precio válido"
  }
  if (parseInt(data.sku) <= 0) {
    return "Por favor, ingrese un SKU numérico válido"
  }
  if (!hasImages) {
    return "Por favor, agregue al menos una imagen del producto"
  }

  return true
}
