# パワポ生成スキル (pptx-generator)

## 概要
python-pptxを使用してPowerPointプレゼンテーションを生成する汎用スキル。
提案資料・報告資料・アドホック資料の3タイプに対応。

## トリガー
- `/pptx-proposal`, `/pptx-report`, `/pptx-adhoc` コマンドから呼び出される

## 入力
- ユーザーからの指示（テーマ、内容、構成案）
- `templates/` フォルダ内の参考資料（任意）
- `references/format-rules.md` のフォーマット規約

## 出力
- `.pptx` ファイル（`presentations/` 配下の適切なサブフォルダに保存）

## 資料タイプ別構成

### 提案資料 (proposal)
1. タイトルスライド（提案タイトル、日付、作成者）
2. エグゼクティブサマリー（1枚で要点）
3. 背景・課題（現状の課題を明確に）
4. 提案内容（ソリューション概要）
5. 詳細説明（2-3枚）
6. スケジュール
7. 費用/リソース
8. 期待効果
9. まとめ・Next Steps

### 定例報告資料 (report)
1. タイトルスライド（報告タイトル、期間、作成者）
2. サマリー（主要トピック一覧）
3. 進捗報告（各トピック1-2枚）
4. 課題・リスク
5. 次回までのアクション
6. Appendix（詳細データ等）

### アドホック課題資料 (adhoc)
1. タイトルスライド
2. 課題の概要
3. 分析・調査結果
4. 対応案（複数案比較）
5. 推奨案と理由
6. アクションプラン

## Python生成コード（基本構造）

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Cm, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
import datetime

def create_presentation(output_path, slides_content, pptx_type="proposal"):
    """
    slides_content: list of dicts, each with:
      - layout: 'title', 'content', 'two_column', 'blank'
      - title: スライドタイトル
      - subtitle: サブタイトル（タイトルスライド用）
      - body: 本文テキスト or リスト
      - notes: ノート
    """
    prs = Presentation()
    prs.slide_width = Cm(33.867)  # 16:9
    prs.slide_height = Cm(19.05)

    for slide_data in slides_content:
        layout_name = slide_data.get('layout', 'content')

        if layout_name == 'title':
            slide_layout = prs.slide_layouts[0]
        elif layout_name == 'content':
            slide_layout = prs.slide_layouts[1]
        elif layout_name == 'blank':
            slide_layout = prs.slide_layouts[6]
        else:
            slide_layout = prs.slide_layouts[1]

        slide = prs.slides.add_slide(slide_layout)

        # タイトル設定
        if slide.shapes.title:
            slide.shapes.title.text = slide_data.get('title', '')
            for para in slide.shapes.title.text_frame.paragraphs:
                for run in para.runs:
                    run.font.name = 'Meiryo'
                    run.font.size = Pt(28)
                    run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

        # 本文設定
        if slide_data.get('body') and len(slide.placeholders) > 1:
            body = slide.placeholders[1]
            tf = body.text_frame
            tf.clear()

            if isinstance(slide_data['body'], list):
                for i, item in enumerate(slide_data['body']):
                    para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
                    para.text = item
                    para.font.name = 'Meiryo'
                    para.font.size = Pt(18)
                    para.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
            else:
                tf.paragraphs[0].text = slide_data['body']
                tf.paragraphs[0].font.name = 'Meiryo'
                tf.paragraphs[0].font.size = Pt(18)

        # ノート
        if slide_data.get('notes'):
            slide.notes_slide.notes_text_frame.text = slide_data['notes']

    prs.save(output_path)
    return output_path
```

## 処理フロー

1. ユーザーからテーマ・内容のヒアリング
2. `templates/` の参考資料を確認（存在する場合）
3. `format-rules.md` のフォーマット規約を読み込む
4. 資料タイプに応じたスライド構成を設計
5. 各スライドの内容をテキストで作成
6. Pythonスクリプトを生成・実行してpptx出力
7. 適切なフォルダに保存
8. レビューエージェントが内容を確認

## 注意事項
- 1スライドに情報を詰め込みすぎない（1スライド1メッセージ）
- 箇条書きは最大5-6項目を目安にする
- グラフ・図表が必要な場合はユーザーに元データを確認する
- テンプレートファイルが `templates/` にある場合はそのデザインを参考にする
