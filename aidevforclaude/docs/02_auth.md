# 02 認証（Google OAuth）・ログインページ・Middleware

## TODO

### Google Cloud Console 設定
- [ ] Google Cloud Console で OAuth 2.0 クライアント ID を作成する
- [ ] 承認済みリダイレクト URI に Supabase のコールバック URL を登録する
  - `https://jueqlceopvhotyrjwqdm.supabase.co/auth/v1/callback`
- [ ] クライアント ID とクライアントシークレットを控える

### Supabase Auth 設定
- [ ] Supabase ダッシュボード → Authentication → Providers → Google を有効化する
- [ ] Google のクライアント ID / シークレットを設定する
- [ ] Redirect URL に以下を両方登録する
  - `http://localhost:3000/auth/callback`（ローカル）
  - `https://<your-vercel-domain>/auth/callback`（本番）

### Auth コールバックルート
- [×] `app/auth/callback/route.ts` を作成する（認証後のセッション交換処理）

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

### ログインページ（`/login`）
- [×] `app/login/page.tsx` を作成する（Server Component）
- [×] 「Googleでログイン」ボタンのみ表示する（メール/パスワード認証は不採用）
- [×] ログイン前に訪問していたページの URL を `next` パラメータとして保持する
- [×] `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })` を実装する
- [×] ダーク系デザインで統一する

### Middleware による認証ガード
- [×] `middleware.ts` が `/admin` 配下へのアクセスを未認証時にリダイレクトすることを確認する
- [×] `/login`・`/auth` パスは認証ガードから除外されていることを確認する
- [×] `supabase.auth.getUser()` でユーザー確認（`getSession()` は使わない）

### 管理者ロール設定
- [ ] Supabase Studio で自分のアカウントの `profiles.role` を `'admin'` に手動更新する

### 動作確認
- [ ] ローカルで Google ログインが成功するか確認する
- [ ] ログイン後に元のページへリダイレクトされるか確認する
- [ ] 未認証で `/admin` にアクセスするとログインページへ飛ぶか確認する
- [ ] トリガーにより `profiles` レコードが自動生成されるか確認する
