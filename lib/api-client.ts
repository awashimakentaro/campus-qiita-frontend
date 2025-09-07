// lib/api-client.ts
// 実際に API とやりとりをするクライアント。
// ★ 変更点: Firebase の ID トークンを Authorization ヘッダに自動付与。

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
  }

  /** クライアント環境なら Firebase の ID トークンを取得して返す */
  private async getIdTokenIfAvailable(): Promise<string | undefined> {
    if (typeof window === "undefined") return undefined
    try {
      const { getAuth } = await import("firebase/auth")
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return undefined
      return await user.getIdToken()
    } catch {
      // Firebase 未初期化 or 取得失敗時は無視
      return undefined
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${this.baseUrl}${endpoint}`

  // Firebase ID トークン（あれば）
  const idToken = await this.getIdTokenIfAvailable()

  // ← ここがポイント：Headers で正規化
  const headers = new Headers(options.headers as HeadersInit | undefined)
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (idToken) {
    headers.set("Authorization", `Bearer ${idToken}`)
  }

  const config: RequestInit = {
    // options を最後に展開しないと上書きされる可能性があるので注意
    method: options.method ?? "GET",
    credentials: "include",
    headers, // 正規化済み
    body: options.body,
    // 他に必要なら options のプロパティをここで拾う
    cache: options.cache,
    mode: options.mode,
    redirect: options.redirect,
    referrer: options.referrer,
    referrerPolicy: options.referrerPolicy,
    keepalive: options.keepalive,
    integrity: options.integrity,
    signal: options.signal,
    window: (options as any).window,
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`
      let errorCode: string | undefined

      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        errorCode = errorData.code
      } catch {
        errorMessage = response.statusText || errorMessage
      }

      throw new ApiError(errorMessage, response.status, errorCode)
    }

    if (response.status === 204) {
      return {} as T
    }

    const contentType = response.headers.get("content-type") || ""
    const text = await response.text()
    if (!text) return {} as T
    if (contentType.includes("application/json")) {
      return JSON.parse(text) as T
    }
    return {} as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(error instanceof Error ? error.message : "Network error occurred", 0)
  }
}


  // GET
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(key, String(v)))
          } else {
            url.searchParams.append(key, String(value))
          }
        }
      })
    }

    return this.request<T>(url.pathname + url.search)
  }

  // POST
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PATCH
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()