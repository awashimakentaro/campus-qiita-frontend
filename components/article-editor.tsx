"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Eye, ArrowLeft, Loader2 } from "lucide-react"
import { MarkdownEditor } from "./markdown-editor"
import { TagSelector } from "./tag-selector"
import { useCreateArticle, useUpdateArticle, useAddTagToArticle } from "@/lib/api-hooks"
import type { Article, Tag } from "@/lib/api-types"

interface ArticleEditorProps {
  article?: Article
  mode: "create" | "edit"
}

export function ArticleEditor({ article, mode }: ArticleEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(article?.title || "")
  const [body, setBody] = useState(article?.body_md || "")
  const [selectedTags, setSelectedTags] = useState<Tag[]>(article?.tags || [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const createArticle = useCreateArticle()
  const updateArticle = useUpdateArticle()
  const addTagToArticle = useAddTagToArticle()


  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = "タイトルは必須です"
    } else if (title.length > 200) {
      newErrors.title = "タイトルは200文字以内で入力してください"
    }

    if (!body.trim()) {
      newErrors.body = "本文は必須です"
    } else if (body.length < 20) {
      newErrors.body = "本文は20文字以上で入力してください"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Save article (draft or published)
  const handleSave = async (isPublished: boolean) => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      let savedArticle: Article

      if (mode === "create") {
        savedArticle = await createArticle({
          title: title.trim(),
          body_md: body.trim(),
          is_published: isPublished,
        })
      } else {
        savedArticle = await updateArticle(article!.id, {
          title: title.trim(),
          body_md: body.trim(),
          is_published: isPublished,
        })
      }

      // Add tags to article
      const currentIds = Array.isArray(article?.tags) ? article!.tags.map(t => String(t.id)) : []
    const addIds = selectedTags.map(t => String(t.id)).filter(id => !currentIds.includes(id))

    for (const tagId of addIds) {
      try {
        await addTagToArticle(String(savedArticle.id), String(tagId))
      } catch (error) {
        console.error("Failed to add tag:", error)
      }
    }

      // Navigate to article or continue editing
      if (isPublished) {
        router.push(`/articles/${savedArticle.id}`)
      } else if (mode === "create") {
        router.push(`/articles/${savedArticle.id}/edit`)
      }
    } catch (error) {
      console.error("Failed to save article:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (article) {
      router.push(`/articles/${article.id}`)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <div>
            <h1 className="text-2xl font-serif font-bold">{mode === "create" ? "新しい記事を作成" : "記事を編集"}</h1>
            <p className="text-muted-foreground">
              {mode === "create" ? "技術記事を書いて知識を共有しましょう" : "記事の内容を更新できます"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Title Input */}
        <Card>
          <CardHeader>
            <CardTitle>タイトル</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="記事のタイトルを入力してください"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.title}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">{title.length}/200文字</p>
            </div>
          </CardContent>
        </Card>

        {/* Body Editor */}
        <Card>
          <CardHeader>
            <CardTitle>本文</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <MarkdownEditor value={body} onChange={setBody} placeholder="Markdownで記事を書いてください..." />
              {errors.body && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.body}</AlertDescription>
                </Alert>
              )}
              <p className="text-sm text-muted-foreground">{body.length}文字 (最低20文字)</p>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>タグ</CardTitle>
          </CardHeader>
          <CardContent>
            <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} maxTags={10} />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                キャンセル
              </Button>

              <div className="flex items-center space-x-3">
                <Button variant="secondary" onClick={() => handleSave(false)} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      下書き保存
                    </>
                  )}
                </Button>

                <Button onClick={() => handleSave(true)} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      公開中...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      公開する
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
