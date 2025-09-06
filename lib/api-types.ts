// このファイルはバックエンドのapiレスポンスに対応するtsの方を定義するファイル
//実際に API と通信するのは lib/api-client.ts ですが、その戻り値に型をつけて安全に扱うために api-types.ts が存在します。

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Article {
  id: string
  author_id: string | number
  title: string
  body_md: string
  body_html?: string
  excerpt?: string
  is_published: boolean
  author: User
  tags: Tag[]
  likes_count: number
  comments_count: number
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  body: string
  author: User
  article_id: string
  createdAt: string
  updatedAt: string
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
  sort?: "popular" | "recent" | "oldest"
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