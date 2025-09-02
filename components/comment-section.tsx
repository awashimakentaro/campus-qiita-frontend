"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Send } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import { useComments, useCreateComment } from "@/lib/api-hooks"
import { useAuth } from "@/lib/auth"
import type { Comment } from "@/lib/api-types"

interface CommentSectionProps {
  articleId: string
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex space-x-3 py-4 border-b last:border-b-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.author.avatar || "/placeholder.svg"} alt={comment.author.name} />
        <AvatarFallback className="text-xs">{comment.author.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-sm">{comment.author.name}</span>
          <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.body}</p>
      </div>
    </div>
  )
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const { user } = useAuth()
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 既存APIから取得
  const { comments, loading, refetch } = useComments(articleId)
  const createComment = useCreateComment()

  // 楽観的UI用のローカル配列（未送信/送信中を含む）
  const [localComments, setLocalComments] = useState<Comment[] | null>(null)

  // サーバー配列が更新されたら、ローカルが未設定のとき同期
  useEffect(() => {
    if (localComments === null && comments) {
      setLocalComments(comments)
    }
  }, [comments, localComments])

  // 表示に使う配列：ローカルがあればそれ、なければサーバ
  const displayComments = useMemo(() => {
    return (localComments ?? comments) ?? []
  }, [localComments, comments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = newComment.trim()
    if (!body || isSubmitting) return

    setIsSubmitting(true)

    // 楽観的コメント（仮ID）
    const tempId = `tmp-${Date.now()}`
    const optimistic: Comment = {
      id: tempId,
      body,
      author: {
        id: user?.id ?? "me",
        name: user?.name ?? "あなた",
        email: user?.email ?? "",
        avatar: user?.avatar,
        createdAt: "", // 型に入っていれば無視される
        updatedAt: "",
      } as any, // Author型が User と完全一致しないときの一時回避
      article_id: String(articleId),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 1) 即座に先頭へ反映
    setLocalComments((prev) => [optimistic, ...((prev ?? comments) ?? [])])

    try {
      // 2) サーバへPOST
      const saved = await createComment(articleId, { body })

      // 3) 仮IDのレコードをサーバ応答で置き換え
      setLocalComments((prev) => {
        const base = (prev ?? [])
        const idx = base.findIndex((c) => c.id === tempId)
        if (idx === -1) return [saved, ...base]
        const next = [...base]
        next[idx] = saved
        return next
      })

      // 入力クリア
      setNewComment("")
      // 4) 念のため最新を裏取り（リスト整合性担保）
      refetch()
    } catch (err) {
      console.error("Failed to create comment:", err)
      // 失敗時は楽観的反映をロールバック
      setLocalComments((prev) => (prev ?? []).filter((c) => c.id !== tempId))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          コメント ({displayComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment Form */}
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力してください..."
              className="min-h-[100px] resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!newComment.trim() || isSubmitting} size="sm">
                {isSubmitting ? (
                  "投稿中..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    コメント投稿
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>
              コメントを投稿するには
              <a href="/login" className="text-primary hover:underline">
                ログイン
              </a>
              してください
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-0">
          {loading && displayComments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <p>コメントを読み込み中...</p>
            </div>
          ) : displayComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>まだコメントがありません</p>
              <p className="text-sm">最初のコメントを投稿してみませんか？</p>
            </div>
          ) : (
            displayComments.map((comment) => <CommentItem key={comment.id} comment={comment} />)
          )}
        </div>
      </CardContent>
    </Card>
  )
}