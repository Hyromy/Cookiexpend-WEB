import { type ReactNode } from "react"
import { clsx } from "clsx"

type CardProps = {
  children: ReactNode,
  className?: string
}
export function Card({
  children,
  className,
}: CardProps) {
  return (
    <div className="flex h-screen items-center justify-center p-2">
      <div className={clsx(
        "w-full max-w-md rounded-2xl bg-card p-8 shadow-xl border border-muted",
        className
      )}>
        {children}
      </div>
    </div>
  )
}
