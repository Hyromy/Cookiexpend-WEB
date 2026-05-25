import { type ReactNode, type SyntheticEvent } from "react"

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
  type?: string
  placeholder?: string
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
}
/**
 * A reusable text input component for forms, supporting different types and placeholders.
 * 
 * @param name The name of the input field, used as the key in the form data object
 * @param type The type of the input (default: "text")
 * @param placeholder The placeholder text for the input
 * 
 * @example
 * <TextField name="email" placeholder="Email" />
 * <TextField name="password" type="password" placeholder="Password" />
 */
export function TextField({
  name,
  type = "text",
  placeholder,
  onChange,
  ...props
} : TextFieldProps) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      onChange={onChange}
      {...props}
    />
  )
}

type SelectFieldProps = {
  name: string
  options: { value: string, label: string }[]
  placeholder?: string
}

export function SelectField({
  name,
  options,
  placeholder,
}: SelectFieldProps) {
  return (
    <select name={name}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
