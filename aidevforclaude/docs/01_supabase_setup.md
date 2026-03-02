# 01 Supabase セットアップ（テーブル・RLS・トリガー）

## TODO

### Supabase プロジェクト作成
- [×] Supabase ダッシュボードで新規プロジェクトを作成する
- [×] プロジェクト URL と publishable key を控える

### パッケージインストール
- [×] `npm install @supabase/supabase-js @supabase/ssr` を実行する
- [×] `.env.local` を作成し、環境変数を設定する

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### Supabase クライアントファイル作成
- [×] `lib/supabase/client.ts`（Client Components 用）を作成する
- [×] `lib/supabase/server.ts`（Server Components / Server Actions / Route Handlers 用）を作成する
- [×] `lib/supabase/middleware.ts`（セッション更新用）を作成する
- [×] `middleware.ts`（プロジェクトルート）を作成する

### テーブル作成（SQL Editor）
- [×] `profiles` テーブルを作成する（id / display_name / avatar_url / role / created_at）
- [×] `courses` テーブルを作成する（id / title / description / thumbnail_url / is_published / created_at / updated_at）
- [×] `sections` テーブルを作成する（id / course_id / title / order_index / created_at）
- [×] `videos` テーブルを作成する（id / section_id / title / youtube_video_id / description / order_index / is_free / is_published / created_at）
- [×] `user_progress` テーブルを作成する（id / user_id / video_id / completed_at）
- [×] `user_progress` に `UNIQUE(user_id, video_id)` 制約を追加する

### profiles 自動生成トリガー
- [×] `handle_new_user` 関数を作成する
- [×] `on_auth_user_created` トリガーを作成する（auth.users の INSERT 後に profiles を自動生成）

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

### RLS（Row Level Security）設定
- [×] 全テーブルで RLS を有効化する
- [×] `profiles`：自分のレコードのみ読み書き可。管理者（role='admin'）は全件可
- [×] emailはauth.usersからアクセスしてセキュリティ強化
- [×] `courses`：`is_published = true` のレコードは全員読み取り可。管理者は全件可
- [×] `sections`：親 course が published → 全員読み取り可。管理者は全件可
- [×] `videos`：親 course が published → 全員読み取り可。管理者は全件可（`is_free=false` の `youtube_video_id` は RLS だけでなくアプリ側でも制御すること）
- [×] `user_progress`：自分のレコードのみ読み書き可。管理者は全件可

### 動作確認
- [×] Supabase Studio のテーブルエディタで各テーブルが正しく作成されているか確認する
- [×] RLS ポリシーが意図通りに設定されているか確認する
- [×] トリガーが存在することを確認する
