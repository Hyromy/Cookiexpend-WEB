import { X } from "lucide-react"
import { useEffect, type ReactNode} from "react"
import { createPortal } from "react-dom"
import { Button } from "./Button"
import clsx from "clsx"

type modalSizes = "sm" | "md" | "lg" | "xl" | "xxl"

const SIZES: Record<modalSizes, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  xxl: "max-w-7xl",
}

type ModalProps = {
  children: ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
  blockMissClick?: boolean
  size?: modalSizes
}

/**
 * Modal component that creates a portal to the body element. It also prevents scrolling when open and restores it when closed.
 * 
 * @param children The content of the modal
 * @param isOpen Whether the modal is open or not
 * @param onClose Function to call when the modal is closed
 * @param title Optional title to display at the top of the modal
 * @param blockMissClick If true, clicking outside the modal will not close it
 * @param size The size of the modal (default: "md")
 * 
 * @example
 * const [isOpen, setIsOpen] = useState(false)
 * 
 * const closedBySelf = () => {
 *   alert("Modal closed by itself")
 *   setIsOpen(false)
 * }
 * 
 * <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
 * 
 * <Modal isOpen={isOpen} onClose={closedBySelf} title="My Modal">
 *   <p>This is the content of the modal</p>
 *   <Button onClick={() => setIsOpen(false)}>Close Modal</Button>
 * </Modal>
 */
export function Modal({
  children,
  isOpen,
  onClose,
  title,
  blockMissClick,
  size = "lg",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = "unset"

    return () => { document.body.style.overflow = "unset" }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal (
    <div className="fixed inset-0 z-100 flex items-center justify-center w-full h-full p-4">
      <div
        className="fixed inset-0 bg-black/25 backdrop-blur-xs"
        onClick={() => { if (!blockMissClick) onClose() }}
      />
      <div className={clsx(
        "relative bg-card rounded-xl shadow-2xl overflow-auto border border-muted w-full max-h-full",
        SIZES[size],
      )}>
        <div className="flex items-center justify-between p-4 border-b border-muted">
          {title && (
            <h3 className="text-xl font-bold text-fg">
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 text-fg">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

type DialogProps = ModalProps & {
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel?: () => void
  loading?: boolean
}


/**
 * Modal dialog component that extends the Modal component with confirm and cancel buttons.
 * 
 * @param children The content of the dialog
 * @param isOpen Whether the dialog is open or not
 * @param onClose Function to call when the dialog is closed
 * @param title Optional title to display at the top of the dialog
 * @param blockMissClick If true, clicking outside the dialog will not close it
 * @param confirmText Text to display on the confirm button (default: "Confirmar")
 * @param cancelText Text to display on the cancel button (default: "Cancelar")
 * @param onConfirm Function to call when the confirm button is clicked
 * @param onCancel Function to call when the cancel button is clicked (default: onClose)
 * @param loading If true, the buttons will be disabled and show a loading state
 * 
 * @example
 * const [isOpen, setIsOpen] = useState(false)
 * 
 * <Button onClick={() => setIsOpen(true)}>Open Dialog</Button>
 * 
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={() => alert("Confirmed!")}
 *   onCancel={() => alert("Cancelled!")}
 * >
 *   <p>This is the content of the dialog</p>
 * </Dialog>
 */
export function Dialog({
  children,
  isOpen,
  onClose,
  blockMissClick,
  title,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  loading
}: DialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      blockMissClick={blockMissClick}
      title={title}
    >
      <div className="text-fg">
        {children}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Button
          onClick={onCancel ?? onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
