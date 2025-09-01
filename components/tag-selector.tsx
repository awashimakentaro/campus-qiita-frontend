"use client"

import { useState, useCallback } from "react"
import { X, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTags, useCreateTag } from "@/lib/api-hooks"
import { debounce } from "@/lib/utils"
import type { Tag } from "@/lib/api-types"

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  maxTags?: number
}

export function TagSelector({ selectedTags, onTagsChange, maxTags = 10 }: TagSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const { tags, loading } = useTags({
    query: searchQuery,
    limit: 20,
  })

  const createTag = useCreateTag()

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query)
    }, 300),
    [],
  )

  const handleTagSelect = (tag: Tag) => {
    if (!selectedTags.find((t) => t.id === tag.id) && selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tag])
    }
    setIsOpen(false)
  }

  const handleTagRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagId))
  }

  const handleCreateTag = async (name: string) => {
    if (isCreating || !name.trim()) return

    setIsCreating(true)
    try {
      const newTag = await createTag({ name: name.trim() })
      handleTagSelect(newTag)
      setSearchQuery("")
    } catch (error) {
      console.error("Failed to create tag:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const availableTags = tags.filter((tag) => !selectedTags.find((selected) => selected.id === tag.id))
  const canCreateNew = searchQuery.trim() && !tags.find((tag) => tag.name.toLowerCase() === searchQuery.toLowerCase())

  return (
    <div className="space-y-3">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-1">
              {tag.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => handleTagRemove(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Selector */}
      {selectedTags.length < maxTags && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start bg-transparent">
              <Plus className="h-4 w-4 mr-2" />
              タグを追加 ({selectedTags.length}/{maxTags})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="タグを検索または作成..." onValueChange={debouncedSearch} />
              <CommandList>
                <CommandEmpty>{loading ? "検索中..." : "タグが見つかりません"}</CommandEmpty>

                {/* Existing Tags */}
                {availableTags.length > 0 && (
                  <CommandGroup heading="既存のタグ">
                    {availableTags.map((tag) => (
                      <CommandItem key={tag.id} onSelect={() => handleTagSelect(tag)}>
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Create New Tag */}
                {canCreateNew && (
                  <CommandGroup heading="新しいタグ">
                    <CommandItem onSelect={() => handleCreateTag(searchQuery)} disabled={isCreating}>
                      <Plus className="mr-2 h-4 w-4" />「{searchQuery}」を作成
                      {isCreating && <span className="ml-auto text-xs">作成中...</span>}
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {selectedTags.length >= maxTags && (
        <p className="text-sm text-muted-foreground">最大{maxTags}個のタグまで選択できます</p>
      )}
    </div>
  )
}
