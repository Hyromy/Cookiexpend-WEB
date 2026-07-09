import { useEffect, useRef, useState, type ReactNode } from "react"
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
    if (isOpen) {
      setShouldRender(true)
      const timer = setTimeout(() => setAnimate(true), 10)
      return () => clearTimeout(timer)
    } else {
      setAnimate(false)
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
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
