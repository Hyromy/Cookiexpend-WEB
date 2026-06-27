import { type ComponentProps } from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

import { Button, ThemeButton } from "../components/Button"
import { Form, TextField } from "../components/Form"
import { OffCanvas } from "../components/OffCanvas"
import { LoadingState, ErrorState, EmptyState, StateGate } from "../components/State"
import useTheme from "../hooks/useTheme"
import { ApiError } from "../services/api"

vi.mock("../hooks/useTheme", () => ({
  default: vi.fn(),
}))

vi.mock("lucide-react", () => ({
  Sun: () => <span data-testid="sun-icon" />,
  Moon: () => <span data-testid="moon-icon" />,
  X: () => <span data-testid="close-icon" />,
}))

const useThemeMock = vi.mocked(useTheme)

describe("Button.tsx", () => {
  describe("Button", () => {
    it("renders defaults and handles click", () => {
      const onClick = vi.fn()
      render(
        <Button onClick={onClick}>Click</Button>
      )
      
      const button = screen.getByRole("button", { name: "Click" })
      expect(button).toHaveAttribute("type", "button")
      expect(button).not.toBeDisabled()
      
      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)
    })
    
    it("respects disabled state and className", () => {
      render(
        <Button disabled className="extra">Disabled</Button>
      )
      
      const button = screen.getByRole("button", { name: "Disabled" })
      expect(button).toBeDisabled()
      expect(button.className).toContain("extra")
    })
  })
  
  describe("ThemeButton", () => {
    beforeEach(() => {
      useThemeMock.mockReset()
    })
    
    it("shows moon icon for dark theme and toggles", () => {
      const toggleTheme = vi.fn()
      useThemeMock.mockReturnValue({ theme: "dark", toggleTheme })
      
      render(<ThemeButton />)
      
      expect(screen.getByTestId("moon-icon")).toBeInTheDocument()
      
      fireEvent.click(screen.getByRole("button"))
      expect(toggleTheme).toHaveBeenCalledTimes(1)
    })
    
    it("shows sun icon for light theme", () => {
      useThemeMock.mockReturnValue({ theme: "light", toggleTheme: vi.fn() })
      
      render(<ThemeButton />)
      expect(screen.getByTestId("sun-icon")).toBeInTheDocument()
    })
  })
})

describe("Form.tsx", () => {
  describe("Form", () => {
    it("collects form data and calls onSubmit", () => {
      const onSubmit = vi.fn()
      const { container } = render(
        <Form<{ email: string }> onSubmit={onSubmit}>
          <input name="email" defaultValue="hello@cookiexpend.com" />
          <input name="password" defaultValue="secret" />
        </Form>
      )
      
      const form = container.querySelector("form") as HTMLFormElement
      fireEvent.submit(form)
      
      expect(onSubmit).toHaveBeenCalledWith({
        email: "hello@cookiexpend.com",
        password: "secret",
      })
    })
    
    it("handles empty submissions", () => {
      const onSubmit = vi.fn()
      const { container } = render(
        <Form<Record<string, string>> onSubmit={onSubmit}>
          <div />
        </Form>
      )
      
      const form = container.querySelector("form") as HTMLFormElement
      fireEvent.submit(form)
      
      expect(onSubmit).toHaveBeenCalledWith({})
    })
  })
  
  describe("TextField", () => {
    it("renders default type and placeholder", () => {
      render(
        <TextField name="title" placeholder="Titulo" />
      )
      
      const input = screen.getByPlaceholderText("Titulo") as HTMLInputElement
      expect(input.name).toBe("title")
      expect(input.type).toBe("text")
    })
    
    it("renders custom input type", () => {
      render(
        <TextField name="password" type="password" placeholder="Clave" />
      )
      
      const input = screen.getByPlaceholderText("Clave") as HTMLInputElement
      expect(input.type).toBe("password")
    })
  })
})

describe("OffCanvas.tsx", () => {
  const renderOffCanvas = (props: Partial<ComponentProps<typeof OffCanvas>> = {}) => {
    const onClose = vi.fn()
    const result = render(
      <OffCanvas
        isOpen={true}
        onClose={onClose}
        position="l"
        title="Panel"
        {...props}
      >
        <div>Contenido</div>
      </OffCanvas>
    )

    return { onClose, ...result }
  }

  it("renders in a portal and controls body overflow", () => {
    const { rerender, unmount } = renderOffCanvas()

    expect(document.body.style.overflow).toBe("hidden")
    expect(screen.getByText("Contenido")).toBeInTheDocument()

    rerender(
      <OffCanvas isOpen={false} onClose={vi.fn()} position="l">
        <div>Contenido</div>
      </OffCanvas>
    )

    expect(document.body.style.overflow).toBe("unset")

    unmount()
    expect(document.body.style.overflow).toBe("unset")
  })

  it("closes on overlay click unless blocked", () => {
    const first = renderOffCanvas()
    const overlay = document.body.querySelector("div[class*='backdrop-blur']") as HTMLDivElement

    fireEvent.click(overlay)
    expect(first.onClose).toHaveBeenCalledTimes(1)
    first.unmount()

    const second = renderOffCanvas({ blockMissClick: true })
    const overlayBlocked = document.body.querySelector("div[class*='backdrop-blur']") as HTMLDivElement
    fireEvent.click(overlayBlocked)
    expect(second.onClose).not.toHaveBeenCalled()
  })

  it("applies position classes for left and right", () => {
    const left = renderOffCanvas({ isOpen: false, position: "l" })
    const leftPanel = document.body.querySelector("aside") as HTMLElement
    expect(leftPanel.className).toContain("-translate-x-full")
    expect(leftPanel.className).toContain("left-0")
    left.unmount()

    const right = renderOffCanvas({ isOpen: false, position: "r" })
    const rightPanel = document.body.querySelector("aside") as HTMLElement
    expect(rightPanel.className).toContain("translate-x-full")
    expect(rightPanel.className).toContain("right-0")
    right.unmount()
  })

  it("invokes onClose from the close button", () => {
    const { onClose } = renderOffCanvas()
    fireEvent.click(screen.getByRole("button"))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe("State.tsx", () => {
  describe("LoadingState", () => {
    it("renders default title and message", () => {
      render(<LoadingState />)

      expect(screen.getByText("Cargando")).toBeInTheDocument()
      expect(screen.getByText("Por favor, espere...")).toBeInTheDocument()
      expect(screen.getByLabelText("Cargando")).toBeInTheDocument()
    })
  })

  describe("ErrorState", () => {
    it("renders defaults without retry button", () => {
      render(<ErrorState />)

      expect(screen.getByText("Ocurrió un error")).toBeInTheDocument()
      expect(screen.getByText("No se pudieron cargar los datos.")).toBeInTheDocument()
      expect(screen.queryByRole("button")).toBeNull()
    })

    it("renders retry button when onRetry is provided", () => {
      const onRetry = vi.fn()
      render(<ErrorState onRetry={onRetry} retryLabel="Intentar" />)

      const button = screen.getByRole("button", { name: "Intentar" })
      fireEvent.click(button)
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe("EmptyState", () => {
    it("renders title, default message, and custom content", () => {
      render(
        <EmptyState
          title="Sin datos"
          content={<span data-testid="empty-content">Extra</span>}
        />
      )

      expect(screen.getByText("Sin datos")).toBeInTheDocument()
      expect(screen.getByText("No se encontraron resultados para mostrar.")).toBeInTheDocument()
      expect(screen.getByTestId("empty-content")).toBeInTheDocument()
    })
  })

  describe("StateGate", () => {
    it("shows loading state when loading is true", () => {
      render(
        <StateGate loading={true} error={null} data={null}>
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByLabelText("Cargando")).toBeInTheDocument()
    })

    it("shows error state and logs when error exists", () => {
      const onRetry = vi.fn()
      const error = new ApiError("Boom")

      render(
        <StateGate
          loading={false}
          error={error}
          data={null}
          errorProps={{ onRetry }}
        >
          <span>Contenido</span>
        </StateGate>
      )
    
      expect(screen.getByText("Ocurrió un error")).toBeInTheDocument()
    
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("uses custom loading, error, and empty props", () => {
      const onRetry = vi.fn()
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
      const { rerender } = render(
        <StateGate
          loading={true}
          error={null}
          data={null}
          loadingProps={{ title: "Cargando custom", message: "Espera" }}
        >
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByText("Cargando custom")).toBeInTheDocument()
      expect(screen.getByText("Espera")).toBeInTheDocument()

      rerender(
        <StateGate
          loading={false}
          error={new Error("Fail")}
          data={null}
          errorProps={{ title: "Fallo", retryLabel: "Intentar", onRetry }}
        >
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByText("Fallo")).toBeInTheDocument()
      fireEvent.click(screen.getByRole("button", { name: "Intentar" }))
      expect(onRetry).toHaveBeenCalledTimes(1)

      rerender(
        <StateGate
          loading={false}
          error={null}
          data={null}
          emptyProps={{ title: "Sin datos" }}
        >
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByText("Sin datos")).toBeInTheDocument()
      errorSpy.mockRestore()
    })

    it("shows empty state for empty values", () => {
      const { rerender } = render(
        <StateGate loading={false} error={null} data={null}>
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByText("No se encontraron resultados para mostrar.")).toBeInTheDocument()

      rerender(
        <StateGate loading={false} error={null} data={[]}>
          <span>Contenido</span>
        </StateGate>
      )
      expect(screen.getByText("No se encontraron resultados para mostrar.")).toBeInTheDocument()

      rerender(
        <StateGate loading={false} error={null} data={{}}>
          <span>Contenido</span>
        </StateGate>
      )
      expect(screen.getByText("No se encontraron resultados para mostrar.")).toBeInTheDocument()

      rerender(
        <StateGate loading={false} error={null} data="   ">
          <span>Contenido</span>
        </StateGate>
      )
      expect(screen.getByText("No se encontraron resultados para mostrar.")).toBeInTheDocument()
    })

    it("renders children for non-empty values", () => {
      const { rerender } = render(
        <StateGate loading={false} error={null} data={0}>
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByText("Contenido")).toBeInTheDocument()

      rerender(
        <StateGate loading={false} error={null} data={false}>
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByText("Contenido")).toBeInTheDocument()

      rerender(
        <StateGate loading={false} error={null} data={["item"]}>
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByText("Contenido")).toBeInTheDocument()

      rerender(
        <StateGate loading={false} error={null} data={{ value: 1 }}>
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByText("Contenido")).toBeInTheDocument()

      rerender(
        <StateGate loading={false} error={null} data="ok">
          <span>Contenido</span>
        </StateGate>
      )

      expect(screen.getByText("Contenido")).toBeInTheDocument()
    })
  })
})
