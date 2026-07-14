import { type ReactNode, type SetStateAction } from "react"
import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import useApi from "../hooks/useApi"
import useEvent, { onAdd, onUpdate, onDelete } from "../hooks/useEvent"
import useAuth from "../hooks/useAuth"
import useSidebar from "../hooks/useSidebar"
import useTheme from "../hooks/useTheme"
import { AuthProvider } from "../contexts/Auth/AuthProvider"
import { SidebarProvider } from "../contexts/Sidebar/SidebarProvider"
import { ThemeProvider } from "../contexts/Theme/ThemeProvider"

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const createAbortable = () => {
  let aborted = false
  const apiCall = (signal: AbortSignal) => new Promise<string>((_, reject) => {
    const onAbort = () => {
      aborted = true
      reject(new DOMException("Aborted", "AbortError"))
    }

    if (signal.aborted) {
      onAbort()
      return
    }

    signal.addEventListener("abort", onAbort, { once: true })
  })

  return {
    apiCall,
    wasAborted: () => aborted,
  }
}


type EventSourceOptions = { withCredentials?: boolean }

class FakeEventSource {
  static instances: FakeEventSource[] = []
  url: string
  options?: EventSourceOptions
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((err: unknown) => void) | null = null
  close = vi.fn()

  constructor(url: string, options?: EventSourceOptions) {
    this.url = url
    this.options = options
    FakeEventSource.instances.push(this)
  }

  emitMessage(data: string) {
    this.onmessage?.({ data } as MessageEvent)
  }

  emitError(err: unknown) {
    this.onerror?.(err)
  }
}

const originalEventSource = globalThis.EventSource

beforeEach(() => {
  FakeEventSource.instances = []
  globalThis.EventSource = FakeEventSource as unknown as typeof EventSource
})

afterEach(() => {
  globalThis.EventSource = originalEventSource
  document.documentElement.className = ""
  localStorage.clear()
})

describe("useApi.tsx", () => {
  describe("useApi", () => {
    it("returns initial state", () => {
      const { result } = renderHook(() => useApi())

      expect(result.current.data).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it("resolves a single request and updates state", async () => {
      const deferred = createDeferred<string>()
      const { result } = renderHook(() => useApi<string>())

      act(() => {
        void result.current.request(deferred.promise)
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      await act(async () => {
        deferred.resolve("ok")
        await deferred.promise
      })

      await waitFor(() => {
        expect(result.current.data).toBe("ok")
      })

      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it("passes AbortSignal to function sources", async () => {
      const handler = vi.fn((signal: AbortSignal) => (
        Promise.resolve(signal.aborted ? "aborted" : "ok")
      ))
      const { result } = renderHook(() => useApi<string>())

      await act(async () => {
        await result.current.request(handler)
      })

      expect(handler).toHaveBeenCalledTimes(1)
      const signal = handler.mock.calls[0][0]
      expect(signal).toBeInstanceOf(AbortSignal)
    })

    it("returns null when no calls are provided", async () => {
      const { result } = renderHook(() => useApi())
      let response: unknown = "not-null"

      await act(async () => {
        response = await result.current.request()
      })

      expect(response).toBeNull()
      expect(result.current.data).toBeNull()
    })

    it("captures errors for rejected requests", async () => {
      const { result } = renderHook(() => useApi())

      await act(async () => {
        await result.current.request(
          Promise.reject(new Error("Unknown error occurred"))
        ).catch(() => {}) 
      })
    
      await waitFor(() => {
        expect(result.current.error?.message).toBe("Unknown error occurred")
      })

      expect(result.current.data).toBeNull()
    })

    it("keeps the latest request result", async () => {
      const first = createDeferred<string>()
      const second = createDeferred<string>()
      const { result } = renderHook(() => useApi<string>())

      act(() => {
        void result.current.request(first.promise)
        void result.current.request(second.promise)
      })

      await act(async () => {
        second.resolve("second")
        await second.promise
      })

      await act(async () => {
        first.resolve("first")
        await first.promise
      })

      await waitFor(() => {
        expect(result.current.data).toBe("second")
      })
    })

    it("returns array results for multiple calls", async () => {
      const { result } = renderHook(() => useApi())
      let response: unknown = null

      await act(async () => {
        response = await result.current.request(
          Promise.resolve("first"),
          Promise.resolve(2)
        )
      })

      expect(response).toEqual(["first", 2])
      await waitFor(() => {
        expect(result.current.data).toEqual(["first", 2])
      })
    })
  })

  describe("useApi (abort options)", () => {
    it("aborts previous request when enabled", async () => {
      const { result } = renderHook(() => useApi({ abortPrevious: true }))
      const abortable = createAbortable()
      let firstPromise!: Promise<unknown>
      let secondPromise!: Promise<unknown>

      await act(async () => {
        firstPromise = result.current.request(abortable.apiCall)
        secondPromise = result.current.request(Promise.resolve("ok"))
      })

      const [first, second] = await Promise.all([firstPromise, secondPromise])
      expect(first).toBeNull()
      expect(second).toBe("ok")
      expect(abortable.wasAborted()).toBe(true)
    })

    it("aborts on unmount when enabled", async () => {
      const { result, unmount } = renderHook(() => useApi({ abortOnUnmount: true }))
      const abortable = createAbortable()
      let promise!: Promise<unknown>

      await act(async () => {
        promise = result.current.request(abortable.apiCall)
      })

      unmount()

      const response = await promise
      expect(response).toBeNull()
      expect(abortable.wasAborted()).toBe(true)
    })
  })
})

describe("useEvent.tsx", () => {
  const baseEvent = {
    action: "created",
    data: { id: 1 },
    event: "event",
    model: "product",
    source: "api",
    updated_at: "now",
    version: 1,
  }

  describe("useEvent", () => {
    it("opens an EventSource and cleans up", () => {
      const cb = vi.fn()
      const { unmount } = renderHook(() => useEvent({ cb }))

      const instance = FakeEventSource.instances[0]
      expect(instance.url).toContain("api/store-mgmt/events/")
      expect(instance.options?.withCredentials).toBe(true)

      unmount()
      expect(instance.close).toHaveBeenCalledTimes(1)
    })

    it("ignores connected status messages", () => {
      const cb = vi.fn()
      renderHook(() => useEvent({ cb }))

      const instance = FakeEventSource.instances[0]
      instance.emitMessage(JSON.stringify({ ...baseEvent, status: "connected" }))

      expect(cb).not.toHaveBeenCalled()
    })

    it("filters events by action", () => {
      const cb = vi.fn()
      renderHook(() => useEvent({ cb, on: ["updated"] }))

      const instance = FakeEventSource.instances[0]
      instance.emitMessage(JSON.stringify({ ...baseEvent, action: "created" }))
      instance.emitMessage(JSON.stringify({ ...baseEvent, action: "updated" }))

      expect(cb).toHaveBeenCalledTimes(1)
    })

    it("filters events by model", () => {
      const cb = vi.fn()
      renderHook(() => useEvent({ cb, from: [] }))

      const instance = FakeEventSource.instances[0]
      instance.emitMessage(JSON.stringify({ ...baseEvent }))

      expect(cb).not.toHaveBeenCalled()
    })

    it("calls the callback for matching events", () => {
      const cb = vi.fn()
      renderHook(() => useEvent({ cb }))

      const instance = FakeEventSource.instances[0]
      instance.emitMessage(JSON.stringify({ ...baseEvent }))

      expect(cb).toHaveBeenCalledTimes(1)
      expect(cb).toHaveBeenCalledWith(baseEvent)
    })

    it("calls the callback when filters match", () => {
      const cb = vi.fn()
      renderHook(() => useEvent({ cb, from: ["product"], on: ["created"] }))

      const instance = FakeEventSource.instances[0]
      instance.emitMessage(JSON.stringify({ ...baseEvent }))

      expect(cb).toHaveBeenCalledTimes(1)
    })

    it("handles invalid JSON payloads", () => {
      const cb = vi.fn()
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)

      renderHook(() => useEvent({ cb }))

      const instance = FakeEventSource.instances[0]
      instance.emitMessage("not-json")

      expect(errorSpy).toHaveBeenCalled()
      expect(cb).not.toHaveBeenCalled()

      errorSpy.mockRestore()
    })

    it("logs errors and closes on EventSource error", () => {
      const cb = vi.fn()
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)

      renderHook(() => useEvent({ cb }))

      const instance = FakeEventSource.instances[0]
      instance.emitError(new Error("connection"))

      expect(errorSpy).toHaveBeenCalled()
      expect(instance.close).toHaveBeenCalledTimes(1)

      errorSpy.mockRestore()
    })
  })

  describe("event helpers", () => {
    it("onAdd inserts unique items", () => {
      const baseItem = { id: 1, created_at: "now", updated_at: "now", version: 1 }
      let state: Array<typeof baseItem> | null = null
      const setter = (updater: SetStateAction<Array<typeof baseItem> | null>) => {
        state = typeof updater === "function" ? updater(state) : updater
      }

      onAdd(setter, baseItem)
      expect(state).toEqual([baseItem])

      onAdd(setter, baseItem)
      expect(state).toEqual([baseItem])
    })

    it("onUpdate skips null or stale items", () => {
      type Item = { id: number; version: number; name: string; created_at: string; updated_at: string }
      let state: Array<Item> | null = null
      const setter = (updater: SetStateAction<Array<Item> | null>) => {
        state = typeof updater === "function" ? updater(state) : updater
      }

      onUpdate(setter, { id: 1, version: 1, name: "A", created_at: "now", updated_at: "now" })
      expect(state).toBeNull()

      state = [{ id: 1, version: 2, name: "Current", created_at: "now", updated_at: "now" }]
      onUpdate(setter, { id: 1, version: 1, name: "Old", created_at: "now", updated_at: "now" })
      expect(state).toEqual([{ id: 1, version: 2, name: "Current", created_at: "now", updated_at: "now" }])
    })

    it("onUpdate merges newer items", () => {
      type Item = { id: number; version: number; name: string; created_at: string; updated_at: string }
      let state: Array<Item> | null = [
        { id: 1, version: 1, name: "Old", created_at: "now", updated_at: "now" },
      ]
      const setter = (updater: SetStateAction<Array<Item> | null>) => {
        state = typeof updater === "function" ? updater(state) : updater
      }

      onUpdate(setter, { id: 1, version: 2, name: "New", created_at: "now", updated_at: "now" })
      expect(state).toEqual([{ id: 1, version: 2, name: "New", created_at: "now", updated_at: "now" }])
    })

    it("onDelete removes matching items", () => {
      type Item = { id: number; created_at: string; updated_at: string; version: number }
      let state: Array<Item> | null = [
        { id: 1, created_at: "now", updated_at: "now", version: 1 },
        { id: 2, created_at: "now", updated_at: "now", version: 1 },
      ]
      const setter = (updater: SetStateAction<Array<Item> | null>) => {
        state = typeof updater === "function" ? updater(state) : updater
      }

      onDelete(setter, { id: 2, created_at: "now", updated_at: "now", version: 1 })
      expect(state).toEqual([{ id: 1, created_at: "now", updated_at: "now", version: 1 }])

      state = null
      onDelete(setter, { id: 2, created_at: "now", updated_at: "now", version: 1 })
      expect(state).toBeNull()
    })
  })
})

describe("useAuth.tsx", () => {
  describe("useAuth", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    it("throws when used outside provider", () => {
      expect(() => renderHook(() => useAuth())).toThrow(
        "useAuth must be used within an AuthProvider"
      )
    })

    it("returns context values from provider", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.loading).toBe(true)
    })
  })
})

describe("useSidebar.tsx", () => {
  describe("useSidebar", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SidebarProvider>{children}</SidebarProvider>
    )

    it("throws when used outside provider", () => {
      expect(() => renderHook(() => useSidebar())).toThrow(
        "useSidebar must be used within a SidebarProvider"
      )
    })

    it("returns context values from provider", () => {
      const { result } = renderHook(() => useSidebar(), { wrapper })

      expect(result.current.activeSidebar).toBeNull()
      expect(result.current.hasSidebar).toBe(false)

      act(() => {
        result.current.setActiveSidebar("navigation")
        result.current.setHasSidebar(true)
      })

      expect(result.current.activeSidebar).toBe("navigation")
      expect(result.current.hasSidebar).toBe(true)
    })
  })
})

describe("useTheme.tsx", () => {
  describe("useTheme", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    )

    it("throws when used outside provider", () => {
      expect(() => renderHook(() => useTheme())).toThrow(
        "useTheme must be used within a ThemeProvider"
      )
    })

    it("reads theme and toggles", async () => {
      localStorage.setItem("theme", "light")

      const { result } = renderHook(() => useTheme(), { wrapper })
      expect(result.current.theme).toBe("light")

      act(() => {
        result.current.toggleTheme()
      })

      await waitFor(() => {
        expect(result.current.theme).toBe("dark")
      })
    })
  })
})
