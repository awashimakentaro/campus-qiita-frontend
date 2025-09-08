// lib/auth.tsx
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth"
import { app } from "@/lib/firebase"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const auth = getAuth(app)

  // BE のクッキーを使って現在ユーザーを取得
  const refreshUser = async () => {
    try {
      const me = await apiClient.get<User>("/auth/me") // ← Authorization ヘッダ不要（Cookieで認証）
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Google でログイン → Firebase ID トークンを BE に渡してクッキー発行
// lib/auth.tsx の login を一時的に差し替え
const login = async () => {
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()
  console.log("[login] start")

  try {
    const result = await signInWithPopup(auth, provider)
    console.log("[login] signInWithPopup OK", {
      uid: result.user.uid,
      email: result.user.email,
    })

    const idToken = await result.user.getIdToken()
    console.log("[login] got idToken length:", idToken?.length)

    // BE へ idToken を投げる
    try {
      const res = await apiClient.post("/auth/firebase-login", { idToken })
      console.log("[login] POST /auth/firebase-login OK", res)
    } catch (e) {
      console.error("[login] POST /auth/firebase-login FAILED", e)
    }

    // BE セッションで /auth/me 取得
    try {
      await refreshUser()
      console.log("[login] refreshUser done")
    } catch (e) {
      console.error("[login] refreshUser FAILED", e)
    }
  } catch (err) {
    console.error("[login] signInWithPopup FAILED", err)
  }
}

  const logout = async () => {
    try {
      await auth.signOut()
    } finally {
      // BE のセッションクッキーも削除
      try {
        await apiClient.post("/auth/logout")
      } catch {/* noop */}
      setUser(null)
    }
  }

  // 初回：Firebase セッション変化を拾って BE 側も同期
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // 既に BE にセッションがある場合は /auth/me が通る
        await refreshUser()
      } else {
        setUser(null)
        setLoading(false)
      }
    })
    return () => unsub()
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