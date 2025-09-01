import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileX, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <FileX className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">記事が見つかりません</CardTitle>
          <CardDescription>お探しの記事は削除されたか、URLが間違っている可能性があります。</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ホームに戻る
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
