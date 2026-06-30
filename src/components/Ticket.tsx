import { forwardRef } from "react"
import { type ReactNode } from "react"

type TicketProps = {
  header?: ReactNode
  identifiers?: ReactNode
  body?: ReactNode
  summary?: ReactNode
  footer?: ReactNode
}

export const Ticket = forwardRef<HTMLDivElement, TicketProps>(({
  header,
  identifiers,
  body,
  summary,
  footer
}, ref) => {
  return (
    <div
      ref={ref}
      className="w-[75mm] p-2 font-mono text-[11px] text-black antialiased bg-amber-50"
      style={{ letterSpacing: '-0.1px' }}
    >
      {header && (
        <div className="text-center border-b border-dashed border-muted pb-2 mb-2 space-y-0.5">
          {header}
        </div>
      )}

      {identifiers && (
        <div className="mb-2 text-[10px] space-y-0.5 border-b border-dashed border-muted pb-2">
          {identifiers}
        </div>
      )}

      {body && (
        <div className="mb-2">
          {body}
        </div>
      )}

      {summary && (
        <div className="border-t border-black pt-1 space-y-1">
          {summary}
        </div>
      )}

      {footer && (
        <div className="text-center mt-6 pt-2 border-t border-dashed border-muted text-[9px] space-y-0.5">
          {footer}
        </div>
      )}
    </div>
  )
})
