import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
  type ChangeEvent,
} from "react"
import {
  Eye,
  EyeOff,
  ChevronDown,
  Upload,
  Download,
  X,
} from "lucide-react"
import { Button } from "./Button"
import { clsx } from "clsx"

type FormProps<T> = {
  children: ReactNode
  onSubmit: (data: T) => void
  className?: string
}
/**
 * A reusable form component that handles form submission and data extraction.
 * 
 * @param children The form fields and content
 * @param onSubmit The callback function to handle form submission, receiving the form data as an object
 * 
 * @example
 * const onSubmitHandler = (data) => {
 *  console.log(data) // { username: ..., password: ... }
 * }
 * 
 * <Form onSubmit={onSubmitHandler}>
 *   <TextField name="username" placeholder="Username" />
 *   <TextField name="password" type="password" placeholder="Password" />
 *   <Button type="submit">Submit</Button>
 * </Form>
 */
export function Form<T>({
  children,
  onSubmit,
  className
}: FormProps<T>) {
  const handleSubmit = (e: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries()) as T
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      {children}
    </form>
  )
}

type TextFieldProps = {
  name: string
  type?: "text" | "password"
  label?: string
  required?: boolean
  placeholder?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  defaultValue?: string | number
  cleanRegex?: RegExp
  cleanEmpty?: boolean
  readonly?: boolean
  disabled?: boolean
  maxLen?: number
}
/**
 * A reusable text input component for forms, supporting different types and placeholders.
 * 
 * @param name The name of the input field, used as the key in the form data object
 * @param type The type of the input field (e.g., "text", "password", "email")
 * @param label An optional label for the input field
 * @param required Whether the input field is required (default: false)
 * @param placeholder An optional placeholder text for the input field
 * @param onChange A callback function that receives the change event when the input value changes
 * @param defaultValue The initial value of the input field (default: "")
 * @param cleanRegex An optional regular expression to clean the input value before updating the state
 * @param cleanEmpty Whether to remove leading and trailing whitespace from the input value (default: false)
 * @param readonly Whether the input field is read-only (default: false)
 * @param disabled Whether the input field is disabled (default: false)
 * @param maxLen An optional maximum length for the input value
 * 
 * @example
 * <TextField name="email" placeholder="Email" />
 * <TextField name="password" type="password" placeholder="Password" />
 */
export function TextField({
  name,
  label,
  type = "text",
  placeholder,
  onChange,
  defaultValue = "",
  required = false,
  cleanRegex,
  cleanEmpty = false,
  readonly = false,
  disabled = false,
  maxLen,
}: TextFieldProps) {
  const [value, setValue] = useState(defaultValue)
  const [showPassword, setShowPassword] = useState(false)
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue)

  if (defaultValue != prevDefaultValue) {
    setPrevDefaultValue(defaultValue)
    setValue(defaultValue)
  }

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    let inputValue = e.currentTarget.value

    if (cleanEmpty) {
      inputValue = inputValue.replace(/^\s+|(?<=\s)\s/g, "")
    }
    if (cleanRegex) {
      inputValue = inputValue.replace(cleanRegex, () => "")
    }
    if (maxLen && inputValue.length > maxLen) {
      inputValue = inputValue.slice(0, maxLen)
    }

    setValue(inputValue)

    if (onChange) {
      e.currentTarget.value = inputValue
      onChange(e as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const inputType = type == "password" ? (showPassword ? "text" : "password") : type

  const inputContent = (
    <div
      className="flex items-center rounded-md px-2 outline-1 -outline-offset-1 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-primary transition-all duration-50"
    >
      <input
        name={name}
        className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base focus:outline-none sm:text-sm/6"
        type={inputType}
        placeholder={placeholder}
        value={value}
        onInput={handleInput}
        readOnly={readonly}
        disabled={disabled}
      />
      {type == "password" && (
        <Button
          noFocusRing
          variant="ghost"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="flex items-center justify-center p-1 transition-colors hover:cursor-pointer"
        >
          {showPassword ? <EyeOff /> : <Eye />}
        </Button>
      )}
    </div>
  )

  const labelContent = (
    <label htmlFor={name} className="block text-sm/6 font-medium">
      {required && <strong className="text-red-500 mr-1">*</strong>}
      {label}
    </label>
  )

  return !label ? inputContent : (
    <>
      {labelContent}
      {inputContent}
    </>
  )
}

export type SelectFieldProps = {
  name: string
  options: {
    value: string
    label: string,
    disabled?: boolean
  }[]
  placeholder?: string
  selected?: string
  label?: string
  required?: boolean
  disabled?: boolean
  onChange?: (value: string) => void
}

/**
 * A reusable select component for forms, allowing selection from predefined options.
 * * @example
 * const options = [
 *   { value: "admin", label: "Admin role" },
 *   { value: "user", label: "User role" },
 * ]
 * 
 * <SelectField
 *   name="role"
 *   label="Role"
 *   options={options}
 *   placeholder="Select a role"
 *   required
 * /> 
 */
export function SelectField({
  name,
  options,
  placeholder,
  selected,
  label,
  required = false,
  disabled = false,
  onChange,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState(selected || "")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (val: string, optDisabled?: boolean) => {
    if (optDisabled) return
    setValue(val)
    setIsOpen(false)
    onChange?.(val)
  }

  const labelContent = label && (
    <label className="block text-sm/6 font-medium mb-1">
      {required && <strong className="text-red-500 mr-1">*</strong>}
      {label}
    </label>
  )

  const selectedOption = options.find(opt => opt.value == value)

  return (
    <div className="w-full" ref={containerRef}>
      <input type="hidden" name={name} value={value} required={required} />
      {labelContent}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={clsx(
            "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-base sm:text-sm/6 outline-1 -outline-offset-1 transition-all duration-150 text-left outline-gray-300",
            isOpen ? "outline-2 -outline-offset-2 outline-primary" : "focus:outline-2 focus:-outline-offset-2 focus:outline-primary",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          )}
        >
          <span className={clsx(!selectedOption && "opacity-10")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={clsx(
              "size-4 opacity-60 transition-transform duration-300 ml-2",
              isOpen && "rotate-180"
            )}
          />
        </button>

        <ul 
          className={clsx(
            "absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-md p-1 text-base sm:text-sm/6 shadow-xl focus:outline-none",
            "bg-initial/75 backdrop-blur-2xl transition-all duration-300 ease-out origin-top outline outline-neutral-500/30",
            isOpen
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none -translate-y-1"
          )}
        >
          {placeholder && (
            <li
              onClick={() => handleSelect("")}
              className="relative cursor-pointer select-none py-1.5 px-3 rounded-sm opacity-50 hover:bg-neutral-500/10 transition-colors"
            >
              {placeholder}
            </li>
          )}
          {options.map((option) => {
            const isSelected = value == option.value
            return (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value, option.disabled)}
                className={clsx(
                  "relative select-none py-1.5 px-3 rounded-sm transition-colors",
                  option.disabled
                    ? "opacity-40 cursor-not-allowed bg-neutral-500/5"
                    : "cursor-pointer hover:bg-neutral-500/10",
                  isSelected && "bg-primary text-white! font-medium"
                )} 
              >
                {option.label}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

type FileFieldProps = {
  name: string
  label?: string
  required?: boolean
  disabled?: boolean
  onChange?: (file: File | null) => void
  value?: File | string | null
}

/**
 * A reusable file input component for forms.
 * 
 * @param name The name of the file input field, used as the key in the form data object
 * @param onChange A callback function that receives the selected file or null if no file is selected
 * @param defaultValue The initial value of the file input field, which can be a File object, a string (file path), or null
 * 
 * @example
 * <FileField
 *   name="profilePicture"
 *   onChange={(file) => console.log(file)}
 * />
 */
export function FileField({
  name,
  label,
  required = false,
  disabled = false,
  onChange,
  value,
}: FileFieldProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const isUrl = typeof value == "string" && value.trim() != ""

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFileName(file ? file.name : null)
    onChange?.(file)
  }

  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm/6 font-medium">
          {required && <strong className="text-red-500 mr-1">*</strong>}
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <label
          className={clsx(
            "flex grow items-center gap-2 rounded-md px-3 py-1.5 text-base sm:text-sm/6 outline-1 -outline-offset-1 transition-all duration-50 bg-initial",
            "has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-primary",
            disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:bg-neutral-500/5"
          )}
        >
          <input
            name={name}
            type="file"
            required={required && !isUrl}
            disabled={disabled}
            onChange={handleFileChange}
            className="sr-only"
          />
          <Upload className="size-4 shrink-0 opacity-60 text-primary" />
          <span className="truncate opacity-80 grow">
            {fileName ? fileName : isUrl ? "Cambiar archivo actual..." : "Seleccionar archivo..."}
          </span>
        </label>
        {isUrl && (
          <a
            href={value as string}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-base sm:text-sm/6 outline-1 -outline-offset-1 hover:bg-neutral-500/5 font-medium transition-colors duration-150 h-full shrink-0"
            title="Descargar archivo actual"
          >
            <Download className="p-1 text-primary opacity-60" />
          </a>
        )}
      </div>
    </div>
  )
}

type TextAreaFieldProps = {
  name: string
  label?: string
  required?: boolean
  placeholder?: string
  defaultValue?: string
  maxLen?: number
  rows?: number
  disabled?: boolean
}

/**
 * A reusable multiline text input component for forms.
 *
 * @example
 * <TextAreaField name="description" label="Descripción" maxLen={500} />
 */
export function TextAreaField({
  name,
  label,
  required = false,
  placeholder,
  defaultValue = "",
  maxLen,
  rows = 3,
  disabled = false,
}: TextAreaFieldProps) {
  const [value, setValue] = useState(defaultValue)

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    let inputValue = e.currentTarget.value
    if (maxLen && inputValue.length > maxLen) {
      inputValue = inputValue.slice(0, maxLen)
    }
    setValue(inputValue)
  }

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="block text-sm/6 font-medium mb-1">
          {required && <strong className="text-red-500 mr-1">*</strong>}
          {label}
        </label>
      )}
      <div className="flex items-center rounded-md px-2 outline-1 -outline-offset-1 has-[textarea:focus-within]:outline-2 has-[textarea:focus-within]:-outline-offset-2 has-[textarea:focus-within]:outline-primary transition-all duration-50">
        <textarea
          name={name}
          rows={rows}
          className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base focus:outline-none sm:text-sm/6 resize-none"
          placeholder={placeholder}
          value={value}
          onInput={handleInput}
          required={required}
          disabled={disabled}
        />
      </div>
      {maxLen && (
        <span className="block text-right text-xs opacity-50 mt-0.5">
          {value.length}/{maxLen}
        </span>
      )}
    </div>
  )
}

type MultiSelectFieldProps = {
  label?: string
  placeholder?: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
}

/**
 * A reusable searchable multi-select component. Unlike TextField/SelectField this
 * component is fully controlled and does not render a named form input, since native
 * forms collapse repeated field names into a single value — pass the selection up via
 * `onChange` and attach it to the submitted payload manually.
 *
 * @example
 * const [variantIds, setVariantIds] = useState<string[]>([])
 * <MultiSelectField
 *   label="Variantes"
 *   options={products.map(p => ({ value: String(p.id), label: p.name }))}
 *   selected={variantIds}
 *   onChange={setVariantIds}
 * />
 */
export function MultiSelectField({
  label,
  placeholder = "Buscar...",
  options,
  selected,
  onChange,
  disabled = false,
}: MultiSelectFieldProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOptions = options.filter(opt => selected.includes(opt.value))
  const availableOptions = options.filter(opt => (
    !selected.includes(opt.value)
    && opt.label.toLowerCase().includes(query.toLowerCase())
  ))

  const add = (value: string) => {
    onChange([...selected, value])
    setQuery("")
  }
  const remove = (value: string) => {
    onChange(selected.filter(v => v != value))
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm/6 font-medium mb-1">
          {label}
        </label>
      )}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {selectedOptions.map(opt => (
            <span
              key={opt.value}
              className="flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2.5 py-1 text-xs font-medium"
            >
              {opt.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(opt.value)}
                  className="hover:cursor-pointer hover:opacity-70"
                  aria-label={`Quitar ${opt.label}`}
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        disabled={disabled}
        value={query}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onInput={(e) => { setQuery(e.currentTarget.value); setIsOpen(true) }}
        placeholder={placeholder}
        className={clsx(
          "block w-full rounded-md px-3 py-1.5 text-base sm:text-sm/6 outline-1 -outline-offset-1 outline-gray-300 transition-all duration-150",
          isOpen ? "outline-2 -outline-offset-2 outline-primary" : "focus:outline-2 focus:-outline-offset-2 focus:outline-primary",
          disabled && "cursor-not-allowed opacity-50"
        )}
      />
      {/*
        Deliberately NOT `position: absolute` — an overlaid dropdown can float on
        top of whatever sits below it in the form (e.g. the submit button), making
        it unclickable. Growing in normal flow instead means an open dropdown only
        ever pushes later content down, so it can never cover it.
      */}
      <ul
        className={clsx(
          "w-full overflow-auto rounded-md text-base sm:text-sm/6 focus:outline-none",
          "bg-initial/75 backdrop-blur-2xl transition-all duration-200 ease-out outline-neutral-500/30",
          isOpen && availableOptions.length > 0
            ? "max-h-40 mt-1.5 p-1 opacity-100 outline shadow-xl"
            : "max-h-0 opacity-0"
        )}
      >
        {availableOptions.map(opt => (
          <li
            key={opt.value}
            // onMouseDown (not onClick) fires before the input's onBlur, and
            // preventDefault stops that blur entirely so selecting an option
            // doesn't close the dropdown — only a click truly outside it does.
            onMouseDown={(e) => { e.preventDefault(); add(opt.value) }}
            className="relative cursor-pointer select-none py-1.5 px-3 rounded-sm hover:bg-neutral-500/10 transition-colors"
          >
            {opt.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
