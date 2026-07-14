import type { ReactNode } from "react"
import { Button } from "./Button"

type StateContainer = {
  title?: string
  message?: string
  content?: ReactNode
}
/**
 * A reusable component for displaying different states (loading, error, empty) with a consistent layout.
 * 
 * @param title The title of the state (e.g., "Loading", "Error", "No results")
 * @param message A descriptive message providing more details about the state
 * @param content Optional additional content, such as a loading spinner or a retry button
 */
function StateContainer({
  title,
  message,
  content,
}: StateContainer) {
  return (
    <div className="flex flex-col flex-1 h-full my-auto justify-center items-center text-center">
      {title && <h3 className="text-xl font-semibold text-fg">{title}</h3>}
      {message && <p className="mt-2 text-muted">{message}</p>}
      {content && <div className="mt-4 flex justify-center">{content}</div>}
    </div>
  )
}

type LoadingStateProps = {
  title?: string
  message?: string
}
/**
 * A component for displaying a loading state with an optional title and message, along with a spinner animation.
 * 
 * @param title The title to display above the loading spinner (default: "Cargando")
 * @param message The message to display below the title (default: "Por favor, espere...")
 */
export function LoadingState({
  title = "Cargando",
  message = "Por favor, espere...",
}: LoadingStateProps) {
  return (
    <StateContainer
      title={title}
      message={message}
      content={
        <span
          aria-label="Cargando"
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
        />
      }
    />
  )
}

type ErrorStateProps = {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
}
/**
 * A component for displaying an error state with an optional title, message, and a retry button that triggers a provided callback function.
 * 
 * @param title The title to display above the error message (default: "Ocurrió un error")
 * @param message The error message to display below the title (default: "No se pudieron cargar los datos.")
 * @param onRetry An optional callback function to be called when the retry button is clicked
 * @param retryLabel The label for the retry button (default: "Reintentar")
 */
export function ErrorState({
  title = "Ocurrió un error",
  message = "No se pudieron cargar los datos.",
  onRetry,
  retryLabel = "Reintentar",
}: ErrorStateProps) {
  return (
    <StateContainer
      title={title}
      message={message}
      content={
        onRetry && (
          <Button onClick={onRetry}>
            {retryLabel}
          </Button>
        )
      }
    />
  )
}

/**
 * A component for displaying an empty state with an optional title, message, and additional content. This can be used when there are no results to show or when a search returns no matches.
 * 
 * @param title The title to display above the message (e.g., "No se encontraron resultados")
 * @param message The message to display below the title (default: "No se encontraron resultados para mostrar.")
 * @param content Optional additional content to display, such as suggestions or a call to action
 */
export function EmptyState({
  title,
  message = "No se encontraron resultados para mostrar.",
  content,
}: StateContainer) {
  return (
    <StateContainer
      title={title}
      message={message}
      content={content}
    />
  )
}

type StateGateProps = {
  loading: boolean
  error: unknown | null
  data: unknown | null
  
  children: ReactNode

  loadingProps?: LoadingStateProps
  errorProps?: ErrorStateProps
  emptyProps?: StateContainer
}
/**
 * A higher-order component that acts as a gatekeeper for rendering content based on the loading, error, and empty states of data fetching operations. It uses the LoadingState, ErrorState, and EmptyState components to display appropriate feedback to the user while data is being fetched or if an error occurs.
 * 
 * @param loading A boolean indicating whether the data is currently being loaded
 * @param error An Error object if an error occurred during data fetching, or null if there is no error
 * @param data The data that was fetched, which can be of any type. The component will check if this data is empty to determine whether to show the EmptyState.
 * 
 * @param children The content to render if the data is successfully loaded and is not empty
 * 
 * @param loadingProps Optional props to customize the LoadingState component
 * @param errorProps Optional props to customize the ErrorState component
 * @param emptyProps Optional props to customize the EmptyState component
 * 
 * @example
 * <StateGate
 *   loading={isLoading}
 *   error={error}
 *   data={data}
 *   loadingProps={{ title: "Cargando productos..." }}
 *   errorProps={{ title: "Error al cargar productos", onRetry: fetchProducts }}
 *   emptyProps={{ title: "No hay productos", message: "No se encontraron productos para mostrar." }}
 * >
 *   <pre>
 *     {JSON.stringify(data, null, 4)}
 *   </pre> 
 * </StateGate>
 */
export function StateGate({
  loading,
  error,
  data,
  children,
  loadingProps,
  errorProps,
  emptyProps,
}: StateGateProps) {
  if (loading) {
    return <LoadingState {...loadingProps} />
  }

  if (error) {
    return <ErrorState {...errorProps} />
  }

  const isEmpty = (val: unknown) => {
    if (val == null ) return true
    if (Array.isArray(val)) return val.length == 0
    if (typeof val == "object") return Object.keys(val).length == 0
    if (typeof val == "string") return val.trim().length == 0
    return false
  }

  if (isEmpty(data)) {
    return <EmptyState {...emptyProps} />
  }

  return children
}
