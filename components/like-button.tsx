"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  articleId: string
  initialLiked?: boolean
  initialCount: number
  disabled?: boolean
}

export function LikeButton({ articleId, initialLiked = false, initialCount, disabled = true }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)

  const handleLike = async () => {
    if (disabled) return

    // TODO: Implement like functionality in Day8
    // For now, just show the UI
    setLiked(!liked)
    setCount(liked ? count - 1 : count + 1)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      disabled={disabled}
      className={cn("gap-2", liked && "text-red-500")}
    >
      <Heart className={cn("h-4 w-4", liked && "fill-current")} />
      <span>{count}</span>
    </Button>
  )
}
