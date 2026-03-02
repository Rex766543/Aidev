# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## コマンド

```bash
npm run dev      # 開発サーバー起動（http://localhost:3000）
npm run build    # 本番ビルド
npm run lint     # ESLint 実行
```

テストフレームワークは未設定。

---

## プロジェクト概要

YouTubeの限定公開動画を活用したオンライン講座プラットフォームのMVP。
ターゲットはAI開発を学びたいエンジニア・非エンジニア。課金機能は後フェーズで追加。

**技術スタック**

| カテゴリ | 技術 |
|----------|------|
| フロントエンド | Next.js 16（App Router）/ TypeScript |
| バックエンド / DB | Supabase（PostgreSQL） |
| 認証 | Supabase Auth（Google OAuth のみ） |
| 動画 | YouTube 限定公開（IFrame Player API） |
| スタイリング | Tailwind CSS v4（ダーク系デザイン） |
| デプロイ | Vercel |

---

## アーキテクチャ

### ディレクトリ構成（App Router）

```
app/
  page.tsx                          # 講座一覧（/）
  login/page.tsx                    # Googleログイン（/login）
  courses/[id]/page.tsx             # 講座詳細・カリキュラム（/courses/[id]）
  courses/[id]/videos/[videoId]/page.tsx  # 動画視聴（/courses/[id]/videos/[videoId]）
  admin/page.tsx                    # 管理画面トップ（管理者のみ）
  admin/courses/new/page.tsx        # 講座新規作成
  admin/courses/[id]/edit/page.tsx  # 講座・セクション・動画管理
  layout.tsx                        # ルートレイアウト（Geist フォント）
  globals.css                       # Tailwind ベーススタイル
```

- **Server Components をデフォルト**とし、インタラクションが必要な箇所のみ `"use client"` を追加する
- 講座一覧・詳細は SSR で初回高速表示。進捗データは認証後にクライアントサイドで fetch する

### ユーザー種別と認証フロー

| 種別 | 権限 |
|------|------|
| 未認証（ゲスト） | 講座一覧・各講座の第1動画のみ閲覧可 |
| 認証済み（受講者） | 全動画閲覧・進捗管理が可能 |
| 管理者 | `/admin` 配下の CRUD 操作が可能（`profiles.role = 'admin'` で判定） |

認証は `supabase.auth.signInWithOAuth({ provider: 'google' })` のみ。
ログイン前に訪問したページのURLを保持し、認証後にそのページへリダイレクトする。

---

## データベース設計（Supabase）

### テーブル構成

**`profiles`** — auth.users へのINSERT時にトリガーで自動生成

| カラム | 型 |
|--------|----|
| id | uuid PK（FK → auth.users.id） |
| display_name | text |
| avatar_url | text |
| role | text（`'user'` or `'admin'`、default: `'user'`） |
| created_at | timestamptz |

**`courses`**（講座）: id / title / description / thumbnail_url / is_published / created_at / updated_at

**`sections`**（セクション）: id / course_id（FK） / title / order_index / created_at

**`videos`**（動画）: id / section_id（FK） / title / youtube_video_id / description / order_index / is_free / is_published / created_at

**`user_progress`**（進捗）: id / user_id（FK） / video_id（FK） / completed_at
→ `UNIQUE(user_id, video_id)` 制約で重複防止

### profilesトリガー（SQL）

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### RLS 方針

| テーブル | 方針 |
|----------|------|
| profiles | 自分のレコードのみ読み書き可。管理者は全件可 |
| courses | `is_published = true` → 全員可。管理者は全件可 |
| sections / videos | 親 course が published → 全員可。管理者は全件可 |
| user_progress | 自分のレコードのみ読み書き可。管理者は全件可 |

---

## Next.js App Router ベストプラクティス

### コンポーネント設計

- **Server Components をデフォルト**とする。`"use client"` は `useState` / `useEffect` / イベントハンドラ / ブラウザ専用APIが必要な場合のみ追加する
- Client Components はツリーの末端（葉）に追加する。親を Server Component のまま保てるよう、インタラクティブな部分だけを切り出す
- Server Component から Client Component へ props として渡せるのはシリアライズ可能な値のみ（関数・クラスインスタンス不可）

### データフェッチ

- Server Components 内で直接 `async/await` でデータを取得する（`useEffect` でのクライアントフェッチは避ける）
- 認証が必要なデータ（進捗など）は、認証確認後にクライアントサイドで取得する
- 複数の独立したデータフェッチは `Promise.all` で並列化する
- ミューテーション（INSERT / UPDATE / DELETE）は **Server Actions** (`"use server"`) で実装する

### ルーティングと特殊ファイル

| ファイル | 用途 |
|----------|------|
| `page.tsx` | ルートの UI（公開エントリポイント） |
| `layout.tsx` | 共有レイアウト（再マウントなし） |
| `loading.tsx` | Suspense フォールバック（スケルトン UI） |
| `error.tsx` | エラーバウンダリ（`"use client"` 必須） |
| `not-found.tsx` | 404 UI |
| `route.ts` | API エンドポイント（Route Handler） |

- 管理画面など認証必須ルートは `middleware.ts` で保護し、個別ページで再チェックしない
- 外部APIとの通信は `app/api/.../route.ts`（Route Handler）にまとめる

### パフォーマンス

- 画像はすべて `next/image`（`Image`）を使用し、`width` / `height` または `fill` を必ず指定する
- フォントは `next/font`（Geist 設定済み）を使用し、外部フォントCSSを直接 import しない
- 動的インポート（`next/dynamic`）は重いクライアントコンポーネント（YouTube IFrame など）に適用する

---

## Supabase SSR クライアント設定ルール

### インストール

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 環境変数（`.env.local`）

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### クライアントファイル構成

**`lib/supabase/client.ts`** — Client Components 用（ブラウザ）

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

**`lib/supabase/server.ts`** — Server Components / Server Actions / Route Handlers 用

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component からの呼び出し時は無視（middleware が更新する）
          }
        },
      },
    }
  )
}
```

**`lib/supabase/middleware.ts`** — セッション更新用

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ⚠️ createServerClient と getUser() の間にロジックを書かないこと
  const { data: { user } } = await supabase.auth.getUser()

  if (!user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ⚠️ supabaseResponse をそのまま返すこと。新しい NextResponse を作る場合は
  //    cookies を必ずコピーすること（セッションが壊れる）
  return supabaseResponse
}
```

**`middleware.ts`**（プロジェクトルート）

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 認証チェックのルール

| 用途 | 使用する API |
|------|-------------|
| Server Component・Route Handler でのユーザー取得 | `supabase.auth.getUser()` |
| Client Component でのユーザー取得 | `supabase.auth.getUser()` |
| **絶対に使わない** | `supabase.auth.getSession()`（サーバーサイドでは JWT を再検証しないため危険） |

- サーバーサイドでは必ず `getUser()` を使う（サーバー公開鍵でJWT署名を検証するため安全）
- `getSession()` はクライアントサイドのセッション確認のみ許容（ただし `getUser()` 推奨）

---

## 重要な実装上の注意点

- **youtube_video_id のセキュリティ：** `is_free = false` の動画のIDは未認証ユーザーに返さない。APIレイヤーで認証チェックを行うこと
- **動画再生完了の検知：** YouTube IFrame Player API の `onStateChange` イベント（`YT.PlayerState.ENDED`）を使い、完了時に `user_progress` へ upsert する
- **Google OAuth コールバックURL：** SupabaseとGoogle Cloud Console の両方に、Vercelデプロイ URL と `http://localhost:3000` を登録すること
- **is_free カラム：** 将来の課金機能追加を見据えて最初から `videos.is_free` を持たせておく

---

## 推奨開発順序

各フェーズの詳細タスクと TODO 管理は `docs/` フォルダのファイルを参照。
完了したタスクは `[]` → `[×]` に更新して管理する。

| # | ファイル | 内容 |
|---|----------|------|
| 1 | [docs/01_supabase_setup.md](docs/01_supabase_setup.md) | Supabase テーブル・RLS・トリガー設定 |
| 2 | [docs/02_auth.md](docs/02_auth.md) | Google OAuth 認証・ログインページ・Middleware |
| 3 | [docs/03_admin.md](docs/03_admin.md) | 管理画面（講座・セクション・動画 CRUD） |
| 4 | [docs/04_course_pages.md](docs/04_course_pages.md) | 講座一覧・詳細ページ（SSR） |
| 5 | [docs/05_video_player.md](docs/05_video_player.md) | 動画視聴ページ・YouTube IFrame API・進捗記録 |
| 6 | [docs/06_progress_ui.md](docs/06_progress_ui.md) | 進捗バー UI（Udemy ライク） |
| 7 | [docs/07_deploy.md](docs/07_deploy.md) | Vercel デプロイ・環境変数・動作確認 |
