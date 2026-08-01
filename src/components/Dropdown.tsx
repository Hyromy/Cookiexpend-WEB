import React, { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { clsx } from "clsx"

type DropdownAlign = "left" | "right"

type DropdownProps = {
  children: ReactNode
  options: ReactNode[]
  align?: DropdownAlign
}

export default function Dropdown({
  children,
  options,
  align = "left",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const [animate, setAnimate] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let timer: number

    if (isOpen) {
      queueMicrotask(() => setShouldRender(true))
      timer = setTimeout(() => setAnimate(true), 10)
    } else {
      queueMicrotask(() => setAnimate(false))
      timer = setTimeout(() => setShouldRender(false), 300)
    }

    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const alignClasses = {
    left: "left-0 origin-top-left",
    right: "right-0 origin-top-right",
  }

  return (
    <div
      className="relative inline-block text-left"
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 flex flex-row items-center gap-2 cursor-pointer"
      >
        <div className="flex items-center gap-2">{children}</div>
        <ChevronDown
          className={clsx(
            "h-4 w-4 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {shouldRender && (
        <div
          className={clsx(
            "absolute mt-2 w-48 rounded-lg shadow-lg z-50 overflow-hidden border border-muted/50 backdrop-blur-md bg-bg/95 transition-all duration-300 ease-in-out",
            alignClasses[align],
            animate
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 -translate-y-2 scale-95"
          )}
        >
          {options.map((option, index) => (
            <div key={index} className="transition-colors">
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type AccordionDropdownProps = {
  children: ReactNode
  options?: ReactNode[]
}
export function AccordionDropdown({
  children,
  options,
}: AccordionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasOptions = options && options.length > 0

  return (
    <div className="w-full border border-muted rounded-lg overflow-hidden bg-bg shadow-sm">
      <button
        type="button"
        className={clsx(
          "w-full flex justify-between items-center p-4 font-medium transition-colors focus:outline-none",
          hasOptions && "cursor-pointer"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
        {hasOptions && (
          <ChevronDown
            className={clsx(
              "transition-transform duration-300",
              isOpen && "rotate-180"
            )}
          />
        )}
      </button>
      <div
        className={clsx(
          "transition-all duration-300 ease-in-out",
          isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <div
          className={clsx(hasOptions && "border-muted border-t")}
        >
          {React.Children.toArray(options).map((child, index) => (
            <div
              key={index}
              className="m-2"
            >
              {child}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
