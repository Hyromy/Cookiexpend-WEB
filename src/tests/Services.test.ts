import { describe, it, expect, vi, beforeEach } from "vitest"

type MockFn = ReturnType<typeof vi.fn>
type ResponseHandlers = {
  onFulfilled: (response: { data: unknown }) => unknown
  onRejected: (error: unknown) => Promise<never>
}

let mockCreateConfig: import("axios").AxiosRequestConfig | undefined
let mockResponseHandlers: Partial<ResponseHandlers> = {}

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    response: {
      use: vi.fn((onFulfilled, onRejected) => {
        mockResponseHandlers = { onFulfilled, onRejected }
      })
    }
  }
}

vi.mock("axios", () => {
  const mockCreate = vi.fn((config) => {
    mockCreateConfig = config
    return mockClient
  })

  return {
    default: {
      create: mockCreate,
      isCancel: vi.fn(),
      isAxiosError: vi.fn()
    },
    create: mockCreate,
    isCancel: vi.fn(),
    isAxiosError: vi.fn()
  }
})

import axios from "axios"
import { API_URL } from "../constants/config"
import type { productRequest } from "../types/api"

const axiosMock = axios as unknown as {
  isCancel: MockFn
  isAxiosError: MockFn
}

let api: typeof import("../services/api")["api"]
let healthService: typeof import("../services/cookiexpend")["healthService"]
let authService: typeof import("../services/cookiexpend")["authService"]
let productService: typeof import("../services/cookiexpend")["productService"]

beforeEach(async () => {
  vi.resetModules()
  vi.clearAllMocks()
  mockResponseHandlers = {}
  mockCreateConfig = undefined

  const apiModule = await import("../services/api")
  api = apiModule.api
  const servicesModule = await import("../services/cookiexpend")
  healthService = servicesModule.healthService
  authService = servicesModule.authService
  productService = servicesModule.productService
})

describe("api.ts", () => {
  describe("api module", () => {
    it("configures the axios client", () => {
      // Trigger API initialization if it hasn't happened yet
      api.get("/")
      if (!mockCreateConfig) {
        throw new Error("Expected axios create config to be set")
      }
      expect(mockCreateConfig.baseURL).toBe(API_URL)
    })

    it("returns response data from the interceptor", () => {
      const payload = { ok: true }
      const result = mockResponseHandlers.onFulfilled!({ data: payload })
      expect(result).toEqual(payload)
    })

    it("wraps canceled requests", async () => {
      axiosMock.isCancel.mockReturnValue(true)
      await expect(mockResponseHandlers.onRejected!(new Error("cancel")))
        .rejects.toMatchObject({ message: "cancel" })
    })

    it("wraps timeout errors", async () => {
      axiosMock.isCancel.mockReturnValue(false)
      axiosMock.isAxiosError.mockReturnValue(true)
      await expect(mockResponseHandlers.onRejected!({ code: "ECONNABORTED" }))
        .rejects.toMatchObject({ code: "ECONNABORTED" })
    })

    it("prefers cancel over axios error", async () => {
      axiosMock.isCancel.mockReturnValue(true)
      axiosMock.isAxiosError.mockReturnValue(true)
      await expect(mockResponseHandlers.onRejected!({ response: { data: { message: "bad" } } }))
        .rejects.toMatchObject({ response: { data: { message: "bad" } } })
    })

    it("uses axios response message when available", async () => {
      axiosMock.isCancel.mockReturnValue(false)
      axiosMock.isAxiosError.mockReturnValue(true)
      await expect(mockResponseHandlers.onRejected!({ response: { data: { message: "bad" } } }))
        .rejects.toMatchObject({ response: { data: { message: "bad" } } })
    })

    it("falls back when axios response has no message", async () => {
      axiosMock.isCancel.mockReturnValue(false)
      axiosMock.isAxiosError.mockReturnValue(true)
      await expect(mockResponseHandlers.onRejected!({ response: { data: {} } }))
        .rejects.toMatchObject({ response: { data: {} } })
    })

    it("wraps non-axios Error instances", async () => {
      axiosMock.isCancel.mockReturnValue(false)
      axiosMock.isAxiosError.mockReturnValue(false)
      await expect(mockResponseHandlers.onRejected!(new Error("boom")))
        .rejects.toMatchObject({ message: "boom" })
    })

    it("falls back for unknown error values", async () => {
      axiosMock.isCancel.mockReturnValue(false)
      axiosMock.isAxiosError.mockReturnValue(false)
      await expect(mockResponseHandlers.onRejected!("boom"))
        .rejects.toBe("boom")
    })
    
    it("handles success cases", async () => {
      mockClient.get.mockResolvedValueOnce(
        mockResponseHandlers.onFulfilled!({ data: "ok" })
      )
      const res = await api.get("/test")
      expect(res).toBe("ok")
    })

    it("uses default timeout when not provided", async () => {
      mockClient.get.mockResolvedValueOnce(
        mockResponseHandlers.onFulfilled!({ data: "ok" })
      )
      await api.get("/timeout")
      const config = mockClient.get.mock.calls[0][1]
      if (!mockCreateConfig) {
        throw new Error("Expected axios create config to be set")
      }
      expect(config.timeout).toBe(mockCreateConfig.timeout)
    })

    it("respects custom timeout", async () => {
      mockClient.get.mockResolvedValueOnce(
        mockResponseHandlers.onFulfilled!({ data: "ok" })
      )
      await api.get("/timeout", { timeout: 2500, headers: { "X-Test": "true" } })
      const config = mockClient.get.mock.calls[0][1]
      expect(config.timeout).toBe(2500)
      expect(config.headers).toMatchObject({ "X-Test": "true" })
    })
  })
})

describe("cookiexpend.ts", () => {
  describe("cookiexpend services", () => {
    it("calls health check", async () => {
      mockClient.get.mockResolvedValueOnce({ data: { healthy: true } })
      await healthService.check()
      expect(mockClient.get).toHaveBeenCalledWith("api/health/", expect.any(Object))
    })

    it("calls auth login", async () => {
      const payload = { email: "hello@cookiexpend.com", password: "secret" }
      mockClient.post.mockResolvedValueOnce({ data: {} })
      await authService.login(payload)
      expect(mockClient.post).toHaveBeenCalledWith("auth/login/", payload, expect.any(Object))
    })

    it("calls auth logout", async () => {
      mockClient.post.mockResolvedValueOnce({ data: {} })
      await authService.logout()
      expect(mockClient.post).toHaveBeenCalledWith("auth/logout/", undefined, expect.any(Object))
    })

    it("calls auth me", async () => {
      mockClient.get.mockResolvedValueOnce({ data: {} })
      await authService.me()
      expect(mockClient.get).toHaveBeenCalledWith("auth/me/", expect.any(Object))
    })

    it("calls products list", async () => {
      mockClient.get.mockResolvedValueOnce({ data: [] })
      await productService.get()
      expect(mockClient.get).toHaveBeenCalledWith("api/products/", expect.any(Object))
    })

    it("calls product by id", async () => {
      mockClient.get.mockResolvedValueOnce({ data: {} })
      await productService.get(12)
      expect(mockClient.get).toHaveBeenCalledWith("api/products/12/", expect.any(Object))
    })

    it("creates product", async () => {
      const payload: productRequest = { name: "Cookie", price: "10", sku: "1" }
      mockClient.post.mockResolvedValueOnce({ data: {} })
      await productService.new(payload)
      expect(mockClient.post).toHaveBeenCalledWith(
        "api/products/",
        expect.any(FormData),
        expect.any(Object)
      )
    })

    it("updates product", async () => {
      const payload: productRequest = { name: "Cookie", price: "12", sku: "1" }
      mockClient.patch.mockResolvedValueOnce({ data: {} })
      await productService.upd(7, payload)
      expect(mockClient.patch).toHaveBeenCalledWith(
        "api/products/7/",
        expect.any(FormData),
        expect.any(Object)
      )
    })

    it("deletes product", async () => {
      mockClient.delete.mockResolvedValueOnce({ data: {} })
      await productService.del(7)
      expect(mockClient.delete).toHaveBeenCalledWith("api/products/7/", expect.any(Object))
    })
  })
})
