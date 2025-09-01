"use client"

import type React from "react"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Edit3 } from "lucide-react"
import { MDXRemote } from "next-mdx-remote/rsc"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

// MDX components for rendering
const mdxComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="text-3xl font-serif font-bold mt-8 mb-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-2xl font-serif font-bold mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-xl font-serif font-bold mt-4 mb-2">{children}</h3>
  ),
  p: ({ children }: { children: React.ReactNode }) => <p className="mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">{children}</blockquote>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 text-sm">
      <code className="font-mono">{children}</code>
    </pre>
  ),
  a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
    <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full border-collapse border border-border">{children}</table>
    </div>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">{children}</th>
  ),
  td: ({ children }: { children: React.ReactNode }) => <td className="border border-border px-4 py-2">{children}</td>,
}

export function MarkdownEditor({ value, onChange, placeholder, className }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")}>
        <div className="flex items-center justify-between mb-2">
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
        </div>

        <TabsContent value="edit" className="mt-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Markdownで記事を書いてください..."}
            className="min-h-[400px] font-mono text-sm leading-relaxed resize-none"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="min-h-[400px] border rounded-md p-4 bg-card">
            {value.trim() ? (
              <div className="prose prose-sm max-w-none">
                <MDXRemote source={value} components={mdxComponents} />
              </div>
            ) : (
              <p className="text-muted-foreground italic">プレビューするには左側で記事を書いてください</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
