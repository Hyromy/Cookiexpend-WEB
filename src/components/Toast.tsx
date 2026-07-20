import { useCallback, useEffect, useState } from "react"
import { X, CheckCircle2, AlertTriangle, Info, AlertCircle } from "lucide-react"
import clsx from "clsx"
import { type Toast } from "../contexts/Toast/ToastProvider"
import type { ToastType } from "../contexts/Toast/ToastContext"

const STYLES: Record<ToastType, string> = {
  success: "bg-success/20 border-2 border-success/50",
  error: "bg-danger/20 border-2 border-danger/50",
  info: "bg-info/20 border-2 border-info/50",
  warning: "bg-warning/20 border-2 border-warning/50",
}
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="text-success" />,
  error: <AlertCircle className="text-danger" />,
  info: <Info className="text-info" />,
  warning: <AlertTriangle className="text-warning" />,
}

type ToastItemProps = {
  toast: Toast
  onClose: (id: string) => void
}

export function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const handleClose = useCallback(() => {
    setIsMounted(false)
    
    const timer = setTimeout(() => {
      onClose(toast.id)
    }, 300)

    return () => clearTimeout(timer)
  }, [toast.id, onClose])

  useEffect(() => {
    const autoCloseTimer = setTimeout(() => {
      handleClose()
    }, toast.duration)

    return () => clearTimeout(autoCloseTimer)
  }, [handleClose, toast.duration])

  return (
    <div
      className={clsx(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-xs w-full",
        "transition-all duration-300 ease-in-out transform-gpu",
        STYLES[toast.type],
        isMounted
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-95"
      )}
    >
      <div className="shrink-0 mt-0.5">{ICONS[toast.type]}</div>
      <div className="flex-1 text-sm font-medium">{toast.msg}</div>
      <button
        onClick={handleClose}
        className="p-1 rounded-lg transition-colors opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

