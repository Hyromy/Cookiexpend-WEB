import { useState, type ReactNode } from "react"
import { Button } from "../components/Button"
import { Modal } from "../components/Modal"
import { Form, FileField } from "../components/Form"
import useToast from "../hooks/useToast"
import { Excel } from "../components/Icon"
import * as XLSX from "xlsx"  

type sheet = {
  name: string
  columns: string[]
}

type MassiveUploadProps = {
  sheets: sheet[]
  label?: ReactNode
  fileName?: string
}
export function MassiveUpload({
  sheets,
  label = "Carga masiva",
  fileName = "plantilla.xlsx"
}: MassiveUploadProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { addToast } = useToast()

  const handleFileUpload = async (data: any) => {
    const validation = await validate(data.file)
    if (validation != true) {
      addToast(validation as string, "warning")
      return
    }

    try {

    } catch (err) {

    }

    console.log(data)
    confirmSubmit()
  }
  
  const validate = async (file: File): Promise<string | true> => {
    const allowedExtensions = ["xlsx", "xls"]
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return "Formato de archivo no válido. Por favor, sube un archivo Excel."
    }

    try {
      const columns = await getColumns(file)
      console.log(columns)
      if (!columns[0] || columns[0].length == 0) {
        return "El archivo Excel está vacío o no contiene cabeceras."
      }
    } catch (err) {
      console.error(err)
      return "Error al leer el archivo Excel. Asegúrate de que el archivo no esté dañado."
    }

    return true
  }

  const getColumns = (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const dataBuffer = e.target?.result
          const workbook = XLSX.read(dataBuffer, { type: 'buffer' })
          const columns: string[][] = []

          workbook.SheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName]
            const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { 
              header: 1, 
              range: 0 
            })
            columns.push(data[0] || [])
          })

          resolve(columns)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = (err) => reject(err)
      reader.readAsArrayBuffer(file)
    })
  }

  const confirmSubmit = () => {
    addToast("Archivo cargado correctamente", "success")
    setIsModalOpen(false)
  }

  const downloadTemplate = (sheets: sheet[]) => {
    const workbook = XLSX.utils.book_new()
    sheets.forEach(sheet => {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.aoa_to_sheet([sheet.columns]),
        sheet.name
      )
    })
    XLSX.writeFile(workbook, fileName)
  }

  return (
    <>
      <Button
        className="px-6"
        onClick={() => setIsModalOpen(true)}
        variant="secondary"
      >
        {label}
      </Button>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Carga masiva de repartos"
      >
        <Form
          onSubmit={handleFileUpload}
          className="space-y-4"
        >
          <Button
            variant="outline"
            className="w-full gap-2 text-[#107C41]"
            onClick={() => downloadTemplate(sheets)}
          >
            <Excel /> Descargar plantilla
          </Button>
          <div>
            <FileField
              name="file"
              label="Cargar archivo"
              required
            />
          </div>
          <div className="flex justify-center">
            <Button type="submit" className="px-6">
              Enviar archivo
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  )
}

