"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Edit3 } from "lucide-react"
import DOMPurify from "dompurify"
import { marked } from "marked"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minLength?: number
}

marked.setOptions({
  breaks: true,
  gfm: true,
})

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className,
  minLength = 20,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  const sanitizedHtml = useMemo(() => {
    const raw = marked.parse(value || "")
    return DOMPurify.sanitize(raw as string)
  }, [value])

  const lengthOK = (value?.trim()?.length ?? 0) >= minLength

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
        <div className="mb-2 flex items-center justify-between">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              編集
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              プレビュー
            </TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">
            {value.trim().length} 文字（最小 {minLength}）
          </div>
        </div>

        <TabsContent value="edit" className="mt-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Markdownで記事を書いてください..."}
            className="min-h-[400px] font-mono text-sm leading-relaxed resize-none"
          />
          {!lengthOK && (
            <p className="mt-2 text-xs text-red-600">
              本文が短すぎます。最低 {minLength} 文字以上にしてください。
            </p>
          )}
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="min-h-[400px] border rounded-md p-4 bg-card prose prose-sm max-w-none">
            {value.trim() ? (
              // eslint-disable-next-line react/no-danger
              <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
            ) : (
              <p className="text-muted-foreground italic">プレビューするには左側で記事を書いてください</p>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">※ 表示はサニタイズ済みHTMLです。</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}