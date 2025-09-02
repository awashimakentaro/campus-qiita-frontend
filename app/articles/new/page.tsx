// app/articles/new/page.tsx
import type { Metadata } from "next"
import {ArticleEditor} from "@/components/article-editor" // ← default exportで作った場合
// もし named export なら: import { ArticleEditor } from "@/components/article-editor"
import { AuthGuard } from "@/components/auth-guard" // ある場合だけでOK。無ければ外しても可。

export const metadata: Metadata = {
  title: "新規記事作成",
  description: "大学内ナレッジの新規記事を作成します",
}

export default function NewArticlePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 認証ガードがある場合は包む（未ログインならログインへ誘導） */}
      <AuthGuard>
        <ArticleEditor mode="create" />
      </AuthGuard>
    </div>
  )
}