import * as apiType from "../types/api"
import { api } from "./api"

const param = (id: string | number) => {
  return String(id).length > 0
    ? id + "/"
    : ""
}

class HealthService {
  check(): Promise<{ healthy: true }> {
    return api.get("api/health/")
  }
}

class AuthService {
  readonly endpoint = "auth/"

  login(data: apiType.loginRequest): Promise<apiType.sessionResponse> {
    return api.post(this.endpoint + "login/", data)
  }

  logout(): Promise<apiType.sessionResponse> {
    return api.post(this.endpoint + "logout/")
  }

  me(): Promise<apiType.userInfoResponse> {
    return api.get(this.endpoint + "me/")
  }
}

class ProductService {
  readonly endpoint = "api/products/"

  get(id: string | number = ""): Promise<apiType.productResponse | apiType.productResponse[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: apiType.productRequest): Promise<apiType.productResponse> {
    return api.post(this.endpoint, data)
  }

  update(id: string | number, data: apiType.productRequest): Promise<apiType.productResponse> {
    return api.patch(this.endpoint + param(id), data)
  }

  del(id: string | number): Promise<unknown> {
    return api.delete(this.endpoint + param(id))
  }
}

export const healthService = Object.freeze(new HealthService())
export const authService = Object.freeze(new AuthService())
export const productService = Object.freeze(new ProductService())
