"use client"

import { useState, useCallback } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { debounce } from "@/lib/utils"
import { useTags } from "@/lib/api-hooks"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ArticleSearchProps {
  onSearchChange: (query: string) => void
  onTagsChange: (tags: string[]) => void
  searchQuery: string
  selectedTags: string[]
}

export function ArticleSearch({ onSearchChange, onTagsChange, searchQuery, selectedTags }: ArticleSearchProps) {
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false)

  const { tags, loading: tagsLoading } = useTags({
    query: tagSearchQuery,
    limit: 20,
  })

  // Debounced search to avoid too many API calls
  const debouncedSearchChange = useCallback(
    debounce((query: string) => {
      onSearchChange(query)
    }, 300),
    [onSearchChange],
  )

  const handleSearchInputChange = (value: string) => {
    debouncedSearchChange(value)
  }

  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName])
    }
    setIsTagPopoverOpen(false)
    setTagSearchQuery("")
  }

  const handleTagRemove = (tagName: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagName))
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="記事を検索..."
          className="pl-10 bg-muted/50"
          defaultValue={searchQuery}
          onChange={(e) => handleSearchInputChange(e.target.value)}
        />
      </div>

      {/* Tag Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              タグで絞り込み
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="タグを検索..." value={tagSearchQuery} onValueChange={setTagSearchQuery} />
              <CommandList>
                <CommandEmpty>{tagsLoading ? "読み込み中..." : "タグが見つかりません"}</CommandEmpty>
                <CommandGroup>
                  {tags?.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleTagSelect(tag.name)}
                      disabled={selectedTags.includes(tag.name)}
                    >
                      {tag.name}
                      {selectedTags.includes(tag.name) && (
                        <span className="ml-auto text-xs text-muted-foreground">選択済み</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected Tags */}
        {selectedTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={() => handleTagRemove(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
