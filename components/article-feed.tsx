"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw } from "lucide-react"
import { ArticleCard } from "./article-card"
import { ArticleSearch } from "./article-search"
import { useArticles } from "@/lib/api-hooks"
import type { ArticleFilters } from "@/lib/api-types"

export function ArticleFeed() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL → 初期状態
  const initialQuery = searchParams.get("query") || ""
  const initialTags = searchParams.get("tag")?.split(",").filter(Boolean) || []
  const initialSort = (searchParams.get("sort") as "popular" | "recent") || "popular"

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)
  const [sortBy, setSortBy] = useState<"popular" | "recent">(initialSort)

  // バックエンドはページネーション未対応のため page/limit は渡さない
  const filters: ArticleFilters = {
    query: searchQuery || undefined,
    tag: selectedTags.length > 0 ? selectedTags : undefined,
    sort: sortBy,
    is_published: true,
  }

  const { articles, loading, error, refetch } = useArticles(filters)

  // フィルタ変更時にURL更新
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("query", searchQuery)
    if (selectedTags.length > 0) params.set("tag", selectedTags.join(","))
    if (sortBy !== "popular") params.set("sort", sortBy)
    const newUrl = params.toString() ? `/?${params.toString()}` : "/"
    router.replace(newUrl, { scroll: false })
  }, [searchQuery, selectedTags, sortBy, router])

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort as "popular" | "recent")
  }

  return (
    <div className="space-y-6">
      {/* 検索・タグフィルタ */}
      <ArticleSearch
        onSearchChange={setSearchQuery}
        onTagsChange={setSelectedTags}
        searchQuery={searchQuery}
        selectedTags={selectedTags}
      />

      {/* 並び替えタブ */}
      <Tabs value={sortBy} onValueChange={handleSortChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="popular">人気</TabsTrigger>
          <TabsTrigger value="recent">新着</TabsTrigger>
        </TabsList>

        <TabsContent value={sortBy} className="mt-6">
          {/* エラー */}
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

          {/* ローディング */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">記事を検索しています...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || selectedTags.length > 0
                    ? "条件に合う記事を探しています"
                    : "最新の記事を取得しています"}
                </p>
              </div>
            </div>
          )}

          {/* 一覧 */}
          {!loading && (
            <div className="space-y-6">
              {(!articles || articles.length === 0) ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery || selectedTags.length > 0
                      ? "検索条件に一致する記事が見つかりませんでした"
                      : "まだ記事が投稿されていません"}
                  </p>
                </div>
              ) : (
                articles.map((article) => <ArticleCard key={article.id} article={article} />)
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}