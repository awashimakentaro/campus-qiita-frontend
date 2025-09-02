// components/tag-selector.tsx
"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useTags } from "@/lib/api-hooks"
import type { Tag } from "@/lib/api-types"

type Props = {
  selectedTags?: Tag[]               // ← optional
  onTagsChange?: (tags: Tag[]) => void // ← optional
  maxTags?: number
  placeholder?: string
}

export function TagSelector({
  selectedTags = [],                 // ← デフォルト空配列
  onTagsChange = () => {},           // ← デフォルト no-op
  maxTags = 10,
  placeholder = "タグ名で検索または作成してEnter",
}: Props) {
  const [query, setQuery] = useState("")
  const { tags: candidates } = useTags(query ? { query, limit: 10 } : undefined)

  const canAddMore = selectedTags.length < maxTags

  const addTag = (tag: Tag) => {
    if (!canAddMore) return
    if (selectedTags.some((t) => t.id === tag.id)) return
    onTagsChange([...selectedTags, tag])
    setQuery("")
  }

  const removeTag = (id: string) => {
    onTagsChange(selectedTags.filter((t) => t.id === id)) // ← selectedTagsは必ず配列
  }

  const filteredCandidates = useMemo(() => {
    const lower = query.trim().toLowerCase()
    if (!lower) return candidates ?? []
    return (candidates ?? []).filter((t) => t.name.toLowerCase().includes(lower))
  }, [candidates, query])

  return (
    <div className="space-y-2">
      {/* 入力 */}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            const name = query.trim()
            if (!name || !canAddMore) return
            // 仮タグ（idは一時的にnameを使う or BE作成後に差し替え）
            const temp: Tag = { id: name, name, createdAt: "", updatedAt: "" }
            addTag(temp)
          }
        }}
      />

      {/* 選択済みタグ */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
              {t.name}
              <button
                type="button"
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={() => removeTag(t.id)}
                aria-label={`${t.name} を削除`}
              >
                <X className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 候補表示（任意） */}
      {filteredCandidates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filteredCandidates.slice(0, 10).map((t) => (
            <Button
              key={t.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTag(t)}
              disabled={!canAddMore}
            >
              + {t.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}