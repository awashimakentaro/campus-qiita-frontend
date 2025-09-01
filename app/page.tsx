import { Header } from "@/components/header"
import { ArticleFeed } from "@/components/article-feed"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-balance mb-4">技術記事を共有しよう</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            大学生・教職員向けの技術記事共有プラットフォームです。
            あなたの知識と経験を共有して、学習コミュニティを盛り上げましょう。
          </p>
        </div>

        <ArticleFeed />
      </main>
    </div>
  )
}
