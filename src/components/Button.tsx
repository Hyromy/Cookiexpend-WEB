import { type ReactNode } from "react"
import useTheme from "../hooks/useTheme"
import { Sun, Moon } from "lucide-react"

type ButtonProps = {
  children: ReactNode
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  onClick?: () => void
  className?: string
}
/**
 * A reusable button component with basic styling and support for different types and states.
 * 
 * @param children The content of the button
 * @param type The type of the button (default: "button")
 * @param disabled Whether the button is disabled (default: false)
 * @param onClick The click handler for the button
 * @param className Additional class names for the button
 * 
 * @example
 * <Button onClick={() => alert("Clicked!")}>Click me</Button>
 * <Button type="submit">Submit</Button>
 * <Button disabled>Disabled</Button>
 */
export function Button({
  children,
  type = "button",
  disabled = false,
  onClick,
  className = ""
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={"border-2 rounded-md p-1 border-primary " + className}
    >
      {children}
    </button>
  )
}

/**
 * A button component that toggles the application's theme between light and dark modes.
 */
export function ThemeButton() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button onClick={toggleTheme}>
      {
        theme == "dark"
          ? <Moon />
          : <Sun />
      }
    </Button>
  )
}
