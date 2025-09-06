// lib/api-types.ts
// このファイルはバックエンドの API レスポンスに対応する TS の型を定義するファイル。
// 実際に API と通信するのは lib/api-client.ts ですが、その戻り値に型をつけて安全に扱うために存在します。

export interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
  createdAt?: string
  updatedAt?: string
  // BE が snake_case の場合にも対応
  created_at?: string
  updated_at?: string
}

export interface Tag {
  id: string | number
  name: string
  description?: string | null
  createdAt?: string
  updatedAt?: string
  // snake_case 互換
  created_at?: string
  updated_at?: string
}

export interface Article {
  id: string | number
  author_id: string | number
  title: string
  body_md: string
  body_html?: string
  excerpt?: string
  is_published: boolean

  // リレーションが未展開のこともあるので optional にしておく
  author?: User | null
  tags?: Tag[]

  // 集計フィールドは BE によって無いこともあるので optional
  likes_count?: number
  comments_count?: number

  // 日付は camel/snake 両対応
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

export interface Comment {
  id: string | number
  body: string
  author: User
  article_id: string | number
  createdAt?: string
  updatedAt?: string
  created_at?: string
  updated_at?: string
}

export interface CreateArticleRequest {
  title: string
  body_md: string
  is_published: boolean
}

export interface UpdateArticleRequest {
  title?: string
  body_md?: string
  is_published?: boolean
}

export interface CreateTagRequest {
  name: string
  description?: string
}

export interface CreateCommentRequest {
  body: string
}

export interface ArticleFilters {
  query?: string
  tag?: string | string[]
  author?: string
  is_published?: boolean
  page?: number
  limit?: number
  // 並び替えキーに comments を追加（コメント数順）
  sort?: "popular" | "recent" | "oldest" | "comments"
}

export interface TagFilters {
  query?: string
  page?: number
  limit?: number
}

// いいねAPIの共通レスポンス
export interface LikeResponse {
  liked: boolean
  likes_count: number
}