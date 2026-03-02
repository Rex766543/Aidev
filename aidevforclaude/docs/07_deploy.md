# 07 Vercel デプロイ・環境変数設定・動作確認

## TODO

### Vercel プロジェクト設定
- [ ] Vercel ダッシュボードで新規プロジェクトを作成し、GitHub リポジトリを連携する
- [ ] フレームワークが `Next.js` として自動検出されることを確認する
- [ ] 本番デプロイを実行し、デプロイ URL（例: `https://xxx.vercel.app`）を確認する

### 環境変数（Vercel）
- [ ] Vercel の Environment Variables に以下を設定する
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] 環境変数を設定後にリデプロイする

### OAuth コールバック URL の追加登録
- [ ] Supabase ダッシュボード → Authentication → URL Configuration に本番 URL を追加する
  - `https://<your-vercel-domain>/auth/callback`
- [ ] Google Cloud Console の承認済みリダイレクト URI に本番 Supabase コールバック URL を追加する
  - `https://<project>.supabase.co/auth/v1/callback`

### 本番動作確認
- [ ] 本番 URL で講座一覧ページが表示されることを確認する
- [ ] Google ログインが本番環境で正常に動作することを確認する
- [ ] ログイン後にダッシュボード（元のページ）へリダイレクトされることを確認する
- [ ] 管理者アカウントで `/admin` にアクセスできることを確認する
- [ ] 動画の再生・進捗記録が本番環境で正常に動作することを確認する
- [ ] 進捗バーが正しく更新されることを確認する
- [ ] 未認証で `is_free = false` の動画 ID にアクセスできないことを確認する

### パフォーマンス確認
- [ ] Vercel の Analytics / Speed Insights を確認する
- [ ] `next build` のビルドログにエラー・警告がないことを確認する

### 最終チェック
- [ ] `.env.local` が `.gitignore` に含まれていることを確認する
- [ ] ソースコードに API キー・シークレットがハードコードされていないことを確認する
- [ ] RLS が全テーブルで有効になっていることを Supabase で再確認する
