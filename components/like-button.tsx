"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { useLike } from "@/lib/api-hooks"

type Props = {
  articleId: string | number
  initialCount?: number
  className?: string
}

export function LikeButton({ articleId, initialCount = 0, className }: Props) {
  const id = useMemo(() => String(articleId), [articleId])
  const { user } = useAuth()
  const { state, loading, like, unlike } = useLike(id)

  // 表示用の局所状態（初回は initialCount、取得後はAPIの値を使用）
  const [count, setCount] = useState<number>(initialCount)
  const [liked, setLiked] = useState<boolean>(false)

  useEffect(() => {
    if (state) {
      setCount(state.likes_count)
      setLiked(state.liked)
    }
  }, [state])

  const handleToggle = async () => {
    // 未ログインならログインページへ
    if (!user) {
      window.location.href = "/login"
      return
    }

    try {
      if (liked) {
        const res = await unlike()
        setLiked(res.liked)
        setCount(res.likes_count)
      } else {
        const res = await like()
        setLiked(res.liked)
        setCount(res.likes_count)
      }
    } catch {
      // トーストは useLike 側で表示済み
    }
  }

  return (
    <Button
      variant={liked ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={className}
    >
      <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-current" : ""}`} />
      {liked ? "いいね済み" : "いいね"}・{count}
    </Button>
  )
}