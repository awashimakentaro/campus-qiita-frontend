import type React from "react"
import type { Metadata } from "next"
import { Playfair_Display } from "next/font/google"
import { Source_Sans_3 } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth"
import { Suspense } from "react"
import "./globals.css"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair-display",
})

const sourceSansPro = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-sans-pro",
})

export const metadata: Metadata = {
  title: "大学版Qiita - 技術記事共有プラットフォーム",
  description: "大学生・教職員向けの技術記事共有プラットフォーム",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`font-sans ${playfairDisplay.variable} ${sourceSansPro.variable} ${GeistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Suspense fallback={null}>
            {children}
            <Toaster />
          </Suspense>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
