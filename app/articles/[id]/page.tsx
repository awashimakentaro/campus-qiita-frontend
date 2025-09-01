import type React from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
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
import { MDXRemote } from "next-mdx-remote/rsc"

// MDX components for article content
const mdxComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-3xl font-serif font-bold mt-8 mb-6 first:mt-0 text-balance">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-2xl font-serif font-bold mt-8 mb-4 text-balance">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xl font-serif font-bold mt-6 mb-3 text-balance">{children}</h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-lg font-serif font-bold mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }: { children: React.ReactNode }) => <p className="mb-4 leading-relaxed text-pretty">{children}</p>,
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-inside mb-6 space-y-2 ml-4">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal list-inside mb-6 space-y-2 ml-4">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary pl-6 my-6 italic text-muted-foreground bg-muted/30 py-4 rounded-r-lg">
      {children}
    </blockquote>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-muted px-2 py-1 rounded text-sm font-mono border">{children}</code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-muted p-6 rounded-lg overflow-x-auto mb-6 text-sm border">
      <code className="font-mono">{children}</code>
    </pre>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto mb-6">
      <table className="min-w-full border-collapse border border-border rounded-lg">{children}</table>
    </div>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="border border-border px-4 py-3 bg-muted font-semibold text-left">{children}</th>
  ),
  td: ({ children }: { children: React.ReactNode }) => <td className="border border-border px-4 py-3">{children}</td>,
}

// Mock function to fetch article - replace with real API call
async function getArticle(id: string) {
  // This would be replaced with actual API call
  // For now, return mock data
  return {
    id,
    title: "Next.js 14のApp Routerを使った効率的な開発手法",
    body_md: `# はじめに

Next.js 14の新機能であるApp Routerについて詳しく解説します。

## App Routerとは

App Routerは、Next.js 13で導入された新しいルーティングシステムです。

### 主な特徴

- **ファイルベースルーティング**: \`app\`ディレクトリを使用
- **レイアウト**: 共通レイアウトの簡単な実装
- **ローディング状態**: 自動的なローディング状態の管理

## 実装例

以下は基本的な実装例です：

\`\`\`typescript
// app/page.tsx
export default function HomePage() {
  return <h1>ホームページ</h1>
}
\`\`\`

> **注意**: App Routerは実験的機能から安定版になりました。

## まとめ

App Routerを使うことで、より効率的な開発が可能になります。`,
    excerpt:
      "Next.js 14の新機能であるApp Routerを活用して、より効率的なWebアプリケーション開発を行う方法について解説します。",
    is_published: true,
    author: {
      id: "1",
      name: "田中太郎",
      email: "tanaka@u-aizu.ac.jp",
      avatar: "/placeholder.svg",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    tags: [
      {
        id: "1",
        name: "Next.js",
        description: "",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      { id: "2", name: "React", description: "", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
      {
        id: "3",
        name: "TypeScript",
        description: "",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ],
    likes_count: 24,
    comments_count: 8,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const article = await getArticle(params.id)

    return {
      title: `${article.title} - 大学版Qiita`,
      description: article.excerpt,
      openGraph: {
        title: article.title,
        description: article.excerpt,
        type: "article",
        authors: [article.author.name],
        publishedTime: article.createdAt,
        modifiedTime: article.updatedAt,
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description: article.excerpt,
      },
    }
  } catch {
    return {
      title: "記事が見つかりません - 大学版Qiita",
    }
  }
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  let article

  try {
    article = await getArticle(params.id)
  } catch {
    notFound()
  }

  if (!article) {
    notFound()
  }

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
              <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={article.author.avatar || "/placeholder.svg"} alt={article.author.name} />
                    <AvatarFallback className="text-xs">{article.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{article.author.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(article.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatRelativeTime(article.createdAt)}</span>
                </div>
              </div>

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.tags.map((tag) => (
                    <Link key={tag.id} href={`/?tag=${encodeURIComponent(tag.name)}`}>
                      <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
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
                    initialCount={article.likes_count}
                    disabled={true} // Will be enabled in Day8
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
              <MDXRemote source={article.body_md} components={mdxComponents} />
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
