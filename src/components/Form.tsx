import { useState, type ReactNode, type SyntheticEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "./Button"

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
}: TextFieldProps) {
  const [value, setValue] = useState(defaultValue)
  const [showPassword, setShowPassword] = useState(false)

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    let inputValue = e.currentTarget.value

    if (cleanEmpty) {
      inputValue = inputValue.replace(/^\s+|(?<=\s)\s/g, "")
    }
    if (cleanRegex) {
      inputValue = inputValue.replace(cleanRegex, () => "")
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

type SelectFieldProps = {
  name: string
  options: { value: string, label: string }[]
  placeholder?: string
  selected?: string,
  onChange?: (value: string) => void
}

/**
 * A reusable select component for forms, allowing selection from predefined options.
 * 
 * @param name The name of the select field, used as the key in the form data object
 * @param options An array of options to display in the dropdown, each with a value and label
 * @param placeholder An optional placeholder option that appears when no selection is made
 * @param selected The value of the currently selected option (optional)
 * 
 * @example
 * const options = [
 *   { value: "admin", label: "Admin role" },
 *   { value: "user", label: "User role" },
 * ]
 * <SelectField
 *   name="role"
 *   options={options}
 *   placeholder="Select a role"
 * /> 
 */
export function SelectField({
  name,
  options,
  placeholder,
  selected,
  onChange,
}: SelectFieldProps) {
  return (
    <select
      name={name}
      defaultValue={selected}
      onChange={e => onChange?.(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

type FileFieldProps = {
  name: string
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
  onChange,
  value,
}: FileFieldProps) {
  
  const isUrl = typeof value == "string" && value.trim() != ""
  
  return (
    <div className="flex items-center gap-2">
      <input
        name={name}
        type="file"
        onChange={e => onChange?.(e.target.files?.[0] || null)}
        value={value instanceof File ? undefined : undefined}
      />

      {isUrl && (
        <a
          href={value}
          target="_blank"
        >
          Ver imagen
        </a>
      )}
    </div>
  )
}
