export type loginRequest = {
  email: string
  password: string
}

export type sessionResponse = {
  success: boolean
  message?: string
  wasAuthenticated?: boolean
}

// for debugging
export type userInfoResponse = {
  id: number
  last_login: string
  is_superuser: boolean
  username: string
  last_name: string
  email: string
  is_staff: boolean
  is_active: boolean
  date_joined: string
  first_name: string
}

export type eventResponse = {
  created_at: string
  updated_at: string
  version: number
}

export type itemResponse = {
  id: number
}

export type establishmentResponse = itemResponse & eventResponse & {
  name: string
  municipality: string
  neighborhood: string
  street: string
  number: string
}

export type establishmentRequest = {
  municipality: string
  name: string
  neighborhood: string
  street: string
  number?: string
}

export type factoryResponse = itemResponse & eventResponse & {
  establishment: establishmentResponse
}

export type factoryRequest = {
  establishment: establishmentRequest
}

export type storeResponse = itemResponse & eventResponse & {
  establishment: establishmentResponse
}

export type storeRequest = {
  establishment: establishmentRequest
}

export type productRequest = {
  name: string
  price: string
}

export type productResponse = productRequest & itemResponse & eventResponse

export type packageRequest = {
  product: number | string
  quantity: number
}

export type packageResponse = {
  product: productResponse
  quantity: number
}

export type deliveryRequest = {
  store: number | string
  factory: number | string
  package: packageRequest[]
}

export type deliveryResponse = itemResponse & eventResponse & {
  store: storeResponse
  factory: factoryResponse
}
