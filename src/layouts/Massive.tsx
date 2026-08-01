import { useState, type ReactNode } from "react"
import { Button } from "../components/Button"
import { Modal } from "../components/Modal"
import { Form, FileField } from "../components/Form"
import useToast from "../hooks/useToast"
import { Excel } from "../components/Icon"
import * as XLSX from "xlsx"  
import useApi from "../hooks/useApi"
import type { massiveResponse, massiveSheet } from "../types/api"
import { AccordionDropdown } from "../components/Dropdown"

type Column = {
  name: string
  key: string
}

type sheet = {
  name: string
  columns: Column[]
}

type MassiveUploadProps = {
  sheets: sheet[]
  promiseCB: (matrix: Record<string, unknown>[][]) => Promise<massiveResponse>
  label?: ReactNode
  fileName?: string
  title?: string
}
export function MassiveUpload({
  sheets,
  promiseCB,
  label = "Carga masiva",
  fileName = "plantilla.xlsx",
  title = "Carga masiva",
}: MassiveUploadProps) {
  const { data, error, isLoading, request, setData } = useApi<massiveResponse>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const { addToast } = useToast()

  const onSubmit = async (data: { file: File }) => {
    const file = data.file
    const allowedExtensions = ["xlsx", "xls"]
    const fileExtension = file?.name?.split(".").pop()?.toLowerCase()
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      addToast("Formato de archivo no válido. Por favor, sube un archivo Excel.", "warning")
      return
    }

    try {
      const matrix = await getData(file)
      
      const validation = validate(
        matrix.map(sheet => sheet[0] || []),
        sheets
      )
      
      if (validation != true) {
        addToast(validation, "warning", validation.length > 100 ? 8000 : undefined)
        return
      }

      await request(
        promiseCB(
          matrix.map((sheet, i) => parseTable(sheet, sheets[i]))
        )
      )
      setIsSummaryOpen(true)
    } catch (err) {
      console.error(err)
      addToast("Error al procesar el archivo Excel. Asegúrate de que no esté dañado.", "error")
    }
  }

  const mkSummary = makeSummary(sheets)

  const insertedCount = countItems(data?.inserted ?? [])
  const duplicatedCount = countItems(data?.duplicated ?? [])
  const errorsCount = countItems(data?.errors ?? [])
  const requestErrorMessage = error?.message || "Error al procesar el archivo Excel. Asegúrate de que no esté dañado."

  const summaryDisplay = error ? (
    <div className="text-center text-danger">
      {requestErrorMessage}
    </div>
  ) : (insertedCount + duplicatedCount + errorsCount) > 0 ? (
    <>
      {insertedCount > 0 && (
        <AccordionDropdown>
          Insertados ({insertedCount})
        </AccordionDropdown>
      )}
      {duplicatedCount > 0 && (
        <AccordionDropdown options={duplicatedCount > 0 ? data?.duplicated.map(mkSummary) : undefined}>
          Duplicados ({duplicatedCount})
        </AccordionDropdown>
      )}
      {errorsCount > 0 && (
        <AccordionDropdown options={errorsCount > 0 ? data?.errors.map(mkSummary) : undefined}>
          Errores ({errorsCount})
        </AccordionDropdown>
      )}
    </>
  ) : (
    <div className="text-center text-muted">
      No se encontraron registros insertados, duplicados o con errores.
    </div>
  )

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
        title={title}
      >
        <Form
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <Button
            variant="ghost"
            className="w-full gap-2 border-2 text-[#107C41]"
            onClick={() => downloadTemplate(sheets, fileName)}
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
            <Button
              type="submit"
              className="px-6"
              disabled={isLoading}
            >
              Enviar archivo
            </Button>
          </div>
        </Form>
      </Modal>
      <Modal
        isOpen={isSummaryOpen}
        blockMissClick
        onClose={() => {
          setData(null)
          addToast("Carga masiva completada", "success")
          setIsModalOpen(false)
          setIsSummaryOpen(false)
        }}
        size="xl"
        title="Resumen de la carga masiva"
      >
        <div className="space-y-4 flex flex-col justify-center items-center">
          {summaryDisplay}
        </div>
      </Modal>
    </>
  )
}

type rawMatrix = string[][][]
const getData = (file: File): Promise<rawMatrix> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const dataBuffer = e.target?.result
        const workbook = XLSX.read(dataBuffer, { type: 'array' })
        const excelMatrix: rawMatrix = []

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName]
          const sheetData = XLSX.utils.sheet_to_json<string[]>(worksheet, { 
            header: 1, 
            raw: false,
            blankrows: true,
          })

          excelMatrix.push(sheetData || [])
        })

        resolve(excelMatrix)
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)
  })
}

const downloadTemplate = (sheets: sheet[], fileName: string) => {
  const workbook = XLSX.utils.book_new()
  sheets.forEach(sheet => {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([sheet.columns.map(col => col.name)]),
      sheet.name
    )
  })
  XLSX.writeFile(workbook, fileName)
}

const parseTable = (table: string[][], currentSheet: sheet): Record<string, string>[] => {
  const newTable: Record<string, string>[] = []

  if (!currentSheet) return newTable

  const keysName = currentSheet.columns.map(col => col.key)
  for (let index = 0; index < table.length; index++) {
    if (index == 0) continue 
    
    const obj: Record<string, string> = {}
    keysName.forEach((key, colIndex) => {
      const value = table[index][colIndex]?.trim()
      if (value) obj[key] = value
    })

    newTable.push(obj)
  }

  return newTable
}

const validate = (colsSheets: string[][], sheets: sheet[]): string | true => {
  if (!colsSheets || colsSheets.length == 0 || colsSheets[0].length == 0) {
    return "El archivo Excel está vacío o no contiene cabeceras."
  }
  
  if (colsSheets.length < sheets.length) {
    return `El archivo no contiene todas las hojas requeridas. Se esperaban ${sheets.length} pestañas.`
  }

  for (let index = 0; index < sheets.length; index++) {
    const sheet = sheets[index]
    const expectedCols = sheet.columns
    const uploadedSheet = colsSheets[index] || []

    if (expectedCols.length != uploadedSheet.length) {
      return `Error en la pestaña ${index + 1}: Se esperaban ${expectedCols.length} columnas, pero se encontraron ${uploadedSheet.length}.`
    }

    for (let colIndex = 0; colIndex < expectedCols.length; colIndex++) {
      const expectedCol = expectedCols[colIndex]
      const uploadedCol = (uploadedSheet[colIndex] || "").trim().toLowerCase()
      const expectedColNormalized = expectedCol.name.trim().toLowerCase()

      if (uploadedCol != expectedColNormalized) {
        return `Plantilla manipulada. En la pestaña ${index + 1}: la columna en la posición ${colIndex + 1} debería ser "${expectedCol}", pero se encontró "${uploadedSheet[colIndex] || ''}".`
      }
    }
  }

  return true
}

const countItems = (sheets: massiveSheet<unknown>[]): number => {
  if (!sheets || sheets.length == 0) return 0
  return sheets.flatMap((sheet) => Object.values(sheet)).length
}

const makeSummary = (sheets: sheet[]) => (res: massiveSheet<string>, index: number) => {
  if (!res || Object.keys(res).length == 0) {
    return null
  }
  
  return (
    <AccordionDropdown
      key={index}
      options={Object.entries(res).map(([key, value]) => (
        <div key={key} className="space-y-1">
          <div className="font-medium">Fila {parseInt(key) + 2}</div>
          <div className="text-sm text-muted">
            <ul className="list-disc list-inside pl-2">
              {value.map((val, i) => (
                <li key={i}>{val}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    >
      Hoja de {sheets[index].name} ({Object.keys(res).length})
    </AccordionDropdown>
  )
}
