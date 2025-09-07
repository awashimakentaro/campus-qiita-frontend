"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
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
  login: () => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const auth = getAuth(app)

  const refreshUser = async () => {
    try {
      const me = await apiClient.get<User>("/auth/me")
      setUser(me)
    } catch (err) {
      console.error("refreshUser error:", err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()
      console.log("✅ Firebase ID Token:", idToken)

      // BE に渡して Cookie を発行してもらう
      await apiClient.post("/auth/firebase-login", { idToken })

      // Cookie 発行済みなので /auth/me が成功するはず
      await refreshUser()
    } catch (err) {
      console.error("Login failed:", err)
    }
  }

  const logout = async () => {
    try {
      await auth.signOut()
      await apiClient.post("/auth/logout") // Cookie を消す
    } finally {
      setUser(null)
    }
  }

  useEffect(() => {
    refreshUser()
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