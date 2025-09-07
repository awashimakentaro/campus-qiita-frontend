// lib/auth-client.ts
import { signInWithPopup } from "firebase/auth"
import { auth, googleProvider } from "./firebase"
import { apiClient } from "./api-client"

// Googleログインして BE に idToken を渡す
export async function loginWithGoogle() {
  // Firebase popupでGoogleログイン
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user

  // IDトークンを取得
  const idToken = await user.getIdToken()

  // BEに送信 → Cookie セッション発行
  const me = await apiClient.post("/auth/firebase-login", { idToken })

  return me
}