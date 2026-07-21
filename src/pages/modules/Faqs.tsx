import { useCallback, useEffect, useState } from "react"
import { StateGate } from "../../components/State"
import useApi from "../../hooks/useApi"
import { faqService } from "../../services/cookiexpend"
import type { ApiRequestError, faqRequest, faqResponse } from "../../types/api"
import { ActionButton, Button } from "../../components/Button"
import { Form, TextAreaField, TextField } from "../../components/Form"
import { Table } from "../../components/Table"
import { Dialog, Modal } from "../../components/Modal"
import useToast from "../../hooks/useToast"

export default function Faqs() {
  const { data, error, isLoading, request } = useApi<faqResponse[]>()
  const requestData = useCallback(() => request(faqService.get()), [request])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<faqResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [deletingFaq, setDeletingFaq] = useState<faqResponse | null>(null)

  useEffect(() => { requestData() }, [requestData])

  const openCreate = () => {
    setEditingFaq(null)
    setIsModalOpen(true)
  }
  const openEdit = (faq: faqResponse) => {
    setEditingFaq(faq)
    setIsModalOpen(true)
  }
  const openDelete = (faq: faqResponse) => {
    setDeletingFaq(faq)
    setIsDialogOpen(true)
  }

  const btnAdd = (
    <Button
      onClick={openCreate}
      className="px-6"
    >
      Agregar Pregunta
    </Button>
  )

  return (
    <>
      <StateGate
        data={data}
        error={error}
        loading={isLoading}
        emptyProps={{ title: "FAQ", content: btnAdd }}
        errorProps={{ onRetry: requestData }}
      >
        <div className="mb-2">
          {btnAdd}
        </div>
        <Table
          data={data!}
          exportToExcel
          filename="FAQ"
          columns={[
            { accessorKey: "question", header: "Pregunta" },
            { accessorKey: "answer", header: "Respuesta" },
            { accessorKey: "order", header: "Orden" },
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
        title={(editingFaq ? "Editar" : "Agregar") + " pregunta frecuente"}
      >
        <FaqForm
          faq={editingFaq}
          onDone={() => {
            setEditingFaq(null)
            setIsModalOpen(false)
            requestData()
          }}
        />
      </Modal>
      <DeleteDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        faq={deletingFaq}
        setFaq={setDeletingFaq}
        onDeleted={requestData}
      />
    </>
  )
}

type FaqFormProps = {
  faq: faqResponse | null
  onDone?: () => void
}
function FaqForm({ faq, onDone }: FaqFormProps) {
  const { isLoading, request, setData } = useApi()
  const { addToast } = useToast()

  useEffect(() => { if (faq) setData(faq) }, [faq, setData])

  const submitErrorHandler = () => {
    addToast("Error al guardar la pregunta, por favor intente más tarde", "error")
  }

  const onSubmitHandler = (data: faqRequest) => {
    clearData(data)
    const validation = validate(data)
    if (validation != true) {
      addToast(validation, "warning")
      return
    }

    (faq
      ? request(faqService.upd(faq.id, data))
      : request(faqService.new(data))

    ).then(() => {
      addToast(`Pregunta ${faq ? "actualizada" : "creada"} con éxito`, "success")
      onDone?.()

    }).catch(() => submitErrorHandler())
  }

  return (
    <Form onSubmit={onSubmitHandler} className="flex flex-col gap-4">
      <div>
        <TextField
          cleanEmpty
          maxLen={300}
          required
          name="question"
          label="Pregunta"
          defaultValue={faq?.question}
        />
      </div>
      <div>
        <TextAreaField
          required
          name="answer"
          label="Respuesta"
          defaultValue={faq?.answer}
        />
      </div>
      <div>
        <TextField
          cleanRegex={/\D/}
          name="order"
          label="Orden"
          defaultValue={faq?.order}
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
  faq: faqResponse | null
  setFaq: (faq: faqResponse | null) => void
  onDeleted: () => void
}
function DeleteDialog({
  isOpen,
  setIsOpen,
  faq,
  setFaq,
  onDeleted
}: DeleteDialogProps) {
  const { isLoading, request } = useApi()
  const { addToast } = useToast()

  const requestDelete = () => {
    if (!faq) return
    request(faqService.del(faq.id))
      .then(() => {
        setFaq(null)
        setIsOpen(false)
        addToast("Pregunta eliminada con éxito", "success")
        onDeleted()
      })
      .catch((err: ApiRequestError) => {
        console.error(err)
        addToast("Error al eliminar la pregunta", "error")
      })
  }

  return (
    <Dialog
      title="Eliminar pregunta"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      loading={isLoading}
      blockMissClick
      onConfirm={requestDelete}
    >
      ¿Estás seguro que quieres eliminar la pregunta "{faq?.question}"?
    </Dialog>
  )
}

const clearData = (data: faqRequest) => {
  data.question = data.question?.trim().replace(/\s+/g, " ")
  data.answer = data.answer?.trim()
  if (!String(data.order ?? "").trim()) delete data.order
}

const validate = (data: faqRequest): string | true => {
  if (!data.question || !data.answer) {
    return "Por favor, complete todos los campos obligatorios."
  }

  return true
}
