"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      // apiClient経由に変更（BASE/CORS/credentialsは内部で統一）
      const me = await apiClient.get<User>("/auth/me")
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = () => {
    // BEの /auth/login に直接リダイレクト（現在URLを戻り先に）
    const base = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000").replace(/\/+$/, "")
    const redirect = typeof window !== "undefined" ? window.location.href : "/"
    window.location.href = `${base}/auth/login?redirect=${encodeURIComponent(redirect)}`
  }

  const logout = async () => {
    try {
      // まだBEに /auth/logout が無いならこの呼び出しは失敗してもOK
      await apiClient.post("/auth/logout")
    } catch {
      // noop
    } finally {
      setUser(null)
      // ログインへ（BEのログインに飛ばすほうが確実）
      login()
    }
  }

  useEffect(() => {
    refreshUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}