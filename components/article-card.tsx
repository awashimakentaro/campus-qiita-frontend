"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Calendar } from "lucide-react"
import { formatRelativeTime, extractExcerpt } from "@/lib/utils"
import type { Article } from "@/lib/api-types"

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  const excerpt = article.excerpt || extractExcerpt(article.body_md, 200)

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
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {article.tags.map((tag) => (
              <Link key={tag.id} href={`/?tag=${encodeURIComponent(tag.name)}`}>
                <Badge variant="secondary" className="text-xs hover:bg-secondary/80 cursor-pointer">
                  {tag.name}
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
              <AvatarImage src={article.author.avatar || "/placeholder.svg"} alt={article.author.name} />
              <AvatarFallback className="text-xs">{article.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{article.author.name}</span>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatRelativeTime(article.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{article.likes_count}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{article.comments_count}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
