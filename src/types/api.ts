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

export type productResponse = Omit<productRequest, "img" | "category" | "presentation" | "variants"> & itemResponse & eventResponse & {
  slug: string
  img: string | null
  category: categoryResponse | null
  presentation: presentationResponse | null
  variants: productVariantResponse[]
}

// Note: catalog resources (apps/catalog/serializers.py) are only exposed via their
// own flat fields — no audit fields (created_at/updated_at/version) like the rest.
export type categoryRequest = {
  label: string
  order?: number
  logo?: File
}

export type categoryResponse = itemResponse & {
  label: string
  order: number
  logo: string | null
}

export type presentationRequest = {
  label: string
  order?: number
}

export type presentationResponse = itemResponse & {
  label: string
  order: number
}

export type galleryItemRequest = {
  url: File
  alt?: string
  order?: number
}

export type galleryItemResponse = itemResponse & {
  url: string
  alt: string
  order: number
}

export type faqRequest = {
  question: string
  answer: string
  order?: number
}

export type faqResponse = itemResponse & {
  question: string
  answer: string
  order: number
}

export type subjectRequest = {
  label: string
  department: string | number
  order?: number
}

export type subjectResponse = itemResponse & {
  label: string
  department: number
  order: number
}

export type departmentRequest = {
  name: string
  email?: string
  order?: number
}

export type departmentResponse = itemResponse & {
  name: string
  email: string
  order: number
  subjects: subjectResponse[]
}

export type brandRequest = {
  name: string
  logo?: File
}

export type brandResponse = itemResponse & {
  name: string
  logo_url: string | null
}

export type retailerRequest = {
  name: string
  address: string
  state: string
  municipality: string
  lat?: string
  lng?: string
  brand?: string | number
  logo?: File
}

export type retailerResponse = itemResponse & {
  name: string
  address: string
  state: string
  municipality: string
  lat: string | null
  lng: string | null
  brand: brandResponse | null
  logo_url: string | null
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
