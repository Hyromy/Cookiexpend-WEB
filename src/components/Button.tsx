import { type ReactNode } from "react"
import useTheme from "../hooks/useTheme"
import { Sun, Moon, Pencil, Trash, Image, Check, CircleSlash, Ticket } from "lucide-react"
import { clsx } from "clsx"

type buttonVariant = "primary" | "secondary" | "outline" | "ghost" | "success" | "info" | "danger" | "warning"
type buttonSize = "sm" | "md" | "lg" | "xl"

type ButtonProps = {
  children: ReactNode
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  onClick?: () => void
  className?: string
  variant?: buttonVariant
  size?: buttonSize
  noFocusRing?: boolean
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
  className = "",
  variant = "primary",
  size = "md",
  noFocusRing = false,
}: ButtonProps) {
  const baseStyles = clsx(
    "hover:cursor-pointer inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:scale-100",
    !noFocusRing && "focus:ring-1"
  )

  const variants: Record<buttonVariant, string> = {
    primary: clsx("bg-primary text-primary-fg hover:bg-primary/90 shadow-sm", !noFocusRing && "focus:ring-primary"),
    secondary: clsx("bg-secondary text-secondary-fg hover:bg-secondary/90 shadow-sm", !noFocusRing && "focus:ring-secondary"),
    outline: clsx("border-2 border-muted/50", !noFocusRing && "focus:ring-muted/50"),
    ghost: "bg-transparent",
    success: clsx("bg-success text-success-fg hover:bg-success/90 shadow-sm", !noFocusRing && "focus:ring-success"),
    info: clsx("bg-info text-info-fg hover:bg-info/90 shadow-sm", !noFocusRing && "focus:ring-info"),
    danger: clsx("bg-danger text-danger-fg hover:bg-danger/90 shadow-sm", !noFocusRing && "focus:ring-danger"),
    warning: clsx("bg-warning text-warning-fg hover:bg-warning/90 shadow-sm", !noFocusRing && "focus:ring-warning"),
  }

  const sizes: Record<buttonSize, string> = {
    sm: "text-xs p-1",
    md: "text-sm p-2",
    lg: "text-base p-3",
    xl: "text-lg p-4",
  }

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`.trim()

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={combinedClassName}
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
    <Button
      onClick={toggleTheme}
      variant="outline"
    >
      {
        theme == "dark"
          ? <Moon />
          : <Sun />
      }
    </Button>
  )
}

type ActionButtonProps = {
  variant: buttonVariant
  icon: "pencil" | "trash" | "image" | "check" | "forbidden" | "ticket"
  cb?: () => void
  disabled?: boolean
}
export function ActionButton({
  variant,
  icon,
  cb,
  disabled
}: ActionButtonProps) {
  const getIcon = () => {
    switch (icon) {
      case "pencil": return <Pencil />
      case "trash": return <Trash />
      case "image": return <Image />
      case "check": return <Check />
      case "forbidden": return <CircleSlash />
      case "ticket": return <Ticket />
    }
  }

  return (
    <Button
      variant={variant}
      disabled={disabled}
      onClick={cb}
    >
      {getIcon()}
    </Button>
  )
}
