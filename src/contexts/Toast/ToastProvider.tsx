import { useState, useCallback, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { ToastContext, type ToastType } from "./ToastContext"
import { ToastItem } from "../../components/Toast"

export type Toast = {
  id: string
  msg: string
  type: ToastType
  duration?: number
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id != id))
  }, [setToasts])
  const addToast = useCallback((msg: string, type: ToastType, duration: number = 5000) => {
    setToasts(prev => [...prev, {
      id: crypto.randomUUID(),
      msg,
      type,
      duration
    }])
  }, [setToasts, removeToast]) 

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-110 flex flex-col-reverse gap-3 w-full max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={removeToast}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
