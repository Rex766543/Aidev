---
title: "claude-peers-mcpによるセッション間連携"
source_type: "article"
source_url: "https://github.com/louislva/claude-peers-mcp"
captured_at: "2026-06-14"
topic:
  - ai-tools
tags:
  - claude-peers
  - claude-code
  - MCP
  - マルチセッション連携
  - agent-teams
---

# claude-peers-mcpによるセッション間連携

## 要約
`claude-peers-mcp`（louislva作、GitHub ⭐約1,700）は、同時に動く複数の Claude Code インスタンスを相互発見させ、アドホックにメッセージングさせる MCP サーバー。仕組みは `localhost:7899` で動く broker デーモン（SQLite）が全セッションを仲介し、各セッションのMCPサーバーが1秒ごとにポーリング、受信は `claude/channel` プロトコルで即時にClaudeへ届く。提供ツールは `list_peers`（machine/directory/repo 単位で他インスタンスを発見）と `set_summary`（自分の作業内容を要約共有）が中心。broker は自動起動・死活管理（dead peer 自動掃除）し、すべて localhost 内で完結（外部サービス不要）。npm版 `claude-peers` は LAN 越しのフェデレーション（TLS暗号化＋事前共有鍵）にも対応し別マシンとも連携可能。`OPENAI_API_KEY` があれば起動時に `gpt-5.4-nano` でディレクトリ・gitブランチ・最近のファイルから自動要約を生成する。注目度は高いが、起動が `--dangerously-skip-permissions` / `--dangerously-load-development-channels` 前提で実験的・自己責任色が強い。

## 学び・発見
- 「セッション間連携」の実体は、**ブローカー経由の発見＋メッセージング＋要約共有**であり、コンテキストウィンドウ全体の同期ではない。共有されるのは `set_summary` の短い要約。
- 「バックエンド／フロントエンドの役割分担」は claude-peers の機能ではなく、発見＋メッセージング基盤の上で**人間がそう指示して成立させる使い方**。ツール自体が役割を自動割当するわけではない。
- 公式の Agent Teams が類似のpeer-to-peer連携を正式提供し始めており、本番用途ならローカル実験ツールとの比較検討が要る。

## 機能と「噂の認識」の照合
| よく言われる点 | 実際 |
|---|---|
| 複数セッションが自動で互いを発見 | ✅ `list_peers`（machine/directory/repo単位）。broker自動起動＋dead peer自動掃除 |
| 瞬時にメッセージ・コンテキスト共有 | ✅ 1秒ポーリング＋`claude/channel`で即時受信。ただし“コンテキスト共有”＝`set_summary`の要約共有 |
| バックエンド/フロントを役割分担 | △ 機能ではなく使い方。基盤はあくまで発見＋メッセージング |

## 自分にとっての示唆
- 複数Claude Codeを並行で回す開発スタイルなら、手動コンテキスト受け渡しを減らす実験基盤として有用。
- ただし `--dangerously-*` フラグ前提なので、信頼できるローカル環境に限定し、本番・機密リポジトリでは慎重に。
- 安定運用が要るなら公式 Agent Teams を第一候補にし、claude-peers は軽量・自己ホスト志向の選択肢と位置づける。

## 関連しそうな問い
- Agent Teams（公式）と claude-peers の機能・安全性・運用コストの差は具体的に何か。
- 「要約共有」だけで複数エージェントの協調はどこまで成立し、どこで full-context 共有が要るのか。

## 補足：調査時のX取得について
当初Xでの評判を狙ったが、X検索はログイン必須化、かつ匿名Jina（`r.jina.ai`）は共有プールの一時ブロック（`451`）、Jina検索（`s.jina.ai`）はAPIキー必須（`401`）で、いずれもXからの直接取得は不可だった。評判はGitHub・npm・技術ブログ等の公開Webから確認した。
