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

export type productResponse = itemResponse & eventResponse & {
  description: string
  name: string
  price: string
}

export type productRequest = {
  data: unknown
}
