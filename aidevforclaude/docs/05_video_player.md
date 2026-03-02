# 05 動画視聴ページ・YouTube IFrame API・進捗記録

## TODO

### ページ構造
- [×] `app/courses/[id]/videos/[videoId]/page.tsx` を作成する（Server Component）
- [×] `params.id`・`params.videoId` で動画データ・コース内動画リストを取得する
- [×] `getUser()` でログイン確認を行い、`is_free = false` の動画は未認証時に動画IDを渡さない
- [×] 2カラムレイアウトを実装する
  - メインエリア：YouTube プレイヤー + 動画タイトル・説明
  - サイドバー：同コース内の動画リスト + 進捗バー

### youtube_video_id のセキュリティ
- [×] `is_free = false` の動画は Server Component で認証チェックを行い、未認証の場合は `youtube_video_id` を返さずログインページへリダイレクトする
- [×] Server Component 内で認証チェック + リダイレクトを実装済み（Route Handler は不要と判断しスキップ）

### YouTube IFrame Player（Client Component）
- [×] `components/VideoPlayer.tsx` を `"use client"` で作成する
- [×] `components/VideoPlayerWrapper.tsx` を Client Component として作成し `next/dynamic` で動的インポートする（SSR 無効）
  - Next.js 16 では `ssr: false` を Server Component 内で直接使えないため Wrapper パターンを採用

- [×] YouTube IFrame Player API のスクリプトを読み込む（`window.YT` が存在しない場合のみ）
- [×] `YT.Player` インスタンスを作成し、`onStateChange` イベントを設定する
- [×] `YT.PlayerState.ENDED`（値: `0`）を検知したら進捗記録関数を呼び出す

### 進捗記録
- [×] 動画完了時に `user_progress` テーブルへ upsert する Server Action を作成する（`recordProgress`）
  - `onConflict: 'user_id,video_id'` で重複を上書き（updated_at 更新）
- [×] 完了済みの場合は再送しない（`VideoPlayer` クライアント側でフラグ管理）
- [×] 未認証状態では進捗記録を行わない（Server Action 内で `getUser()` 再確認）

### ナビゲーション
- [×] 「前の動画」ボタン：`order_index` が1つ前の動画へのリンク（存在しない場合は非表示）
- [×] 「次の動画」ボタン：`order_index` が1つ後の動画へのリンク（存在しない場合は非表示）
- [×] サイドバーの動画リストで現在再生中の動画をハイライト表示する
- [×] サイドバーの各動画に「完了済み」チェックマークを表示する

### ローディング・エラー対応
- [×] `app/courses/[id]/videos/[videoId]/loading.tsx` を作成する
- [×] `app/courses/[id]/videos/[videoId]/error.tsx` を作成する（`"use client"` 必須）

### 動作確認
- [ ] `is_free = false` の動画 ID が未認証時にブラウザから見えないことを確認する
- [ ] YouTube 動画が正しく埋め込まれ再生できることを確認する
- [ ] 動画を最後まで再生すると `user_progress` レコードが作成されることを確認する
- [ ] 同じ動画を再度完了しても重複レコードが作成されないことを確認する
- [ ] 前の動画・次の動画ボタンが正しく機能することを確認する
- [ ] サイドバーで完了済みの動画にチェックマークが表示されることを確認する
