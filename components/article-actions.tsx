"use client"

import { useState } from "react"
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

  // In production, this should check if user.id === article.author.id
  if (!user) {
    return null
  }

  // For demo purposes, show edit button to all logged-in users
  // In production, uncomment the line below:
  // if (user.id !== article.author.id) return null

  const handleEdit = () => {
    router.push(`/articles/${article.id}/edit`)
  }

  const handleTogglePublish = async () => {
    setIsToggling(true)
    try {
      await updateArticle(article.id, {
        is_published: !article.is_published,
      })
      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      console.error("Failed to toggle publish status:", error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteArticle(article.id)
      router.push("/")
    } catch (error) {
      console.error("Failed to delete article:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={handleEdit}>
        <Edit className="h-4 w-4 mr-2" />
        編集
      </Button>

      {user && article.author && String(user.id) === String(article.author.id) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleTogglePublish} disabled={isToggling}>
              {isToggling ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : article.is_published ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {article.is_published ? "下書きに戻す" : "公開する"}
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
                  <DialogDescription>「{article.title}」を削除しますか？この操作は取り消せません。</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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
      )}
    </div>
  )
}
