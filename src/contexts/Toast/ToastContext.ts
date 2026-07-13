import { createContext } from "react"

export type ToastType = "success" | "error" | "info" | "warning"

export type ToastContextType = {
  addToast: (
    msg: string,
    type: ToastType,
    duration?: number
  ) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextType | null>(null)
