"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"
import { ArticleCard } from "./article-card"
import { ArticleSearch } from "./article-search"
import { useArticles } from "@/lib/api-hooks"
import type { ArticleFilters } from "@/lib/api-types"

export function ArticleFeed() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial values from URL params
  const initialQuery = searchParams.get("query") || ""
  const initialTags = searchParams.get("tag")?.split(",").filter(Boolean) || []
  const initialSort = (searchParams.get("sort") as "popular" | "recent") || "popular"

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)
  const [sortBy, setSortBy] = useState<"popular" | "recent">(initialSort)
  const [page, setPage] = useState(1)

  // Build filters for API call
  const filters: ArticleFilters = {
    query: searchQuery || undefined,
    tag: selectedTags.length > 0 ? selectedTags : undefined,
    sort: sortBy,
    page,
    limit: 10,
    is_published: true,
  }

  const { articles, pagination, loading, error, refetch } = useArticles(filters)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (searchQuery) params.set("query", searchQuery)
    if (selectedTags.length > 0) params.set("tag", selectedTags.join(","))
    if (sortBy !== "popular") params.set("sort", sortBy)

    const newUrl = params.toString() ? `/?${params.toString()}` : "/"
    router.replace(newUrl, { scroll: false })
  }, [searchQuery, selectedTags, sortBy, router])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedTags, sortBy])

  const handleLoadMore = () => {
    if (pagination && page < pagination.totalPages) {
      setPage((prev) => prev + 1)
    }
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as "popular" | "recent")
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <ArticleSearch
        onSearchChange={setSearchQuery}
        onTagsChange={setSelectedTags}
        searchQuery={searchQuery}
        selectedTags={selectedTags}
      />

      {/* Sort Tabs */}
      <Tabs value={sortBy} onValueChange={handleSortChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="popular">人気</TabsTrigger>
          <TabsTrigger value="recent">新着</TabsTrigger>
        </TabsList>

        <TabsContent value={sortBy} className="mt-6">
          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription className="flex items-center justify-between">
                <span>記事の読み込みに失敗しました: {error.message}</span>
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  再試行
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && page === 1 && (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Articles List */}
          {!loading || page > 1 ? (
            <div className="space-y-6">
              {(!articles || articles.length === 0) && !loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery || selectedTags.length > 0
                      ? "検索条件に一致する記事が見つかりませんでした"
                      : "まだ記事が投稿されていません"}
                  </p>
                </div>
              ) : (
                <>
                  {articles?.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}

                  {/* Load More Button */}
                  {pagination && page < pagination.totalPages && (
                    <div className="flex justify-center pt-6">
                      <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            読み込み中...
                          </>
                        ) : (
                          "さらに読み込む"
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Pagination Info */}
                  {pagination && (
                    <div className="text-center text-sm text-muted-foreground">
                      {pagination.total}件中 {Math.min(page * pagination.limit, pagination.total)}件を表示
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
