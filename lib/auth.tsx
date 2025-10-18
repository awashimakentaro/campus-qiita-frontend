// lib/auth.tsx
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { apiClient } from "@/lib/api-client"
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth"
import { app } from "@/lib/firebase"

// ===== types =====
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

// ===== helpers =====
function isMobile() {
  if (typeof navigator === "undefined") return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

// ===== provider =====
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const bootstrappedRef = useRef(false) // onAuthStateChanged での多重処理防止

  const auth = getAuth(app)

  /** BE クッキーで /auth/me 取得。401なら静かにブートストラップを試みる */
  const refreshUser = async () => {
    try {
      const me = await apiClient.get<User>("/auth/me")
      setUser(me)
    } catch {
      // サーバーにセッションが無い（401）の場合、Firebaseログイン済みならセッション確立を試す
      try {
        const fbUser = auth.currentUser
        if (fbUser) {
          const idToken = await fbUser.getIdToken()
          await apiClient.post("/auth/firebase-login", { idToken })
          const me = await apiClient.get<User>("/auth/me")
          setUser(me)
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  /** Google でログイン → /auth/firebase-login で BE セッション確立 → /auth/me */
  const login = async () => {
    const provider = new GoogleAuthProvider()
    try {
      if (isMobile()) {
        await signInWithRedirect(auth, provider)
        return
      } else {
        const cred = await signInWithPopup(auth, provider)
        const idToken = await cred.user.getIdToken()
        await apiClient.post("/auth/firebase-login", { idToken })
        await refreshUser()
      }
    } catch (err: any) {
      // Popup競合などはユーザー操作の範囲なので握りつぶす
      if (err?.code === "auth/cancelled-popup-request") return
      console.error("[login] failed:", err)
      throw err
    }
  }

  /** ログアウト（Firebase→BEセッション破棄） */
  const logout = async () => {
    try {
      await auth.signOut()
    } finally {
      try {
        await apiClient.post("/auth/logout")
      } catch {/* noop */}
      setUser(null)
    }
  }

  /** 初回起動：Firebaseの状態に合わせて BE 側も同期 */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (bootstrappedRef.current) return
      bootstrappedRef.current = true

      if (fbUser) {
        // 既にログインしているなら BE のセッションも揃える
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
