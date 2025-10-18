"use client"
// 実際に apiClient.get のように呼び出して React Hook としてフロントで扱えるようにする部分f
import { useState, useEffect, useCallback, useMemo } from "react"
import { apiClient, ApiError } from "./api-client"
import type {
  Article,
  Tag,
  Comment,
  CreateArticleRequest,
  UpdateArticleRequest,
  CreateTagRequest,
  CreateCommentRequest,
  ArticleFilters,
  TagFilters,
  LikeResponse,
} from "./api-types"
import { useToast } from "@/hooks/use-toast"

// 並び替えヘルパー（popular=likes_count降順 / recent=作成日時降順）
// createdAt が undefined でも安全に扱う
function getTime(a: Article): number {
  const raw =
    (a as any).createdAt ??
    (a as any).created_at ?? // BE が snake_case の場合
    null
  return raw ? new Date(String(raw)).getTime() : 0
}

function sortArticles(items: Article[], sort?: "popular" | "recent") {
  const arr = [...items]

  if (sort === "popular") {
    arr.sort((a, b) => {
      const la = (a as any).likes_count ?? 0
      const lb = (b as any).likes_count ?? 0
      if (lb !== la) return lb - la // いいね多い順
      // 同数なら新しい順
      return getTime(b) - getTime(a)
    })
  } else {
    // recent（デフォルト）= 新しい順
    arr.sort((a, b) => getTime(b) - getTime(a))
  }

  return arr
}
export function useArticle(id?: string) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    if (!id) return

    let cancelled = false
    const fetchArticle = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiClient.get<Article>(`/v1/articles/${id}`)
        if (!cancelled) setArticle(res)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err : new ApiError("Failed to fetch article", 0))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchArticle()
    return () => {
      cancelled = true
    }
  }, [id])

  const refetch = useCallback(async () => {
    if (!id) return
    const res = await apiClient.get<Article>(`/v1/articles/${id}`)
    setArticle(res)
  }, [id])

  return { article, loading, error, refetch }
}

// Generic hook for API requests
export function useApiRequest<T>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const { toast } = useToast()

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiCall()
        setData(result)
        return result
      } catch (err) {
        const apiError = err instanceof ApiError ? err : new ApiError("Unknown error", 0)
        setError(apiError)

        if (apiError.status >= 400 && apiError.status < 500) {
          toast({
            title: "エラー",
            description: apiError.message,
            variant: "destructive",
          })
        }

        throw apiError
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  return { data, loading, error, execute }
}

// ---- Articles API hooks（置き換え） ----
function normalizeFilters(f?: ArticleFilters) {
  if (!f) return {}
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null) continue // undefined/null は落とす
    if (typeof v === "string" && v.trim() === "") continue // 空文字は落とす
    if (Array.isArray(v)) {
      if (v.length === 0) continue // 空配列は落とす
      out[k] = [...v].map(String).sort() // 配列はソートして安定化
    } else {
      out[k] = v
    }
  }
  return out
}

export function useArticles(filters?: ArticleFilters) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  // ✅ フィルタを正規化してから、JSON で安定キー化
  const normalized = useMemo(() => normalizeFilters(filters), [filters])
  const queryKey = useMemo(() => JSON.stringify(normalized), [normalized])

  useEffect(() => {
    let cancelled = false
    const fetchArticles = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.get<Article[]>("/v1/articles", normalized)
        const list = Array.isArray(response) ? response : []
        const sorted = sortArticles(list, (filters as any)?.sort)
        if (!cancelled) setArticles(sorted)
      } catch (err) {
        if (!cancelled) {
          const apiError = err instanceof ApiError ? err : new ApiError("Failed to fetch articles", 0)
          setError(apiError)
          setArticles([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchArticles()
    return () => {
      cancelled = true
    }
  }, [queryKey]) // ← 正規化済みキーだけに依存

  const refetch = useCallback(async () => {
    const response = await apiClient.get<Article[]>("/v1/articles", normalized)
    const list = Array.isArray(response) ? response : []
    setArticles(sortArticles(list, (filters as any)?.sort))
  }, [queryKey, filters])

  return { articles, loading, error, refetch }
}

export function useCreateArticle() {
  const { toast } = useToast()

  return useCallback(
    async (data: CreateArticleRequest): Promise<Article> => {
      try {
        const article = await apiClient.post<Article>("/v1/articles", data)

        toast({
          title: "成功",
          description: data.is_published ? "記事を公開しました" : "下書きを保存しました",
        })

        return article
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "エラー",
            description: error.message,
            variant: "destructive",
          })
        }
        throw error
      }
    },
    [toast],
  )
}

export function useUpdateArticle() {
  const { toast } = useToast()

  return useCallback(
    async (id: string, data: UpdateArticleRequest): Promise<Article> => {
      try {
        const article = await apiClient.patch<Article>(`/v1/articles/${id}`, data)

        toast({
          title: "成功",
          description: "記事を更新しました",
        })

        return article
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "エラー",
            description: error.message,
            variant: "destructive",
          })
        }
        throw error
      }
    },
    [toast],
  )
}

export function useDeleteArticle() {
  const { toast } = useToast()

  return useCallback(
    async (id: string): Promise<void> => {
      try {
        await apiClient.delete(`/v1/articles/${id}`)

        toast({
          title: "成功",
          description: "記事を削除しました",
        })
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "エラー",
            description: error.message,
            variant: "destructive",
          })
        }
        throw error
      }
    },
    [toast],
  )
}

// Tags API hooks（置き換え）
export function useTags(filters?: TagFilters) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const queryKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  const fetchTags = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<Tag[]>("/v1/tags", filters)
      setTags(Array.isArray(response) ? response : [])
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to fetch tags", 0)
      setError(apiError)
      setTags([])
    } finally {
      setLoading(false)
    }
  }, [queryKey]) // ← filters ではなく安定キーに依存

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  return { tags, loading, error, refetch: fetchTags }
}

export function useCreateTag() {
  const { toast } = useToast()

  return useCallback(
    async (data: CreateTagRequest): Promise<Tag> => {
      try {
        const tag = await apiClient.post<Tag>("/v1/tags", data)

        toast({
          title: "成功",
          description: "タグを作成しました",
        })

        return tag
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "エラー",
            description: error.message,
            variant: "destructive",
          })
        }
        throw error
      }
    },
    [toast],
  )
}

export function useAddTagToArticle() {
  const { toast } = useToast()

  return useCallback(
    async (articleId: string, tagId: string): Promise<void> => {
      try {
        await apiClient.post(`/v1/articles/${articleId}/tags`, { tag_id: tagId })

        toast({
          title: "成功",
          description: "タグを追加しました",
        })
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "エラー",
            description: error.message,
            variant: "destructive",
          })
        }
        throw error
      }
    },
    [toast],
  )
}

// Comments API hooks
export function useComments(articleId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchComments = useCallback(async () => {
    if (!articleId) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<Comment[]>(`/v1/articles/${articleId}/comments`)
      setComments(response)
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to fetch comments", 0)
      setError(apiError)
    } finally {
      setLoading(false)
    }
  }, [articleId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  return { comments, loading, error, refetch: fetchComments }
}

export function useCreateComment() {
  const { toast } = useToast()

  return useCallback(
    async (articleId: string, data: CreateCommentRequest): Promise<Comment> => {
      try {
        const comment = await apiClient.post<Comment>(`/v1/articles/${articleId}/comments`, data)

        toast({
          title: "成功",
          description: "コメントを投稿しました",
        })

        return comment
      } catch (error) {
        if (error instanceof ApiError) {
          toast({
            title: "エラー",
            description: error.message,
            variant: "destructive",
          })
        }
        throw error
      }
    },
    [toast],
  )
}

// ---- My Articles（自分の記事一覧）----
export function useMyArticles(is_published?: boolean) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  // パラメータを安定化（依存配列で無限ループしない）
  const queryKey = useMemo(() => JSON.stringify({ is_published }), [is_published])

  useEffect(() => {
    let cancelled = false
    const fetchMy = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = typeof is_published === "boolean" ? { is_published } : undefined
        const res = await apiClient.get<Article[]>("/v1/articles/me", params)
        const list = Array.isArray(res) ? res : []
        // マイ記事は作成日の新しい順で見やすく
        const sorted = sortArticles(list, "recent")
        if (!cancelled) setArticles(sorted)
      } catch (err) {
        if (!cancelled) {
          const apiError = err instanceof ApiError ? err : new ApiError("Failed to fetch my articles", 0)
          setError(apiError)
          setArticles([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchMy()
    return () => {
      cancelled = true
    }
  }, [queryKey])

  const refetch = useCallback(async () => {
    const params = typeof is_published === "boolean" ? { is_published } : undefined
    const res = await apiClient.get<Article[]>("/v1/articles/me", params)
    const list = Array.isArray(res) ? res : []
    setArticles(sortArticles(list, "recent"))
  }, [queryKey])

  return { articles, loading, error, refetch }
}

// ---- Likes API hooks ----
export function useLike(articleId: string) {
  const [state, setState] = useState<LikeResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const { toast } = useToast()
// 初回取得
  useEffect(() => {
    if (!articleId) return
    let cancelled = false
    const fetchLike = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get<LikeResponse>(`/v1/articles/${articleId}/likes`)
        if (!cancelled) setState(res)
      } catch (err) {
        if (!cancelled) {
          const apiError = err instanceof ApiError ? err : new ApiError("Failed to fetch like", 0)
          setError(apiError)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchLike()
    return () => {
      cancelled = true
    }
  }, [articleId])

  // いいね
  const like = useCallback(async () => {
    try {
      const res = await apiClient.post<LikeResponse>(`/v1/articles/${articleId}/likes`, {})
      setState(res)
      return res
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to like", 0)
      setError(apiError)
      toast({
        title: "エラー",
        description: apiError.message,
        variant: "destructive",
      })
      throw apiError
    }
  }, [articleId, toast])

  // いいね解除
  const unlike = useCallback(async () => {
    try {
      const res = await apiClient.delete<LikeResponse>(`/v1/articles/${articleId}/likes`)
      setState(res)
      return res
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to unlike", 0)
      setError(apiError)
      toast({
        title: "エラー",
        description: apiError.message,
        variant: "destructive",
      })
      throw apiError
    }
  }, [articleId, toast])

  return { state, loading, error, like, unlike }
}
