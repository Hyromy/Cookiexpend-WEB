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

class FactoryService {
  readonly endpoint = "api/factories/"

  get(id: string | number = ""): Promise<apiType.factoryResponse | apiType.factoryResponse[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: apiType.factoryRequest): Promise<apiType.factoryResponse> {
    return api.post(this.endpoint, data)
  }
}

class StoreService {
  readonly endpoint = "api/stores/"

  get(id: string | number = ""): Promise<apiType.storeResponse | apiType.storeResponse[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: apiType.storeRequest): Promise<apiType.storeResponse> {
    return api.post(this.endpoint, data)
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

  del(id: string | number): Promise<void> {
    return api.delete(this.endpoint + param(id))
  }
}

class DeliveryService {
  readonly endpoint = "api/deliveries/"

  get(id: string | number = ""): Promise<apiType.deliveryResponse | apiType.deliveryResponse[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: apiType.deliveryRequest): Promise<apiType.deliveryResponse> {
    return api.post(this.endpoint, data)
  }
}

export const healthService = Object.freeze(new HealthService())
export const authService = Object.freeze(new AuthService())
export const factoryService = Object.freeze(new FactoryService())
export const storeService = Object.freeze(new StoreService())
export const productService = Object.freeze(new ProductService())
export const deliveryService = Object.freeze(new DeliveryService())
