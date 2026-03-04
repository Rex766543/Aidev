# 会議後メール作成スキル (meeting-email)

## 概要
議事録の内容に基づいて、会議参加者への共有メールの下書きを生成する。
AppleScript経由でOutlookドラフトを自動作成する機能も提供。

## トリガー
- `/meeting` コマンドから議事録生成後に呼び出される
- 直接スキルとしても利用可能

## 入力
- 議事録の内容（`minutes.docx` または構造化データ）
- 宛先情報（ユーザー指定 or `project-knowledge.md` から取得）

## 出力
- `email_draft.txt`: メール下書きテキスト
- Outlookドラフト（オプション）

## メールフォーマット

```
件名: 【議事録】{会議名} ({日付})

{宛先名} 様

お疲れ様です。{送信者名}です。
{日付}の{会議名}の議事録を共有いたします。

■ 決定事項
{決定事項を箇条書き}

■ アクションアイテム
{担当者}: {タスク内容}（期限: {期限}）

■ 次回予定
{次回の日時・議題}

議事録は添付ファイルをご確認ください。
内容に誤り・追記事項がございましたら、ご連絡いただけますと幸いです。

よろしくお願いいたします。
```

## Outlook ドラフト作成（AppleScript）

以下のAppleScriptでOutlookにドラフトを自動作成する:

```applescript
tell application "Microsoft Outlook"
    set newMessage to make new outgoing message with properties {subject:"【議事録】会議名 (日付)", content:"メール本文"}
    -- 宛先追加
    make new to recipient at newMessage with properties {email address:{address:"recipient@example.com"}}
    -- 添付ファイル
    make new attachment at newMessage with properties {file:POSIX file "/path/to/minutes.docx"}
    open newMessage
end tell
```

実行方法:
```bash
osascript -e '<AppleScript内容>'
```

## 処理フロー

1. 議事録の内容を読み込む
2. 決定事項・アクションアイテム・次回予定を抽出
3. メールテンプレートに当てはめて本文生成
4. `output/email_draft.txt` に保存
5. ユーザーに宛先を確認
6. ユーザーが希望すればAppleScriptでOutlookドラフトを作成

## 注意事項
- 宛先メールアドレスはユーザーに必ず確認する（自動送信しない）
- ドラフト作成のみ行い、送信はユーザーが手動で行う
- `project-knowledge.md` によく使う宛先を記録しておくと効率的
- 敬語レベルはビジネスフォーマル（社内向け）をデフォルトとする
