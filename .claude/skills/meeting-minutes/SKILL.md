# 議事録作成スキル (meeting-minutes)

## 概要
会議のトランスクリプトやメモから構造化された議事録を生成し、Word(.docx)ファイルとして出力する。

## トリガー
- `/meeting` コマンドから呼び出される
- 直接スキルとしても利用可能

## 入力
- `transcript.txt`: 会議のトランスクリプト（音声書き起こし）
- `todo.md`: 簡易Todoメモ（任意）
- `materials/`: 会議資料（任意）

## 出力
- `minutes.docx`: 構造化された議事録Word文書

## 議事録フォーマット

### 必須セクション
1. **会議情報**
   - 会議名
   - 日時
   - 参加者
   - 場所/形式（オンライン/対面）

2. **議題一覧**
   - 番号付きリスト

3. **議事内容**
   - 議題ごとに以下を記載:
     - 発言要旨（発言者名付き）
     - 議論のポイント
     - 結論/合意事項

4. **決定事項**
   - 番号付きリスト
   - 各決定の担当者と期限（判明している場合）

5. **TODO/アクションアイテム**
   - 担当者
   - タスク内容
   - 期限

6. **次回予定**
   - 日時
   - 議題（予定）

## Word生成手順

以下のPythonスクリプトをBashツールで実行してWord文書を生成する:

```python
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import datetime

def create_minutes(output_path, content):
    """
    content: dict with keys:
      - title: 会議名
      - date: 日時
      - attendees: 参加者リスト
      - location: 場所
      - agendas: [{title, discussion, decisions}]
      - action_items: [{assignee, task, deadline}]
      - next_meeting: {date, agenda}
    """
    doc = Document()

    # スタイル設定
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Meiryo'
    font.size = Pt(10.5)

    # タイトル
    title = doc.add_heading(content['title'], level=1)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # 会議情報
    doc.add_heading('会議情報', level=2)
    info_table = doc.add_table(rows=3, cols=2)
    info_table.style = 'Light Grid'
    cells = info_table.rows[0].cells
    cells[0].text = '日時'
    cells[1].text = content['date']
    cells = info_table.rows[1].cells
    cells[0].text = '参加者'
    cells[1].text = ', '.join(content['attendees'])
    cells = info_table.rows[2].cells
    cells[0].text = '場所'
    cells[1].text = content['location']

    # 議事内容
    doc.add_heading('議事内容', level=2)
    for i, agenda in enumerate(content['agendas'], 1):
        doc.add_heading(f'{i}. {agenda["title"]}', level=3)
        doc.add_paragraph(agenda['discussion'])
        if agenda.get('decisions'):
            doc.add_paragraph('【決定事項】', style='List Bullet')
            for d in agenda['decisions']:
                doc.add_paragraph(d, style='List Bullet 2')

    # アクションアイテム
    doc.add_heading('アクションアイテム', level=2)
    if content['action_items']:
        table = doc.add_table(rows=1, cols=3)
        table.style = 'Light Grid'
        hdr = table.rows[0].cells
        hdr[0].text = '担当者'
        hdr[1].text = 'タスク'
        hdr[2].text = '期限'
        for item in content['action_items']:
            row = table.add_row().cells
            row[0].text = item['assignee']
            row[1].text = item['task']
            row[2].text = item.get('deadline', 'TBD')

    # 次回予定
    if content.get('next_meeting'):
        doc.add_heading('次回予定', level=2)
        doc.add_paragraph(f"日時: {content['next_meeting']['date']}")
        if content['next_meeting'].get('agenda'):
            doc.add_paragraph(f"議題: {content['next_meeting']['agenda']}")

    doc.save(output_path)
    return output_path
```

## 処理フロー

1. `input/` フォルダからトランスクリプト・資料を読み込む
2. 内容を分析し、上記フォーマットに構造化する
3. 不明点があればユーザーに確認（参加者名、日時など）
4. Pythonスクリプトを生成・実行してWord文書を出力
5. `output/minutes.docx` に保存

## 注意事項
- トランスクリプトの発言者が不明確な場合はユーザーに確認する
- 専門用語や略語はそのまま使用する（変換しない）
- 議論の要約は客観的に記述し、個人の意見として明示する
