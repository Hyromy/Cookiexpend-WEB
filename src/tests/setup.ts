import "@testing-library/react"
import "@testing-library/jest-dom"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

const isNodeLocalStorage = globalThis.localStorage && !('getItem' in globalThis.localStorage)

if (isNodeLocalStorage || !globalThis.localStorage) {
  const mockStorage: Storage = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = String(value) },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { store = {} },
      key: (index: number) => Object.keys(store)[index] || null,
      get length() { return Object.keys(store).length }
    }
  })()

  Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    configurable: true,
    enumerable: true,
    writable: true
  })
}

afterEach(() => {
  cleanup()
})

vi.mock("axios", () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    get: vi.fn(() => new Promise(() => {})),
    post: vi.fn(() => new Promise(() => {})),
    put: vi.fn(() => new Promise(() => {})),
    patch: vi.fn(() => new Promise(() => {})),
    delete: vi.fn(() => new Promise(() => {})),
  }

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      isCancel: vi.fn(() => false),
      isAxiosError: vi.fn(() => false),
      ...mockAxiosInstance,
    },
  }
})
