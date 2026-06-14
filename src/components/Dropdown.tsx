import { useEffect, useRef, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

type DropdownProps = {
  children: ReactNode
  options: ReactNode[]
}
export default function Dropdown({
  children,
  options,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      className={"relative inline-block text-left"}
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 flex flex-row gap-2"
      >
        <div className="flex items-center gap-2">
          {children}
        </div>
        <ChevronDown />
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 border rounded shadow-lg">
          {options.map((option, index) => (
            <div key={index}>
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
