export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const AUTH_TOKEN_KEY = 'auth_token'
export const USER_KEY = 'user'

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MANAGER: 'manager',
} as const

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const
