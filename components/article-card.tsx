"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Calendar } from "lucide-react"
import { formatRelativeTime, extractExcerpt } from "@/lib/utils"
import type { Article } from "@/lib/api-types"
import { useState, useEffect } from "react"  
import { apiClient } from "@/lib/api-client"   


interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  // ✅ 欠損に強いフォールバック
  const tags = Array.isArray((article as any).tags) ? (article as any).tags : []
  const author =
    (article as any).author ?? {
      id: "",
      name: "Unknown",
      email: "",
      avatar: null,
      createdAt: "",
      updatedAt: "",
    }
  const createdAt =
    (article as any).createdAt ??
    (article as any).created_at ?? // BE が snake_case の場合も考慮
    ""
  const likes = (article as any).likes_count ?? 0 

  const bodyMd = (article as any).body_md ?? (article as any).body ?? ""
  const excerpt = (article as any).excerpt || extractExcerpt(String(bodyMd), 200)

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
        // サイレント失敗（一覧カードなのでトーストは出さない）
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
      // サイレント失敗（一覧カードなのでトーストは出さない）
    }
  }
  fetchCommentsCount()
  return () => { cancelled = true }
}, [article])

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
              <Link key={String(tag.id)} href={`/?tag=${encodeURIComponent(tag.name ?? "")}`}>
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