"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Eye, EyeOff, MoreHorizontal, Loader2 } from "lucide-react"
import { useUpdateArticle, useDeleteArticle } from "@/lib/api-hooks"
import { useAuth } from "@/lib/auth"
import type { Article } from "@/lib/api-types"

interface ArticleActionsProps {
  article: Article
}

export function ArticleActions({ article }: ArticleActionsProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const updateArticle = useUpdateArticle()
  const deleteArticle = useDeleteArticle()

  // ----- 安全ガード：author が無い/型がズレても落ちない -----
  const isOwner = useMemo(() => {
    if (!user) return false
    if (!article || !article.author) return false
    // id が number / string 混在の可能性に対応
    return String(user.id) === String(article.author.id)
  }, [user, article])

  // オーナー以外はアクション非表示
  if (!isOwner) return null

  const handleEdit = () => {
    router.push(`/articles/${article.id}/edit`)
  }

  const handleTogglePublish = async () => {
    if (isToggling) return
    setIsToggling(true)
    try {
      await updateArticle(String(article.id), {
        is_published: !article.is_published,
      })
      // Next.js 的に優しい再取得
      router.refresh()
    } catch (error) {
      console.error("Failed to toggle publish status:", error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await deleteArticle(String(article.id))
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Failed to delete article:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={handleEdit} disabled={isDeleting || isToggling}>
        <Edit className="h-4 w-4 mr-2" />
        編集
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isDeleting}>
            {isToggling ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleTogglePublish} disabled={isToggling}>
            {isToggling ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                更新中...
              </>
            ) : article.is_published ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                下書きに戻す
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                公開する
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>記事を削除</DialogTitle>
              </DialogHeader>
              <DialogDescription className="mb-4">
                「{article.title}」を削除しますか？この操作は取り消せません。
              </DialogDescription>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                  キャンセル
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      削除中...
                    </>
                  ) : (
                    "削除する"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}