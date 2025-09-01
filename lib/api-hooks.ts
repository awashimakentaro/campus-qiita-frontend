"use client"

import { useState, useEffect, useCallback } from "react"
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
  PaginatedResponse,
} from "./api-types"
import { useToast } from "@/hooks/use-toast"

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

// Articles API hooks
export function useArticles(filters?: ArticleFilters) {
  const [articles, setArticles] = useState<Article[]>([])
  const [pagination, setPagination] = useState<PaginatedResponse<Article>["pagination"] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<PaginatedResponse<Article>>("/v1/articles", filters)
      setArticles(response.data)
      setPagination(response.pagination)
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to fetch articles", 0)
      setError(apiError)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  return { articles, pagination, loading, error, refetch: fetchArticles }
}

export function useArticle(id: string) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchArticle = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<Article>(`/v1/articles/${id}`)
      setArticle(response)
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to fetch article", 0)
      setError(apiError)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchArticle()
  }, [fetchArticle])

  return { article, loading, error, refetch: fetchArticle }
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

// Tags API hooks
export function useTags(filters?: TagFilters) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const fetchTags = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<PaginatedResponse<Tag>>("/v1/tags", filters)
      setTags(response.data)
    } catch (err) {
      const apiError = err instanceof ApiError ? err : new ApiError("Failed to fetch tags", 0)
      setError(apiError)
    } finally {
      setLoading(false)
    }
  }, [filters])

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
