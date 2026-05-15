import clsx from "clsx"
import { useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

type OffCanvasProps = {
  isOpen: boolean
  onClose: () => void
  blockMissClick?: boolean
  children: React.ReactNode
  position: "l" | "r"
  title?: string
}
/**
 * A reusable off-canvas component that slides in from the left or right side of the screen, with a backdrop and close button. It handles body scroll locking when open and supports blocking clicks on the backdrop.
 * 
 * @param isOpen Whether the off-canvas is open
 * @param onClose The function to call when the off-canvas should be closed
 * @param blockMissClick Whether to block clicks on the backdrop from closing the off-canvas (default: false)
 * @param children The content to display inside the off-canvas
 * @param position The side from which the off-canvas should slide in ("l" for left, "r" for right)
 * @param title An optional title to display in the off-canvas header
 * 
 * @example
 * const [isOpen, setIsOpen] = useState(false)
 * 
 * <OffCanvas
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   position="r"
 *   title="Menu"
 * >
 *   <p>Off-canvas content goes here</p>
 * </OffCanvas>
 */
export function OffCanvas({
  isOpen,
  onClose,
  blockMissClick = false,
  children,
  position,
  title,
}: OffCanvasProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = "unset"
    return () => { document.body.style.overflow = "unset" }
  }, [isOpen])

  const positions = {
    l: isOpen ? "translate-x-0" : "-translate-x-full",
    r: isOpen ? "translate-x-0" : "translate-x-full",
  }

  return createPortal(
    <>
      <div
        className={
          clsx(
            "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          )
        }
        onClick={() => !blockMissClick && onClose()}
      />
      <aside
        className={
          clsx(
            "fixed top-0 h-full w-full max-w-xs bg-bg shadow-2xl z-51 transform transition-transform duration-300 ease-in-out",
            positions[position],
            position == "l" ? "left-0" : "right-0"
          )
        }
      >
        <div className="flex items-center justify-between p-4 border-b">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button
            className="p-2 rounded-full hover:bg-muted/50 transition-colors"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </aside>
    </>,
    document.body
  )
}
