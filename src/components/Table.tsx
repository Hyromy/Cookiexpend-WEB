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
} from "@tanstack/react-table"
import { useState } from "react"
import * as XLSX from "xlsx"
import clsx from "clsx"
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

type TableProps<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  exportToExcel?: boolean
  filename?: string
}

/**
 * Component that renders a table with sorting, filtering, pagination and optional export functionality.
 * 
 * @param data - The data to be loaded in the table.
 * @param columns - The column definitions for the table to display.
 * @param exportToExcel - Whether to show the export to Excel button.
 * @param filename - The filename to use when exporting to Excel.
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
  filename = "table-data"
}: TableProps<T>) {
  const paginationSizeOptions = [10, 25, 50, 100]
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

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

  const exportToExcelHandler = () => {
    const rows = table.getPreFilteredRowModel().rows.map(row => {
      const rowData: Record<string, unknown> = {}
      table.getVisibleLeafColumns().forEach(column => {
        if (column.id != "actions" && column.columnDef.header) {
          rowData[String(column.columnDef.header)] = row.getValue(column.id)
        }
      })
      return rowData
    })

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(rows),
      "Sheet1"
    )
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  const search = (
    <input
      type="text"
      value={globalFilter || ""}
      onChange={e => setGlobalFilter(e.target.value)}
      placeholder="Buscar..."
    />
  )
  const exportOptions = (
    <div>
      {exportToExcel && (
        <button onClick={exportToExcelHandler}>
          excel
        </button>
      )}
    </div>
  )
  const renderHeader = (header: Header<T, unknown>) => (
    <div
      className={clsx(header.column.getCanSort() && "flex items-center gap-2 cursor-pointer")}
      onClick={header.column.getToggleSortingHandler()}
    >
      {flexRender(
        header.column.columnDef.header,
        header.getContext()
      )}
      {{
        asc: <ArrowUpWideNarrow />,
        desc: <ArrowDownWideNarrow />,
      }[header.column.getIsSorted() as string] ?? null}
    </div>
  )
  const pagination = (
    <div className="flex flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-4">
        <div>
          Mostrando página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
        </div>          
        <div className="flex items-center gap-1.5">
          <span>Mostrar:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
          >
            {paginationSizeOptions.map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight />
        </button>
      </div>
    </div>
  )
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between">
        {search}
        {exportOptions}
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead className="uppercase font-semibold">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {!header.isPlaceholder && renderHeader(header)}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
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
