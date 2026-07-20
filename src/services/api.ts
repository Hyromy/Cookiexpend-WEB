import axios, { type AxiosRequestConfig } from "axios"
import { API_URL } from "../constants/config"

const DEFAULT_TIMEOUT_MS = 15000

export class ApiError extends Error {
  readonly source = "api"
  readonly originalError: unknown

  constructor(message: string, originalError?: unknown) {
    super(message)
    this.name = "ApiError"
    this.originalError = originalError
  }
}

const client = axios.create({
  baseURL: API_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
  headers: {
    "Content-Type": "application/json",
    "X-Source": "web",
  },
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
)

const withTimeout = (config?: AxiosRequestConfig) => ({
  timeout: config?.timeout ?? DEFAULT_TIMEOUT_MS,
  ...config,
})

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    client.get<T>(url, withTimeout(config)) as unknown as Promise<T>,

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    client.post<T>(url, data, withTimeout(config)) as unknown as Promise<T>,
  
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    client.put<T>(url, data, withTimeout(config)) as unknown as Promise<T>,
  
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    client.patch<T>(url, data, withTimeout(config)) as unknown as Promise<T>,
  
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    client.delete<T>(url, withTimeout(config)) as unknown as Promise<T>,
}
