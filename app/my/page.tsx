"use client"

import { useMyArticles } from "@/lib/api-hooks"
import { ArticleCard } from "@/components/article-card"
import { Header } from "@/components/header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { RefreshCw } from "lucide-react"
import { useState } from "react"

// 省略...
export default function MyArticlesPage() {
  const [tab, setTab] = useState<"all" | "published" | "drafts">("all")

  const published = useMyArticles(true)
  const drafts = useMyArticles(false)

  // 🔍 デバッグ（コンソールに状況を出す）
  if (published.error) console.log("published error:", published.error)
  if (drafts.error) console.log("drafts error:", drafts.error)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">マイ記事</h1>

        {/* 🔴 エラー視覚表示 */}
        {published.error && (
          <p className="text-destructive mb-2">
            公開記事取得に失敗: {published.error.message}
          </p>
        )}
        {drafts.error && (
          <p className="text-destructive mb-4">
            下書き取得に失敗: {drafts.error.message}
          </p>
        )}

        {/* 🫥 両方空の時の空状態 */}
        {!published.loading && !drafts.loading &&
          published.articles.length === 0 && drafts.articles.length === 0 && (
          <p className="text-muted-foreground">表示できる記事がありません（未ログインか、まだ記事がありません）。</p>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">すべて</TabsTrigger>
            <TabsTrigger value="published">公開中</TabsTrigger>
            <TabsTrigger value="drafts">下書き</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            {[...published.articles, ...drafts.articles].map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </TabsContent>

          <TabsContent value="published" className="mt-6 space-y-6">
            {published.articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </TabsContent>

          <TabsContent value="drafts" className="mt-6 space-y-6">
            {drafts.articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </TabsContent>
        </Tabs>

        {(published.loading || drafts.loading) && (
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            読み込み中...
          </div>
        )}
      </main>
    </div>
  )
}