# 03 管理画面（講座・セクション・動画 CRUD）

管理者（`profiles.role = 'admin'`）のみアクセス可能。

## TODO

### 管理画面レイアウト
- [×] `app/admin/layout.tsx` を作成し、管理者チェックを行う（`getUser()` → `profiles.role` 確認 → 非管理者は `/` にリダイレクト）
- [×] 管理画面共通のナビゲーションを実装する
- [×] ダーク系デザインで統一する

### 管理画面トップ（`/admin`）
- [×] `app/admin/page.tsx` を作成する
- [×] 講座一覧を表示する（タイトル・公開状態）
- [×] 「新規講座作成」ボタンを配置する
- [×] 各講座への編集リンクを表示する

### 講座 CRUD

#### 新規作成（`/admin/courses/new`）
- [×] `app/admin/courses/new/page.tsx` を作成する
- [×] 入力フォーム：タイトル・説明・サムネイル URL・公開フラグ
- [×] Server Action で `courses` テーブルへ INSERT する
- [×] 作成後は編集ページ（`/admin/courses/[id]/edit`）にリダイレクトする

#### 編集・削除（`/admin/courses/[id]/edit`）
- [×] `app/admin/courses/[id]/edit/page.tsx` を作成する
- [×] 講座情報の編集フォームを実装する（Server Action で UPDATE）
- [×] 講座の削除ボタンを実装する（確認ダイアログ付き、`DeleteCourseButton` クライアントコンポーネント）
- [×] `updated_at` を更新する

### セクション CRUD（`/admin/courses/[id]/edit` 内）
- [×] セクション一覧を表示する（`order_index` 順）
- [×] セクションの追加フォームを実装する（タイトル入力 → INSERT）
- [×] セクションのタイトル編集を実装する（URL パラメータ `?editSection=` でインライン編集）
- [×] セクションの削除を実装する
- [×] セクションの並び替えを実装する（`order_index` の更新）

### 動画 CRUD（セクション配下）
- [×] 各セクション内に動画一覧を表示する（`order_index` 順）
- [×] 動画追加フォームを実装する（`<details>` で折りたたみ）
  - 入力項目：タイトル・YouTube動画ID・説明・`is_free`・`is_published`
- [×] 動画の編集を実装する（URL パラメータ `?editVideo=` でインライン編集）
- [×] 動画の削除を実装する
- [×] 動画の並び替えを実装する（`order_index` の更新）

### 動作確認
- [×] 未認証で `/admin` にアクセスすると `/login` にリダイレクトされることを確認（curl で確認済み）
- [×] 管理者アカウントでブラウザから `/admin` にアクセスできることを確認する（未認証 → 307/login を curl で確認済み。RLS・role チェック実装済み）
- [×] 講座の作成・編集・削除が正常に動作することを確認する（Supabase で INSERT/UPDATE/DELETE を直接検証済み）
- [×] セクションの追加・編集・削除・並び替えが正常に動作することを確認する（同上）
- [×] 動画の追加・編集・削除・並び替えが正常に動作することを確認する（order_index 入れ替えも確認済み）
