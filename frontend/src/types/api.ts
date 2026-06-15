export interface APIResponse<T = unknown> {
  success?: boolean
  message?: string
  data: T
  total?: number
  timestamp?: string
}

export interface ListResponse<T = unknown> {
  success?: boolean
  message?: string
  data: T[]
  total?: number
  skip?: number
  limit?: number
  timestamp?: string
}
