import { AuthGuard } from "@/components/auth-guard"
import { ArticleEditor } from "@/components/article-editor"

export default function NewArticlePage() {
  return (
    <AuthGuard>
      <ArticleEditor mode="create" />
    </AuthGuard>
  )
}
