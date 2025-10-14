// lib/api-client.ts
// フロント（Vercel）→ /api →（rewrite）→ Render(FastAPI) へプロキシする前提。
// ・BASEは使わず相対URLで統一
// ・Cookie送受信を常に有効化（credentials: 'include'）
// ・（任意）FirebaseのIDトークンをAuthorization: Bearer に自動付与
// ・二重スラ防止 & クエリパラメータ安全組み立て

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
  // すべて /api 配下へ流す（VercelのrewritesでRenderへ中継）
  private readonly basePath = "/api"

  /** クライアント環境なら Firebase の ID トークンを取得して返す */
  private async getIdTokenIfAvailable(): Promise<string | undefined> {
    if (typeof window === "undefined") return undefined
    try {
      const { getAuth } = await import("firebase/auth")
      const user = getAuth().currentUser
      if (!user) return undefined
      return await user.getIdToken()
    } catch {
      return undefined
    }
  }

  /** /api + endpoint を安全に連結し、params があればクエリを付与 */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    let url = `${this.basePath}${path}` // 例: /api/v1/articles

    if (params && Object.keys(params).length > 0) {
      const sp = new URLSearchParams()
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue
        if (Array.isArray(value)) {
          for (const v of value) sp.append(key, String(v))
        } else {
          sp.append(key, String(value))
        }
      }
      const qs = sp.toString()
      if (qs) url += `?${qs}`
    }
    return url
  }

  /** 共通のfetchラッパ（Cookie・IDトークン・ヘッダ正規化） */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(endpoint)

    // Firebase IDトークン（あれば）
    const idToken = await this.getIdTokenIfAvailable()

    // ヘッダ正規化
    const headers = new Headers(options.headers as HeadersInit | undefined)

    // BodyがJSONなら Content-Type を補完（FormDataなどは自動付与されるので付けない）
    const isJsonBody =
      options.body !== undefined &&
      !(options.body instanceof FormData) &&
      !(options.body instanceof Blob) &&
      !(options.body instanceof ArrayBuffer)

    if (isJsonBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
    if (idToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${idToken}`)
    }

    const config: RequestInit = {
      method: options.method ?? "GET",
      credentials: "include", // ★ 同一オリジンCookie（/api→rewrite）を常に送受信
      headers,
      body: options.body,
      // 必要に応じて他のinitも引き継ぐ
      cache: options.cache,
      mode: options.mode,
      redirect: options.redirect,
      referrer: options.referrer,
      referrerPolicy: options.referrerPolicy,
      keepalive: options.keepalive,
      integrity: options.integrity,
      signal: options.signal,
    }

    try {
      const res = await fetch(url, config)

      if (!res.ok) {
        // 可能ならJSONエラーを拾う
        let message = `HTTP ${res.status}`
        let code: string | undefined
        try {
          const data = await res.json()
          message = data.message || data.error || message
          code = data.code
        } catch {
          message = res.statusText || message
        }
        throw new ApiError(message, res.status, code)
      }

      if (res.status === 204) return {} as T

      const ct = res.headers.get("content-type") || ""
      const text = await res.text()
      if (!text) return {} as T
      if (ct.includes("application/json")) {
        return JSON.parse(text) as T
      }
      return {} as T
    } catch (err) {
      if (err instanceof ApiError) throw err
      const msg = err instanceof Error ? err.message : "Network error occurred"
      throw new ApiError(msg, 0)
    }
  }

  // ====== Public methods ======

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(endpoint, params) // ここでクエリ付与済み
    // request() は endpointを受け取る設計なので、pathname+search を渡す
    const u = new URL(url, "http://localhost") // ベースはダミー。pathname+searchを抽出
    return this.request<T>(u.pathname + u.search)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

// Singletonで使う
export const apiClient = new ApiClient()
