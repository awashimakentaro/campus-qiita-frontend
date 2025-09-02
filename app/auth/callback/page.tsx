"use client"
//成功
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get("error")
      const code = searchParams.get("code")

      if (error) {
        setStatus("error")
        if (error === "domain_not_allowed") {
          setMessage("許可されていないドメインです。大学のGoogleアカウントでログインしてください。")
        } else {
          setMessage("認証に失敗しました。もう一度お試しください。")
        }
        return
      }

      if (!code) {
        setStatus("error")
        setMessage("認証コードが見つかりません。") 
        return
      }

      try {
        // Exchange code for tokens and set cookies
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/callback`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        })

        if (response.ok) {
          setStatus("success")
          setMessage("ログインに成功しました。リダイレクトしています...")
          setTimeout(() => {
            router.push("/")
          }, 2000)
        } else {
          const errorData = await response.json()
          setStatus("error")
          setMessage(errorData.message || "認証に失敗しました。")
        }
      } catch (err) {
        setStatus("error")
        setMessage("ネットワークエラーが発生しました。")
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {status === "success" && <CheckCircle className="h-12 w-12 text-green-600" />}
            {status === "error" && <XCircle className="h-12 w-12 text-destructive" />}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "認証中..."}
            {status === "success" && "ログイン成功"}
            {status === "error" && "ログイン失敗"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "認証情報を確認しています"}
            {status === "success" && "ホームページにリダイレクトします"}
            {status === "error" && "認証に問題が発生しました"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={status === "error" ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          {status === "error" && (
            <Button onClick={() => router.push("/login")} className="w-full">
              ログインページに戻る
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
