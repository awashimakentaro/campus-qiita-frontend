// lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
}

// Singleton 初期化
let app: FirebaseApp
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]!
}

// Auth 準備（永続化: ローカル）
const auth: Auth = getAuth(app)
setPersistence(auth, browserLocalPersistence).catch(() => {
  // 失敗しても致命的ではないので握りつぶす
})

// Google プロバイダ（後で使う）
const googleProvider = new GoogleAuthProvider()

export { app, auth, googleProvider }