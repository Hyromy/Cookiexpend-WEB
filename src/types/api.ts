export type ApiRequestError = {
  message: string
  status?: number
  data?: unknown
  isNetworkError: boolean
}

export type loginRequest = {
  email: string
  password: string
}

export type askResetPasswordRequest = {
  email: string
}

export type resetPasswordResponse = {
  success: boolean
  message: string
}

export type confirmResetPasswordRequest = {
  password: string
  token: string
}

export type confirmResetPasswordResponse = {
  success: boolean
  message: string
}

export type sessionResponse = {
  success: boolean
  message?: string
  wasAuthenticated?: boolean
}

export type userRolePermission = "Factory manager" | "Store manager"
export type userRoleName = "factory" | "store"

export type meRequest = {
  first_name: string
  last_name: string
  email: string
  password?: string
}

export type meResponse = {
  date_joined: string
  email: string
  establishment: { id: number; name: string } | null
  first_name: string
  id: number
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  last_login: string
  last_name: string
  role: userRolePermission
  username: string
}

export type userInfoResponse = itemResponse & {
  username: string
  last_name: string
  email: string
  first_name: string
}

export type profileResponse = eventResponse & itemResponse & {
  factory: factoryResponse | null
  role: userRoleName
  store: storeResponse | null
  user: userInfoResponse
}

export type profileRequest = {
  username: string
  email: string
  role: userRoleName
  establishment: string | number
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
  type: userRoleName | null
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
  sku: string
  name: string
  price: string
  img?: File
  description?: string
  badge?: string
  category?: string | number
  presentation?: string | number
  variants?: Array<string | number>
}

export type productVariantResponse = itemResponse & {
  slug: string
  name: string
}

export type productImageRequest = {
  product: string | number
  img: File
  order?: number
}

export type productImageResponse = itemResponse & eventResponse & {
  product: number
  img: string
  order: number
}

export type productResponse = Omit<productRequest, "img" | "category" | "presentation" | "variants"> & itemResponse & eventResponse & {
  slug: string
  img: string | null
  category: categoryResponse | null
  presentation: presentationResponse | null
  variants: productVariantResponse[]
  images: productImageResponse[]
}

// Note: Category/Presentation are only exposed via `{id, label, order[, logo]}` by
// their backend serializers (apps/catalog/serializers.py) — no audit fields.
export type categoryResponse = itemResponse & {
  label: string
  order: number
  logo: string | null
}

export type presentationResponse = itemResponse & {
  label: string
  order: number
}

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
  package: packageRequest[]
}

export type statusName =
  "pending" |
  "in_progress" |
  "completed" |
  "cancelled" |
  "stopped"

export type statusResponse = itemResponse & eventResponse & {
  name: statusName
  description: string
}

export type deliveryResponse = itemResponse & eventResponse & {
  store: storeResponse
  factory: factoryResponse
  package: packageResponse[]
  status: statusResponse
}

export type inventoryRequest = {
  store: string | number
}

export type inventoryResponse = itemResponse & eventResponse & {
  store: storeResponse
  product: productResponse
  quantity: number
}

export type saleRequest = {
  received: string
  products: Array<{
    product: string | number
    quantity: number
  }>
}

export type saleResponse = itemResponse & eventResponse & {
  date: string
  store: storeResponse
  total: string
  received: string
  returned: string
  seller: {
    id: number
    name: string
  }
  seller_name: string
  details: Array<saleDetailResponse>
  payments: Array<paymentResponse>
}

export type saleDetailResponse = itemResponse & eventResponse & {
  price: string
  quantity: number
  product: productResponse
  product_name: string
}

export type paymentResponse = itemResponse & eventResponse & {
  amount: string
  payment_method: paymentMethodResponse
}

export type paymentMethodResponse = itemResponse & eventResponse & {
  name: "cash"
}
