import type { statusName } from "../types/api"
import * as apiType from "../types/api"
import { api } from "./api"

const param = (id: string | number): string => {
  try {
    const parsed = parseInt(String(id))
    return parsed > 0
      ? parsed + "/"
      : ""
  } catch {
    return ""
  }
}

const args = (data: Record<string, string | number>): string => {
  const params = new URLSearchParams()
  for (const key in data) {
    params.append(key, String(data[key]))
  }
  return params
    ? "?" + params.toString()
    : ""
}

const buildFormData = (obj: Record<string, unknown>): FormData => {
  const fd = new FormData()
  for (const key in obj) {
    const value = obj[key]
    if (value === undefined || value === null || value === "") continue

    if (Array.isArray(value)) {
      value.forEach(item => fd.append(key, String(item)))
    } else {
      fd.append(key, value as string | Blob)
    }
  }
  return fd
}

class HealthService {
  check(): Promise<{ healthy: true }> {
    return api.get("api/store-mgmt/health/")
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

  me(): Promise<apiType.meResponse> {
    return api.get(this.endpoint + "me/")
  }

  upd(data: apiType.meRequest): Promise<apiType.meResponse> {
    return api.patch(this.endpoint + "update/", data)
  }

  askResetPassword(data: apiType.askResetPasswordRequest): Promise<apiType.resetPasswordResponse> {
    return api.post(this.endpoint + "reset/request/", data)
  }

  confirmResetPassword(data: apiType.confirmResetPasswordRequest): Promise<apiType.confirmResetPasswordResponse> {
    return api.post(this.endpoint + "reset/confirm/", data)
  }
}

class EstablishmentService {
  readonly endpoint = "api/store-mgmt/establishments/"

  get(id: string | number = ""): Promise<apiType.establishmentResponse | apiType.establishmentResponse[]> {
    return api.get(this.endpoint + param(id))
  }
}

class FactoryService {
  readonly endpoint = "api/store-mgmt/factories/"

  get(id: string | number = ""): Promise<apiType.factoryResponse | apiType.factoryResponse[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: apiType.factoryRequest): Promise<apiType.factoryResponse> {
    return api.post(this.endpoint, data)
  }

  upd(id: string | number, data: apiType.factoryRequest): Promise<apiType.factoryResponse> {
    return api.patch(this.endpoint + param(id), data)
  }

  del(id: string | number): Promise<void> {
    return api.delete(this.endpoint + param(id))
  }
}

class StoreService {
  readonly endpoint = "api/store-mgmt/stores/"

  get(id: string | number = ""): Promise<apiType.storeResponse | apiType.storeResponse[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: apiType.storeRequest): Promise<apiType.storeResponse> {
    return api.post(this.endpoint, data)
  }

  upd(id: string | number, data: apiType.storeRequest): Promise<apiType.storeResponse> {
    return api.patch(this.endpoint + param(id), data)
  }

  del(id: string | number): Promise<void> {
    return api.delete(this.endpoint + param(id))
  }
}

class CategoryService {
  readonly endpoint = "api/catalog/categories/"

  get(id: string | number = ""): Promise<apiType.categoryResponse | apiType.categoryResponse[]> {
    return api.get(this.endpoint + param(id))
  }
}

class PresentationService {
  readonly endpoint = "api/catalog/presentations/"

  get(id: string | number = ""): Promise<apiType.presentationResponse | apiType.presentationResponse[]> {
    return api.get(this.endpoint + param(id))
  }
}

class ProductService {
  readonly endpoint = "api/store-mgmt/products/"

  get(id: string | number = ""): Promise<apiType.productResponse | apiType.productResponse[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: apiType.productRequest): Promise<apiType.productResponse> {
    return api.post(
      this.endpoint,
      buildFormData(data),
      { headers: { "Content-Type": undefined } }
    )
  }

  upd(id: string | number, data: apiType.productRequest): Promise<apiType.productResponse> {
    return api.patch(
      this.endpoint + param(id),
      buildFormData(data),
      { headers: { "Content-Type": undefined } }
    )
  }

  del(id: string | number): Promise<void> {
    return api.delete(this.endpoint + param(id))
  }
}

class DeliveryService {
  readonly endpoint = "api/store-mgmt/deliveries/"

  get(id: string | number = ""): Promise<apiType.deliveryResponse | apiType.deliveryResponse[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: apiType.deliveryRequest): Promise<apiType.deliveryResponse> {
    return api.post(this.endpoint, data)
  }

  upd(id: string | number, data: apiType.deliveryRequest): Promise<apiType.deliveryResponse> {
    return api.patch(this.endpoint + param(id), data)
  }

  del(id: string | number): Promise<void> {
    return api.delete(this.endpoint + param(id))
  }

  changeStatus(id: string | number, step: 1 | -1): Promise<apiType.deliveryResponse> {
    const status: statusName = "completed"
    
    return api.patch(this.endpoint + param(id) + "status/", { step, status })
  }
}

class InventoryService {
  readonly endpoint = "api/store-mgmt/inventories/"

  get(id: string | number = "", query?: apiType.inventoryRequest): Promise<apiType.inventoryResponse[]> {
    return api.get(this.endpoint + param(id) + args(query!))
  }
}

class SaleService {
  readonly endpoint = "api/store-mgmt/sells/"

  get(id: string | number = ""): Promise<apiType.saleResponse | apiType.saleResponse[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: apiType.saleRequest): Promise<apiType.saleResponse> {
    return api.post(this.endpoint, data)
  }
}

class ProfileService {
  readonly endpoint = "api/store-mgmt/profiles/"

  get(id: string | number = ""): Promise<unknown | unknown[]> {
    return api.get(this.endpoint + param(id))
  }

  new(data: unknown): Promise<apiType.profileResponse> {
    return api.post(this.endpoint, data)
  }

  upd(id: string | number, data: unknown): Promise<apiType.profileResponse> {
    return api.patch(this.endpoint + param(id), data)
  }

  del(id: string | number): Promise<void> {
    return api.delete(this.endpoint + param(id))
  }
}

export const healthService = Object.freeze(new HealthService())
export const authService = Object.freeze(new AuthService())

export const establishmentService = Object.freeze(new EstablishmentService())
export const factoryService = Object.freeze(new FactoryService())
export const storeService = Object.freeze(new StoreService())
export const categoryService = Object.freeze(new CategoryService())
export const presentationService = Object.freeze(new PresentationService())
export const productService = Object.freeze(new ProductService())
export const deliveryService = Object.freeze(new DeliveryService())
export const inventoryService = Object.freeze(new InventoryService())
export const saleService = Object.freeze(new SaleService())
export const profileService = Object.freeze(new ProfileService())
