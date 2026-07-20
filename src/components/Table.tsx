import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type Header,
  type Row,
} from "@tanstack/react-table"
import { useState } from "react"
import * as XLSX from "xlsx"
import clsx from "clsx"
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"
import { Button } from "./Button"
import { SelectField } from "./Form"
import { Excel } from "./Icon"

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    setCellToExport?: (row: TData, value?: TValue) => unknown
  }
}

export type ExcelSheetConfig<T> = {
  sheetName: string
  getData: (data: T[]) => Record<string, unknown>[]
}

export type ExcelExportConfig<T> = {
  sheetName: string
  sheets?: ExcelSheetConfig<T>[]
}

type TableProps<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  exportToExcel?: boolean | ExcelExportConfig<T>
  filename?: string
  excludeFromView?: (row: T) => boolean
}

/**
 * Component that renders a table with sorting, filtering, pagination and optional export functionality.
 * 
 * @param data - The data to be loaded in the table.
 * @param columns - The column definitions for the table to display.
 * @param exportToExcel - Whether to show the export to Excel button.
 * @param filename - The filename to use when exporting to Excel.
 * @param excludeFromView - A function that receives a row and returns true if it should be excluded from the table view.
 * 
 * @example
 * const data = [
 *   { id: 1, name: "Product 1", price: 10 },
 *   { id: 2, name: "Product 2", price: 20 }
 * ]
 * const columns = [
 *   { accessorKey: "id", header: "ID" },
 *   { accessorKey: "name", header: "Product name" },
 *   { accessorKey: "price", header: "Price", cell: ({ getValue }) => `$${getValue()}` }
 * ]
 * 
 * <Table data={data} columns={columns} />
 */
export function Table<T>({
  data,
  columns,
  exportToExcel = false,
  filename = "table-data",
  excludeFromView
}: TableProps<T>) {
  const paginationSizeOptions = [10, 25, 50, 100]
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const functionsKWs = [
    "IMAGE",
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: paginationSizeOptions[1]
      }
    }
  })

  const processRowsForExcel = (rowsToProcess: Row<T>[]) => {
    return rowsToProcess.map(row => {
      const rowData: Record<string, unknown> = {}
      table.getVisibleLeafColumns().forEach(column => {
        if (column.id != "actions" && column.columnDef.header) {
          const headerName = String(column.columnDef.header)
          const customFormatter = column.columnDef.meta?.setCellToExport
          let finalValue: unknown

          if (customFormatter) {
            finalValue = customFormatter(row.original)
          } else {
            finalValue = row.getValue(column.id)
          }

          if (typeof finalValue == "string" && finalValue.startsWith("=")) {
            let formulaBody = finalValue.substring(1)

            if (functionsKWs.some(kw => formulaBody.toUpperCase().startsWith(kw + "("))) {
              formulaBody = `_xlfn.${formulaBody}`
            }

            rowData[headerName] = {
              f: formulaBody,
              F: formulaBody
            }
          } else {
            rowData[headerName] = finalValue
          }
        }
      })
      return rowData
    })
  }

  const exportToExcelHandler = () => {
    const isConfigObject = typeof exportToExcel == "object" && exportToExcel != null
    const mainSheetName = isConfigObject ? (exportToExcel.sheetName || "General") : "Sheet1"

    const workbook = XLSX.utils.book_new()

    const mainRows = processRowsForExcel(table.getPreFilteredRowModel().rows)
    const mainWorksheet = XLSX.utils.json_to_sheet(mainRows)
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, mainSheetName.substring(0, 31))

    if (isConfigObject && exportToExcel.sheets) {
      const rawFilteredData = table.getPreFilteredRowModel().rows.map(r => r.original)

      exportToExcel.sheets.forEach(sheetConfig => {
        const extraRows = sheetConfig.getData(rawFilteredData)
        if (extraRows && extraRows.length > 0) {
          const extraWorksheet = XLSX.utils.json_to_sheet(extraRows)
          XLSX.utils.book_append_sheet(
            workbook,
            extraWorksheet,
            sheetConfig.sheetName.substring(0, 31)
          )
        }
      })
    }

    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  const search = (
    <div className="relative flex items-center w-full max-w-xs">
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground/70" />
      <input
        type="text"
        value={globalFilter || ""}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Buscar en la tabla..."
        className="w-full pl-9 pr-4 py-2 text-sm bg-bg/40 border border-muted/50 rounded-lg outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
      />
    </div>
  )
  const exportOptions = (
    <div>
      {!!exportToExcel && (
        <Button 
          variant="ghost"
          noFocusRing
          onClick={exportToExcelHandler}
          className="flex items-center gap-2 border-2 border-[#107C41] text-[#107C41] hover:bg-green-50"
        >
          <Excel className="stroke-[#107C41]" />
        </Button>
      )}
    </div>
  )
  const renderHeader = (header: Header<T, unknown>) => (
    <div
      className={clsx(
        "flex items-center select-none py-1",
        header.column.getCanSort() && "cursor-pointer hover:text-foreground transition-colors"
      )}
      onClick={header.column.getToggleSortingHandler()}
    >
      <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
        {flexRender(
          header.column.columnDef.header,
          header.getContext()
        )}
      </span>
      {{
        asc: <ArrowUpWideNarrow className="h-4 w-4 text-primary" />,
        desc: <ArrowDownWideNarrow className="h-4 w-4 text-primary" />,
      }[header.column.getIsSorted() as string] ?? null}
    </div>
  )
  const pagination = (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-sm text-muted-foreground">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div>
          Mostrando página <span className="font-medium text-foreground">{table.getState().pagination.pageIndex + 1}</span> de <span className="font-medium text-foreground">{table.getPageCount()}</span>
        </div>          
        <div className="flex items-center gap-2">
          <span>Mostrar:</span>
          <SelectField
            name=""
            onChange={value => table.setPageSize(Number(value))}
            selected={table.getState().pagination.pageSize.toString()}
            options={paginationSizeOptions.map(size => ({
              value: size.toString(),
              label: String(size)
            }))}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="p-2 border border-muted/50 rounded-md bg-bg/40 hover:bg-muted/20 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </Button>
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="p-2 border border-muted/50 rounded-md bg-bg/40 hover:bg-muted/20 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-row items-center justify-between gap-4 relative">
        {search}
        {exportOptions}
      </div>
      <div className="w-full overflow-x-auto rounded-xl border border-muted/40 backdrop-blur-md bg-bg/40 shadow-sm relative">
        <table className="w-full text-left border-collapse text-sm">          
          <thead className="border-b border-muted/40">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    className="p-4 align-middle bg-bg font-semibold" 
                  >
                    {!header.isPlaceholder && renderHeader(header)}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-muted/30">
            {table.getRowModel().rows.map(row => !excludeFromView?.(row.original) && (
              <tr 
                key={row.id}
                className="hover:bg-muted/10 transition-colors duration-150 ease-in-out"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-4 align-middle text-foreground/90">
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination}
    </div>
  )
}
