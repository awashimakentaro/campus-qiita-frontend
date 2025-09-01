"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Flag, Send } from "lucide-react"

interface ReportDialogProps {
  articleId: string
  articleTitle: string
}

export function ReportDialog({ articleId, articleTitle }: ReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      // TODO: Implement report functionality in Day12
      // For now, just simulate the submission
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSubmitted(true)
      setReason("")
    } catch (error) {
      console.error("Failed to submit report:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setSubmitted(false)
    setReason("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Flag className="h-4 w-4 mr-2" />
          通報
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>記事を通報</DialogTitle>
          <DialogDescription>「{articleTitle}」を通報する理由を教えてください。</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>通報を受け付けました。内容を確認後、適切な対応を行います。</AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button onClick={handleClose}>閉じる</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="通報理由を詳しく教えてください..."
              className="min-h-[100px] resize-none"
              required
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                キャンセル
              </Button>
              <Button type="submit" disabled={!reason.trim() || isSubmitting} variant="destructive">
                {isSubmitting ? (
                  "送信中..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    通報する
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
