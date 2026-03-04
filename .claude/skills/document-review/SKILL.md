# ドキュメントレビュースキル (document-review)

user-invocable: false

## 概要
各成果物（議事録、メール、パワポ）の生成後に自動的にreviewer agentを起動し、品質レビューを実施する。

## トリガー
- 各スキル（meeting-minutes, meeting-email, pptx-generator）の処理完了後に自動呼び出し
- ユーザーが直接起動することはない

## 処理フロー

1. 生成された成果物の種類を判定（docx / txt / pptx）
2. Agent toolを使って `.claude/agents/reviewer.md` のレビューエージェントを起動
3. レビュー結果を受け取る
4. フィードバックがある場合:
   a. ユーザーにレビュー結果を提示
   b. ユーザーが修正を承認した場合、該当スキルで修正版を再生成
   c. 修正版を再度レビュー（最大2回まで）
5. 最終版を確定して保存

## レビュー起動方法

各スキルの最後に以下のパターンでAgent toolを呼び出す:

```
Agent tool:
  subagent_type: general-purpose
  prompt: |
    あなたは `.claude/agents/reviewer.md` に定義されたレビューエージェントです。
    以下の成果物をレビューしてください:

    ファイル: {output_path}
    種類: {document_type}  (minutes / email / presentation)

    reviewer.md のレビュー観点に従って評価し、
    具体的な改善提案があれば箇条書きで提示してください。
    問題がなければ「レビューOK」と回答してください。
```

## 注意事項
- レビューは自動実行されるが、修正の適用にはユーザーの承認が必要
- 軽微な修正（誤字脱字等）は自動修正を提案し、ユーザー確認後に適用
- 構成の大幅変更が必要な場合はユーザーに方針を確認してから修正
