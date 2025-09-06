import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 文字列/数値/Date を安全に Date へ。失敗したら null */
function toSafeDate(input: unknown): Date | null {
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input
  if (typeof input === "string" || typeof input === "number") {
    const d = new Date(input)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

/** 例: "2025年9月2日"。無効値は "-" を返す */
export function formatDate(dateInput: string | number | Date): string {
  const date = toSafeDate(dateInput)
  if (!date) return "-"
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

/** 相対表現。無効値は "-" を返す */
export function formatRelativeTime(dateInput: string | number | Date): string {
  const date = toSafeDate(dateInput)
  if (!date) return "-"

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "たった今"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}日前`
  return formatDate(date)
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function extractExcerpt(markdown: string, maxLength = 200): string {
  if (!markdown) return ""
  // Markdown → 素のテキストへざっくり変換
  const plainText = markdown
    .replace(/#{1,6}\s+/g, "")               // 見出し
    .replace(/\*\*(.*?)\*\*/g, "$1")         // 太字
    .replace(/\*(.*?)\*/g, "$1")             // 斜体
    .replace(/`(.*?)`/g, "$1")               // インラインコード
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")      // リンク（※元の正規表現を修正）
    .replace(/\n+/g, " ")
    .trim()

  return truncateText(plainText, maxLength)
}

/** ブラウザ/Node どちらでも衝突しない型指定に変更 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}