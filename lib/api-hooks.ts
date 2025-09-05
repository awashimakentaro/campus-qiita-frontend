"use client"
//実際にapiclient.getのように呼び出してreact hookとしてフロントで扱えるようにする部分
import { useState, useEffect, useCallback ,useMemo } from "react"
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
} from "./api-types"
import { useToast } from "@/hooks/use-toast"

export function useArticle(id?: string) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  // id が変わるたびに取得（undefined のときは何もしない）
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
    return () => { cancelled = true }
  }, [id])

  // 明示的に再取得したいとき
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

        // Show error toast for user-facing errors
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
// 先頭インポートに useMemo が入っていることを確認:
// import { useState, useEffect, useMemo } from "react"

function normalizeFilters(f?: ArticleFilters) {
  if (!f) return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === null) continue;         // undefined/null は落とす
    if (typeof v === "string" && v.trim() === "") continue; // 空文字は落とす
    if (Array.isArray(v)) {
      if (v.length === 0) continue;                      // 空配列は落とす
      out[k] = [...v].map(String).sort();                // 配列はソートして安定化
    } else {
      out[k] = v;
    }
  }
  return out;
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
        if (!cancelled) setArticles(Array.isArray(response) ? response : [])
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

  return { articles, loading, error, refetch: async () => {
    // 手動リフェッチ用（同じ normalized を使う）
    const response = await apiClient.get<Article[]>("/v1/articles", normalized)
    setArticles(Array.isArray(response) ? response : [])
  }}
}

export function useCreateArticle() {
  const { toast } = useToast()

  return useCallback(
    async (data: CreateArticleRequest): Promise<Article> => {
      try {
        const article = await apiClient.post<Article>("/v1/articles/", data)

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

  // ✅ filters の安定キー（オブジェクトの新旧差で無限ループしない）
  const queryKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])

  const fetchTags = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // ✅ バックエンドは配列返却を想定
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
        const tag = await apiClient.post<Tag>("/v1/tags/", data)

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
        if (!cancelled) setArticles(Array.isArray(res) ? res : [])
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
    return () => { cancelled = true }
  }, [queryKey])

  const refetch = useCallback(async () => {
    const params = typeof is_published === "boolean" ? { is_published } : undefined
    const res = await apiClient.get<Article[]>("/v1/articles/me", params)
    setArticles(Array.isArray(res) ? res : [])
  }, [queryKey])

  return { articles, loading, error, refetch }
}
