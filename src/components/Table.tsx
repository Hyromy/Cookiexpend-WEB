import { type ReactNode} from "react"

type TableProps<T> = {
  headers?: string[]
  data: T[]
  row: (item: T) => ReactNode[]
}

/**
 * Component for rendering a table with dynamic data and headers. The `headers` prop is optional, and if provided, will render a header row. The `data` prop is an array of items to be displayed in the table, and the `row` prop is a function that takes an item and returns an array of React nodes representing the cells for that row.
 * 
 * @param headers - An optional array of strings representing the column headers for the table.
 * @param data - An array of items to be displayed in the table.
 * @param row - A function that takes an item from the data array and returns an array of React nodes representing the cells for that row.
 * 
 * @example
 * const headers = ["ID", "Name", "Email", "Actions"]
 * const data = [
 *   { id: 1, name: "John Doe", email: "john@example.com" },
 *   { id: 2, name: "Jane Doe", email: "jane@example.com" }
 * ]
 * const row = (item) => {
 *   return [
 *     item.id,
 *     item.name,
 *     item.email,
 *     <>
 *       <button>Edit</button>
 *       <button>Delete</button>
 *     </>
 *   ]
 * }
 * 
 * <Table
 *   headers={headers}
 *   data={data}
 *   row={row}
 * />
 */
export function Table<T>({
  headers,
  data,
  row
}: TableProps<T>) {
  return (
    <table>
      {headers && (
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="border">
                {header}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            {row(item).map((cell, cellIndex) => (
              <td key={cellIndex} className="border">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
