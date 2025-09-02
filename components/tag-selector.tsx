"use client"

import { useState, useCallback, useMemo } from "react"
import { X, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTags, useCreateTag } from "@/lib/api-hooks"
import { debounce } from "@/lib/utils"
import type { Tag } from "@/lib/api-types"

type TagSelectorProps = {
  selectedTags?: Tag[]                       // ← optional（安全化）
  onTagsChange?: (tags: Tag[]) => void       // ← optional（安全化）
  maxTags?: number
}

export function TagSelector({
  selectedTags = [],                          // ← 既定は空配列
  onTagsChange = () => {},                    // ← 既定は no-op
  maxTags = 10,
}: TagSelectorProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // 入力は即座に state に反映しつつ、API検索はデバウンス
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useCallback(
    debounce((q: string) => setSearchQuery(q), 250),
    []
  )
  const handleInputChange = (val: string) => {
    setQuery(val)
    debouncedSearch(val)
  }

  const { tags = [], loading } = useTags(
    searchQuery ? { query: searchQuery, limit: 20 } : undefined
  )

  const createTag = useCreateTag()

  const lower = (s: string) => s.trim().toLowerCase()
  const hasCapacity = selectedTags.length < maxTags

  // 既に選択済みを除いた候補
  const availableTags = useMemo(() => {
    const selectedSet = new Set(selectedTags.map((t) => t.id))
    return (tags || []).filter((t) => !selectedSet.has(t.id))
  }, [tags, selectedTags])

  // 既存タグにも選択タグにも存在しない完全新規なら作成可能
  const canCreateNew = useMemo(() => {
    const q = lower(query)
    if (!q) return false
    const existsInFetched = (tags || []).some((t) => lower(t.name) === q)
    const existsInSelected = selectedTags.some((t) => lower(t.name) === q)
    return !existsInFetched && !existsInSelected
  }, [query, tags, selectedTags])

  const addTag = (tag: Tag) => {
    if (!hasCapacity) return
    if (selectedTags.some((t) => t.id === tag.id)) return
    onTagsChange([...selectedTags, tag])
  }

  const removeTag = (id: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== id))
  }

  const handleSelectExisting = (tag: Tag) => {
    addTag(tag)
    setIsOpen(false)
    setQuery("")
    setSearchQuery("")
  }

  const handleCreateNew = async (name: string) => {
    const n = name.trim()
    if (!n || !hasCapacity || isCreating) return
    setIsCreating(true)
    try {
      const newTag = await createTag({ name: n })
      addTag(newTag)
      setIsOpen(false)
      setQuery("")
      setSearchQuery("")
    } catch (e) {
      console.error("Failed to create tag:", e)
    } finally {
      setIsCreating(false)
    }
  }

  // Enter / カンマ(,)での追加にも対応
  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!hasCapacity) return
    if (e.key === "Enter" || e.key === "," ) {
      e.preventDefault()
      const n = query.trim()
      if (!n) return
      // 既存候補に完全一致があればそれを選択、なければ新規作成
      const exact = (tags || []).find((t) => lower(t.name) === lower(n))
      if (exact) {
        handleSelectExisting(exact)
      } else if (canCreateNew) {
        void handleCreateNew(n)
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* 選択済み */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((t) => (
            <Badge key={t.id} variant="secondary" className="gap-1">
              {t.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => removeTag(t.id)}
                aria-label={`${t.name} を外す`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* セレクタ */}
      {hasCapacity ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              タグを追加 ({selectedTags.length}/{maxTags})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput
                value={query}
                onValueChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="タグを検索または作成..."
              />
              <CommandList>
                <CommandEmpty>{loading ? "検索中..." : "タグが見つかりません"}</CommandEmpty>

                {/* 既存タグ候補 */}
                {availableTags.length > 0 && (
                  <CommandGroup heading="既存のタグ">
                    {availableTags.map((t) => (
                      <CommandItem key={t.id} onSelect={() => handleSelectExisting(t)}>
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        {t.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* 新規作成 */}
                {canCreateNew && (
                  <CommandGroup heading="新しいタグ">
                    <CommandItem onSelect={() => handleCreateNew(query)} disabled={isCreating}>
                      <Plus className="mr-2 h-4 w-4" />
                      「{query}」を作成
                      {isCreating && <span className="ml-auto text-xs">作成中...</span>}
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <p className="text-sm text-muted-foreground">最大{maxTags}個のタグまで選択できます</p>
      )}
    </div>
  )
}