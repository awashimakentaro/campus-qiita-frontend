"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"

type Props = { children: React.ReactNode }

export function AuthGuard({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [status, setStatus] = useState<"loading" | "ok" | "ng">("loading")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // BEのHttpOnly Cookieは fetch(credentials: 'include') で送られるs
        await apiClient.get("/auth/me")
        if (!cancelled) setStatus("ok")
      } catch {
        if (!cancelled) setStatus("ng")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathname])

  if (status === "loading") {
    return <div className="container mx-auto px-4 py-12">認証確認中...</div>
  }

  if (status === "ng") {
    const loginUrl = `${process.env.NEXT_PUBLIC_API_BASE}/auth/login?redirect=${encodeURIComponent(
      typeof window !== "undefined" ? window.location.origin + pathname : "/",
    )}`
    return (
      <div className="container mx-auto px-4 py-12 space-y-4">
        <p>このページを閲覧するにはログインが必要です。</p>
        <Button asChild>
          <a href={loginUrl}>Googleでログイン</a>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}