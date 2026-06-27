import axios from "axios"
import {
  useEffect,
  useRef,
  useState,
  useCallback
} from "react"
import type { ApiRequestError } from "../types/api"

type ApiData = Record<string, unknown> | unknown[] | string | number | boolean | null

type RequestResult<TResults extends unknown[]> =
  TResults extends [Promise<infer TSingle>]
    ? TSingle
    : TResults extends [infer TSingle]
      ? TSingle
      : { [K in keyof TResults]: TResults[K] extends Promise<infer U> ? U : TResults[K] }

type RequestSource<T> = Promise<T> | ((signal: AbortSignal) => Promise<T>)

type UseApiOptions = {
  abortOnUnmount?: boolean
  abortPrevious?: boolean
}

const parseError = (err: unknown): ApiRequestError => {
  if (axios.isAxiosError(err)) {
    const backendData = err.response?.data
    const fallbackMessage = "Ocurrió un error al procesar la solicitud."

    return {
      message: backendData?.message || backendData?.detail || err.message || fallbackMessage,
      status: err.response?.status,
      data: backendData,
      isNetworkError: !err.response,
    }
  }

  if (err instanceof Error) {
    return {
      message: err.message,
      isNetworkError: false,
    }
  }

  return {
    message: "Unknown error occurred.",
    isNetworkError: false,
  }
}

/**
 * A custom hook for making API requests with loading/error state and optional request cancellation.
 * 
 * @param T The expected type of the API response data. Can be an object, array, string, number, boolean, or null.
 * @param options Control whether to abort on unmount or abort previous requests.
 * @returns An object containing the API response data, loading state, error state, a function to make API requests, and a function to manually set the data.
 * 
 * @example
 * const { data, error, isLoading, request, setData, abort } = useApi({
 *   abortOnUnmount: true,
 *   abortPrevious: true,
 * })
 * 
 * console.log(data) // The API response data, typed as unknown in this example, or null if no request has been made or if an error occurred
 * 
 * console.log(error) // Any error that occurred during the API request
 * 
 * console.log(isLoading) // Whether the API request is currently in progress
 * 
 * request(api.getProducts()) // Make an API request using a promise
 * request(
 *   api.getProducts(),
 *   api.getCategories(),
 * ) // Make multiple API requests in parallel, with the response typed as [productsResponse, categoriesResponse]
 * 
 * request((signal) => api.getProducts({ signal })) // Make an API request with support for cancellation using an AbortSignal
 * 
 * setData({"name": "Hyromy"}) // Manually set the API response data, bypassing the request function and without affecting loading or error state
 * abort() // Manually abort the current API request
 */
export default function useApi<T = ApiData>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiRequestError | null>(null)
  const activeRequestId = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      if (options.abortOnUnmount) {
        controllerRef.current?.abort()
      }
    }
  }, [options.abortOnUnmount])

  const request = useCallback(async <TResults extends unknown[]>(
    ...apiCalls: { [K in keyof TResults]: RequestSource<TResults[K]> }
  ): Promise<RequestResult<TResults> | null> => {
    const shouldPreserveDataOnError = apiCalls.length > 1
    const requestId = activeRequestId.current + 1
    activeRequestId.current = requestId

    if (options.abortPrevious) {
      controllerRef.current?.abort()
    }
    const controller = new AbortController()
    controllerRef.current = controller

    if (!isMountedRef.current) {
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      if (apiCalls.length == 0) {
        if (isMountedRef.current && activeRequestId.current == requestId) {
          setData(null)
        }
        return null
      }

      const results = await Promise.all(
        apiCalls.map((apiCall) => (
          typeof apiCall == "function"
            ? apiCall(controller.signal)
            : apiCall
        ))
      )
      const response = (
        results.length == 1
          ? results[0]
          : results
      ) as unknown as T

      if (isMountedRef.current && activeRequestId.current == requestId) {
        setData(response)
      }
      return response as unknown as RequestResult<TResults>
    
    } catch (err) {
      if (controller.signal.aborted) {
        return null
      }
    
      const apiError = parseError(err)
    
      if (isMountedRef.current && activeRequestId.current == requestId) {
        if (!shouldPreserveDataOnError) {
          setData(null)
        }
        setError(apiError)
      }

      throw apiError as ApiRequestError
    } finally {
      if (isMountedRef.current && activeRequestId.current == requestId) {
        setIsLoading(false)
      }
    }
  }, [options.abortPrevious])

  const abort = useCallback(() => {
    controllerRef.current?.abort()
  }, [])

  return {
    data,
    error,
    isLoading,
    request,
    setData,
    abort,
  }
}
