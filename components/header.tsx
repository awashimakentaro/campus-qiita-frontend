// components/header.tsx
"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PenSquare, User, LogOut, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth"

export function Header() {
  const { user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">Q</span>
          </div>
          <span className="font-serif font-bold text-xl text-primary">大学版Qiita</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center space-x-4">
          {/* 投稿する：SSR とクライアントで不一致が出ないよう mounted を考慮 */}
          <Button asChild variant="default" size="sm">
            <Link href={mounted && user ? "/articles/new" : "/login"}>
              <PenSquare className="h-4 w-4 mr-2" />
              投稿する
            </Link>
          </Button>

          {/* マイ記事：マウント後にだけユーザー判定 */}
          {mounted && user && (
            <Button asChild variant="default" size="sm">
              <Link href="/my" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                マイ記事
              </Link>
            </Button>
          )}

          {/* アバターメニュー or ログインボタン：マウント後にだけユーザー判定 */}
          {mounted && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    プロフィール
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline">
              <Link href="/login">ログイン</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}