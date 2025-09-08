// components/article-card.tsx
"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Calendar } from "lucide-react"
import { formatRelativeTime, extractExcerpt } from "@/lib/utils"
import type { Article } from "@/lib/api-types"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth"

interface ArticleCardProps {
  article: Article
}

type SlimUser = {
  id: string | number
  name: string
  email?: string
  avatar?: string | null
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { user: me } = useAuth()

  // ---- 元データ（null安全）----
  const rawTags = (article as any).tags
  const tags: any[] = Array.isArray(rawTags) ? rawTags : []

  const createdAt =
    (article as any).createdAt ??
    (article as any).created_at ??
    ""

  const bodyMd = (article as any).body_md ?? (article as any).body ?? ""
  const excerpt = (article as any).excerpt || extractExcerpt(String(bodyMd), 200)

  // ---- いいね / コメント は従来通り取得 ----
  const [likeCount, setLikeCount] = useState<number>((article as any).likes_count ?? 0)
  useEffect(() => {
    let cancelled = false
    const fetchLikes = async () => {
      try {
        const res = await apiClient.get<{ liked: boolean; likes_count: number }>(
          `/v1/articles/${String((article as any).id)}/likes`,
        )
        if (!cancelled && res && typeof res.likes_count === "number") {
          setLikeCount(res.likes_count)
        }
      } catch {
        // サイレント失敗
      }
    }
    fetchLikes()
    return () => {
      cancelled = true
    }
  }, [article])

  const [commentsCount, setCommentsCount] = useState<number>((article as any).comments_count ?? 0)
  useEffect(() => {
    let cancelled = false
    const fetchCommentsCount = async () => {
      try {
        const res = await apiClient.get<any[]>(`/v1/articles/${String((article as any).id)}/comments`)
        if (!cancelled && Array.isArray(res)) {
          setCommentsCount(res.length)
        }
      } catch {
        // サイレント失敗
      }
    }
    fetchCommentsCount()
    return () => {
      cancelled = true
    }
  }, [article])

  // ---- 著者情報の決定ロジック ----
  // 1) API が article.author を返しているならそれを使う
  const authorFromArticle = useMemo((): SlimUser | null => {
    const a = (article as any).author
    if (a && typeof a === "object") {
      return {
        id: a.id ?? (article as any).author_id,
        name: a.name ?? "Unknown",
        email: a.email,
        avatar: a.avatar ?? null,
      }
    }
    return null
  }, [article])

  // 2) 無ければ author_id から /v1/users/:id を1回だけ取りに行く
  const [authorFetched, setAuthorFetched] = useState<SlimUser | null>(null)
  useEffect(() => {
    let cancelled = false
    const needFetch = !authorFromArticle && (article as any).author_id
    if (!needFetch) return

    const fetchAuthor = async () => {
      try {
        const uid = String((article as any).author_id)
        const res = await apiClient.get<any>(`/v1/users/${uid}`)
        if (!cancelled && res) {
          setAuthorFetched({
            id: res.id ?? uid,
            name: res.name ?? "Unknown",
            email: res.email,
            avatar: res.avatar ?? null,
          })
        }
      } catch {
        // 取得失敗時はフォールバックに任せる
      }
    }
    fetchAuthor()
    return () => {
      cancelled = true
    }
  }, [authorFromArticle, article])

  // 3) さらに無ければ「自分が投稿者なら自分情報」を使う
  const authorFromSelf = useMemo((): SlimUser | null => {
    const aid = String((article as any).author_id ?? "")
    const mid = me ? String(me.id) : ""
    if (me && aid && aid === mid) {
      return { id: me.id, name: me.name, email: me.email, avatar: (me as any).avatar ?? null }
    }
    return null
  }, [article, me])

  // 最終的に使う著者
  const author: SlimUser = authorFromArticle ?? authorFetched ?? authorFromSelf ?? {
    id: (article as any).author_id ?? "",
    name: "Unknown",
    email: "",
    avatar: null,
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/articles/${article.id}`}>
              <CardTitle className="text-lg leading-tight mb-2 hover:text-primary cursor-pointer text-balance">
                {article.title}
              </CardTitle>
            </Link>
            <CardDescription className="text-sm leading-relaxed text-pretty">{excerpt}</CardDescription>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag: any) => (
              <Link key={String(tag.id ?? tag.name ?? Math.random())} href={`/?tag=${encodeURIComponent(tag.name ?? "")}`}>
                <Badge variant="secondary" className="text-xs hover:bg-secondary/80 cursor-pointer">
                  {tag.name ?? "tag"}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src={author.avatar || "/placeholder.svg"} alt={author.name} />
              <AvatarFallback className="text-xs">{String(author.name).charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{author.name}</span>
              {createdAt && (
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatRelativeTime(String(createdAt))}</span>
                </div>
              )}
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{likeCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{commentsCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}