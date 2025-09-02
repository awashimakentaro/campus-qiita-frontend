// app/articles/[id]/page.tsx
"use client"

import type React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock } from "lucide-react"
import { LikeButton } from "@/components/like-button"
import { CommentSection } from "@/components/comment-section"
import { ReportDialog } from "@/components/report-dialog"
import { ArticleActions } from "@/components/article-actions"
import { formatDate, formatRelativeTime } from "@/lib/utils"
import { useArticle } from "@/lib/api-hooks"
import DOMPurify from "dompurify"
import { marked } from "marked"

export default function ArticlePage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { article, loading, error } = useArticle(id)

  if (!id) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-destructive">記事IDが不正です。</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <p>読み込み中...</p>
        </main>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <p className="text-destructive">記事が見つかりませんでした。</p>
        </main>
      </div>
    )
  }

  // 本文HTML（BEサニタイズ優先、無ければクライアントで生成）
  const safeHtml =
    article.body_html && article.body_html.trim().length > 0
      ? article.body_html
      : DOMPurify.sanitize(String(marked.parse(article.body_md ?? "")))

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Article Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-serif font-bold mb-4 text-balance">{article.title}</h1>

              {/* Article Meta */}
              <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={article.author?.avatar || "/placeholder.svg"} alt={article.author?.name || ""} />
                    <AvatarFallback className="text-xs">
                      {(article.author?.name ?? "?").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{article.author?.name ?? "Unknown"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(article.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatRelativeTime(article.createdAt)}</span>
                </div>
              </div>

              {/* Tags */}
              {article.tags?.length ? (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.tags.map((tag) => (
                    <Link key={tag.id} href={`/?tag=${encodeURIComponent(tag.name)}`}>
                      <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Article Actions */}
            <ArticleActions article={article} />
          </div>

          {/* Action Bar */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <LikeButton
                    articleId={article.id}
                    initialCount={article.likes_count ?? 0}
                    disabled={true} // Day8で有効化予定
                  />
                </div>
                <ReportDialog articleId={article.id} articleTitle={article.title} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Article Content */}
        <Card className="mb-8">
          <CardContent className="py-8">
            <article className="prose prose-lg max-w-none">
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
            </article>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Comments Section */}
        <CommentSection articleId={article.id} />
      </main>
    </div>
  )
}