"use client"

import { useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { ArticleEditor } from "@/components/article-editor"
import { useArticle } from "@/lib/api-hooks"
import { useAuth } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditArticlePage() {
  const params = useParams()
  const articleId = String(params.id ?? "")
  const { user } = useAuth()
  const { article, loading, error } = useArticle(articleId)

  // ローディング表示
  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-8">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AuthGuard>
    )
  }

  // エラー or 記事なし
  if (error || !article) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertDescription>
              記事が見つかりません。削除されたか、アクセス権限がない可能性があります。
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                ホームに戻る
              </Link>
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  // 安全なオーナー判定（authorが未定義でも落ちない／型差を吸収）
  const isOwner =
    !!user && !!article.author && String(user.id) === String(article.author.id)

  if (!isOwner) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert variant="destructive">
            <AlertDescription>この記事を編集する権限がありません。</AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href={`/articles/${articleId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                記事に戻る
              </Link>
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <ArticleEditor article={article} mode="edit" />
    </AuthGuard>
  )
}