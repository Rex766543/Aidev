---
name: pptx-consulting
description: "アクセンチュア風コンサルティング資料（紫アクセント・日本語）をpython-pptxで生成するスキル。ユーザーがコンサルスタイルのパワポ・スライドデッキ・コンサルティング資料・分析資料・戦略資料を作りたいと言ったとき、またはバリューチェーン図・比較マトリクス・システムアーキテクチャ図・業界分析資料が必要なとき、必ずこのスキルを使う。参考フォーマットに基づいた資料を作りたい場合も使う。"
---

# コンサルティング資料生成スキル (pptx-consulting)

## 概要

アクセンチュアスタイルのコンサルティング資料を生成する。
白背景・紫アクセント・太字日本語タイトル・右上パンくずナビ・スライド番号を特徴とする。

詳細なデザインルールは `references/format-rules.md` を参照。

## 対応スライドタイプ一覧

### 構造・ナビゲーション系

| タイプ | 用途 | コードパターン |
|--------|------|----------------|
| `title` | 表紙（タイトル・日付・作成者） | `references/format-rules.md` |
| `toc` | 目次・アジェンダ（番号付きトピックリスト） | `references/slide-types.md` |
| `section_divider` | セクション区切り（大見出し＋紫帯） | `references/slide-types.md` |
| `executive_summary` | エグゼクティブサマリー（メッセージ＋3〜5箇条） | `references/slide-types.md` |

### コンテンツ・テキスト系

| タイプ | 用途 | コードパターン |
|--------|------|----------------|
| `standard` | 標準コンテンツ（箇条書き・1カラム） | 本ファイル参照 |
| `two_column` | 2カラム比較（左右に別テキスト） | 本ファイル参照（`two_column=True`） |
| `quote_insight` | キーインサイト・引用ハイライト（大きなメッセージ1文） | `references/slide-types.md` |
| `before_after` | AS-IS / TO-BE、Before / After 比較 | `references/slide-types.md` |
| `appendix` | 補足・ソースリスト・脚注 | `references/slide-types.md` |

### 図・ダイアグラム系

| タイプ | 用途 | コードパターン |
|--------|------|----------------|
| `value_chain` | バリューチェーン図＋グリッド解説 | 本ファイル参照 |
| `process_flow` | プロセスフロー（番号付きステップ→矢印） | `references/slide-types.md` |
| `swim_lane` | スイムレーン図（役割別横断フロー） | `references/slide-types.md` |
| `architecture` | システム・アーキテクチャ図 | `references/format-rules.md` |
| `org_chart` | 組織図（階層ツリー） | `references/slide-types.md` |
| `pyramid` | ピラミッド構造（ミント・ピラミッド等） | `references/slide-types.md` |
| `issue_tree` | 課題ツリー・ロジックツリー（階層分解） | `references/slide-types.md` |

### マトリクス・フレームワーク系

| タイプ | 用途 | コードパターン |
|--------|------|----------------|
| `comparison_matrix` | 企業・機能比較マトリクス（✓/★/−） | `references/format-rules.md` |
| `two_by_two` | 2×2マトリクス（重要度×緊急度、BCG等） | `references/slide-types.md` |
| `swot` | SWOT分析（4象限） | `references/slide-types.md` |
| `framework_grid` | 3C・4P・7S等のフレームワーク枠 | `references/slide-types.md` |
| `scorecard` | 評価スコアカード・ケイパビリティ評価 | `references/slide-types.md` |
| `heatmap` | ヒートマップ（色濃淡で強弱表現） | `references/slide-types.md` |
| `gap_analysis` | ギャップ分析（現状→ギャップ→あるべき姿） | `references/slide-types.md` |
| `stakeholder_map` | ステークホルダーマップ（関心度×影響度） | `references/slide-types.md` |

### データ・グラフ系

| タイプ | 用途 | コードパターン |
|--------|------|----------------|
| `kpi_highlight` | KPI・大数字ハイライト（指標カード3〜4枚） | `references/slide-types.md` |
| `bar_chart` | 棒グラフ（比較・推移） | `references/slide-types.md` |
| `line_chart` | 折れ線グラフ（トレンド） | `references/slide-types.md` |
| `waterfall_chart` | ウォーターフォールチャート（増減分解） | `references/slide-types.md` |
| `radar_chart` | レーダーチャート・スパイダーチャート | `references/slide-types.md` |

### アクション・スケジュール系

| タイプ | 用途 | コードパターン |
|--------|------|----------------|
| `timeline` | タイムライン・ロードマップ（横軸時系列） | `references/slide-types.md` |
| `action_plan` | アクションプラン表（担当・期限・ステータス） | `references/slide-types.md` |
| `next_steps` | まとめ・Next Steps（箇条書き＋担当） | `references/slide-types.md` |

---

## デザインシステム

```python
from pptx.dml.color import RGBColor

# カラーパレット
PRIMARY_PURPLE   = RGBColor(0x70, 0x30, 0xA0)   # 主要紫（ヘッダー、バリューチェーンボックス）
HIGHLIGHT_PURPLE = RGBColor(0xCC, 0x00, 0xCC)   # 強調紫（本文内ハイライトテキスト）
LIGHT_PURPLE     = RGBColor(0xE8, 0xD5, 0xF5)   # 薄紫（テーブル背景等）
DARK_TEXT        = RGBColor(0x26, 0x26, 0x26)   # 本文濃色
GRAY_TEXT        = RGBColor(0x59, 0x59, 0x59)   # サブタイトル・説明文
LIGHT_GRAY       = RGBColor(0xF2, 0xF2, 0xF2)   # 薄グレー背景
WHITE            = RGBColor(0xFF, 0xFF, 0xFF)
STAR_YELLOW      = RGBColor(0xFF, 0xC0, 0x00)   # マトリクス内★マーク
COPYRIGHT_GRAY   = RGBColor(0x99, 0x99, 0x99)   # コピーライトテキスト
```

---

## スライドの基本構造（全スライド共通）

スライドサイズ: 幅 33.867cm × 高さ 19.05cm（16:9）

```python
from pptx import Presentation
from pptx.util import Cm, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE_TYPE
import copy

prs = Presentation()
prs.slide_width  = Cm(33.867)
prs.slide_height = Cm(19.05)

SLIDE_W = 33.867  # cm
SLIDE_H = 19.05   # cm
```

### 全スライド共通要素を追加する関数

```python
def add_common_elements(slide, slide_number, total_slides,
                        breadcrumbs=None, active_breadcrumb=None,
                        copyright_text="Copyright © 2024 YourCompany. All rights reserved."):
    """
    全スライドに共通要素を追加する。
    breadcrumbs: ["タブ1", "タブ2", "タブ3"] のリスト（省略可）
    active_breadcrumb: アクティブなタブのインデックス（0始まり）
    """
    # ---- スライド番号（右下） ----
    num_box = slide.shapes.add_textbox(
        Cm(SLIDE_W - 1.5), Cm(SLIDE_H - 0.7), Cm(1.2), Cm(0.5)
    )
    tf = num_box.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    run = p.add_run()
    run.text = str(slide_number)
    run.font.size = Pt(10)
    run.font.name = "Meiryo"
    run.font.color.rgb = COPYRIGHT_GRAY

    # ---- コピーライト（右下、番号の左） ----
    copy_box = slide.shapes.add_textbox(
        Cm(0.5), Cm(SLIDE_H - 0.7), Cm(SLIDE_W - 2.0), Cm(0.5)
    )
    tf = copy_box.text_frame
    tf.word_wrap = False
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    run = p.add_run()
    run.text = copyright_text
    run.font.size = Pt(8)
    run.font.name = "Meiryo"
    run.font.color.rgb = COPYRIGHT_GRAY

    # ---- パンくずナビ（右上）----
    if breadcrumbs:
        tab_h = 0.55    # cm
        tab_top = 0.3   # cm
        tab_gap = 0.08  # cm
        # タブ幅を均等に（最大右端まで）
        tab_area_w = min(len(breadcrumbs) * 3.5, 14.0)
        tab_w = (tab_area_w - tab_gap * (len(breadcrumbs) - 1)) / len(breadcrumbs)
        start_x = SLIDE_W - tab_area_w - 0.3

        for i, label in enumerate(breadcrumbs):
            x = start_x + i * (tab_w + tab_gap)
            is_active = (i == active_breadcrumb)

            fill_color = PRIMARY_PURPLE if is_active else LIGHT_GRAY
            text_color = WHITE if is_active else DARK_TEXT

            # 背景ボックス
            shape = slide.shapes.add_shape(
                1,  # MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE の代わりに矩形
                Cm(x), Cm(tab_top), Cm(tab_w), Cm(tab_h)
            )
            shape.fill.solid()
            shape.fill.fore_color.rgb = fill_color
            shape.line.color.rgb = PRIMARY_PURPLE
            shape.line.width = Pt(0.5)

            tf = shape.text_frame
            tf.word_wrap = False
            tf.auto_size = None
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            run = p.add_run()
            run.text = label
            run.font.size = Pt(9)
            run.font.name = "Meiryo"
            run.font.bold = is_active
            run.font.color.rgb = text_color
```

### タイトルエリアを追加する関数

```python
def add_title_area(slide, section_number, title, subtitle="",
                   title_top=0.9, has_breadcrumb=False):
    """
    スライドのタイトルエリアを追加する。
    section_number: "2." や "1." など（空文字列で省略可）
    title: メインタイトル（大きく太字）
    subtitle: サブタイトル/説明文（通常フォント）
    """
    content_right = SLIDE_W - (3.5 if has_breadcrumb else 0.8)

    # セクション番号（タイトル上の小テキスト）
    if section_number:
        sec_box = slide.shapes.add_textbox(
            Cm(0.8), Cm(title_top - 0.5), Cm(content_right - 0.8), Cm(0.4)
        )
        tf = sec_box.text_frame
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = section_number
        run.font.size = Pt(11)
        run.font.name = "Meiryo"
        run.font.color.rgb = GRAY_TEXT

    # メインタイトル（大きく太字）
    title_box = slide.shapes.add_textbox(
        Cm(0.8), Cm(title_top), Cm(content_right - 0.8), Cm(1.1)
    )
    tf = title_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = title
    run.font.size = Pt(26)
    run.font.bold = True
    run.font.name = "Meiryo"
    run.font.color.rgb = DARK_TEXT

    # サブタイトル（説明文）
    if subtitle:
        sub_box = slide.shapes.add_textbox(
            Cm(0.8), Cm(title_top + 1.2), Cm(content_right - 0.8), Cm(0.7)
        )
        tf = sub_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = subtitle
        run.font.size = Pt(12)
        run.font.name = "Meiryo"
        run.font.color.rgb = GRAY_TEXT
```

---

## スライドタイプ別: バリューチェーン図

上段に矢印型フロー、下段に番号付きコンテンツグリッドを配置するスライド。

```python
def add_value_chain_slide(prs, slide_number, section_number, title, subtitle,
                          chain_steps, content_blocks,
                          breadcrumbs=None, active_breadcrumb=None,
                          copyright_text="Copyright © 2024 YourCompany."):
    """
    chain_steps: [{"number": "1", "label": "企画"}, {"number": "2", "label": "開発"}, ...]
    content_blocks: [
        {
            "number": "1",
            "title": "前例に捉われないHW/SWの統一",
            "bullets": [
                "モデル間でHWを統一し量を確保することで、コスト削減と投資余力を捻出",
                "ECUを統合することでシンプルかつUpdate可能なSWを構築"
            ],
            "highlight_bullets": [0]  # 0番目の箇条書きを紫ハイライト
        },
        ...
    ]
    """
    slide_layout = prs.slide_layouts[6]  # blank
    slide = prs.slides.add_slide(slide_layout)
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE

    add_common_elements(slide, slide_number, prs.slides.__len__(),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    # ---- バリューチェーン（矢印フロー） ----
    chain_label_y = 2.3
    chain_top = 2.65
    chain_h = 0.85
    n = len(chain_steps)
    total_chain_w = SLIDE_W - 1.6
    step_w = total_chain_w / n
    overlap = 0.22  # 矢印の重なり（視覚的なシェブロン効果）

    # "EVにおけるバリューチェーン" ラベル
    lbl = slide.shapes.add_textbox(
        Cm(0.8), Cm(chain_label_y), Cm(total_chain_w), Cm(0.4)
    )
    tf = lbl.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = "バリューチェーン"  # ← 必要に応じてパラメータ化
    run.font.size = Pt(10)
    run.font.name = "Meiryo"
    run.font.color.rgb = GRAY_TEXT

    for i, step in enumerate(chain_steps):
        x = 0.8 + i * (step_w - overlap / 2)
        w = step_w + overlap / 2

        # シェブロン形状（python-pptxでは pentagon/chevron を MSO_AUTO_SHAPE_TYPE で指定）
        # CHEVRON = 52、PENTAGON = 56（左端のみペンタゴン）
        shape_type = 56 if i == 0 else 52  # 先頭はペンタゴン、以降はシェブロン
        shape = slide.shapes.add_shape(
            shape_type, Cm(x), Cm(chain_top), Cm(w), Cm(chain_h)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = PRIMARY_PURPLE
        shape.line.fill.background()  # 枠線なし

        tf = shape.text_frame
        tf.word_wrap = False
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE

        # 番号（上）と ラベル（下）を改行で表示
        lines = []
        if step.get("number"):
            lines.append({"text": step["number"], "bold": False, "size": 9})
        lines.append({"text": step["label"], "bold": True, "size": 12})

        for j, line_info in enumerate(lines):
            if j == 0:
                run = p.add_run()
            else:
                p2 = tf.add_paragraph()
                p2.alignment = PP_ALIGN.CENTER
                run = p2.add_run()
            run.text = line_info["text"]
            run.font.size = Pt(line_info["size"])
            run.font.bold = line_info["bold"]
            run.font.name = "Meiryo"
            run.font.color.rgb = WHITE

    # ---- コンテンツグリッド（下段） ----
    grid_top = chain_top + chain_h + 0.15
    grid_bottom = SLIDE_H - 0.8
    grid_h = grid_bottom - grid_top

    cols = 3  # 3列
    rows = (len(content_blocks) + cols - 1) // cols
    cell_w = total_chain_w / cols
    cell_h = grid_h / rows
    cell_padding = 0.15

    for idx, block in enumerate(content_blocks):
        col = idx % cols
        row = idx // cols
        x = 0.8 + col * cell_w
        y = grid_top + row * cell_h

        # セルの外枠（薄いグレー線）
        border = slide.shapes.add_shape(
            1, Cm(x), Cm(y), Cm(cell_w - 0.05), Cm(cell_h - 0.05)
        )
        border.fill.background()
        border.line.color.rgb = LIGHT_GRAY
        border.line.width = Pt(0.75)

        # 番号 + タイトル
        title_box = slide.shapes.add_textbox(
            Cm(x + cell_padding), Cm(y + cell_padding),
            Cm(cell_w - cell_padding * 2), Cm(0.6)
        )
        tf = title_box.text_frame
        tf.word_wrap = True

        # 番号（丸付き数字風に太字）
        p = tf.paragraphs[0]
        if block.get("number"):
            run = p.add_run()
            run.text = f"{block['number']}  "
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.name = "Meiryo"
            run.font.color.rgb = PRIMARY_PURPLE

        run2 = p.add_run()
        run2.text = block["title"]
        run2.font.size = Pt(11)
        run2.font.bold = True
        run2.font.name = "Meiryo"
        run2.font.color.rgb = DARK_TEXT

        # 箇条書き
        bullet_y = y + cell_padding + 0.65
        bullet_box = slide.shapes.add_textbox(
            Cm(x + cell_padding), Cm(bullet_y),
            Cm(cell_w - cell_padding * 2), Cm(cell_h - cell_padding - 0.7)
        )
        tf = bullet_box.text_frame
        tf.word_wrap = True

        highlight_set = set(block.get("highlight_bullets", []))
        for b_idx, bullet_text in enumerate(block.get("bullets", [])):
            para = tf.paragraphs[0] if b_idx == 0 else tf.add_paragraph()
            is_highlight = b_idx in highlight_set
            color = HIGHLIGHT_PURPLE if is_highlight else GRAY_TEXT

            # ビュレット記号（● 小さく）
            run_bullet = para.add_run()
            run_bullet.text = "● "
            run_bullet.font.size = Pt(8)
            run_bullet.font.name = "Meiryo"
            run_bullet.font.color.rgb = color

            run_text = para.add_run()
            run_text.text = bullet_text
            run_text.font.size = Pt(9)
            run_text.font.name = "Meiryo"
            run_text.font.color.rgb = color

    return slide
```

---

## スライドタイプ別: 標準コンテンツ

箇条書きや2カラムレイアウトの標準スライド。

```python
def add_standard_slide(prs, slide_number, section_number, title, subtitle,
                       content_items, two_column=False,
                       breadcrumbs=None, active_breadcrumb=None,
                       copyright_text="Copyright © 2024 YourCompany."):
    """
    content_items（1カラム時）: [{"text": "...", "highlight": False, "level": 0}, ...]
    content_items（2カラム時）: [left_items_list, right_items_list]
    """
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE

    add_common_elements(slide, slide_number, prs.slides.__len__(),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    content_top = 2.3
    content_bottom = SLIDE_H - 0.9
    content_h = content_bottom - content_top
    content_left = 0.8
    content_right = SLIDE_W - 0.8

    def add_bullets(slide, items, left, top, width, height):
        box = slide.shapes.add_textbox(Cm(left), Cm(top), Cm(width), Cm(height))
        tf = box.text_frame
        tf.word_wrap = True

        for i, item in enumerate(items):
            para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            indent = item.get("level", 0)
            is_highlight = item.get("highlight", False)
            color = HIGHLIGHT_PURPLE if is_highlight else DARK_TEXT

            # インデント
            bullet_char = "●" if indent == 0 else "○"
            indent_str = "    " * indent

            run_b = para.add_run()
            run_b.text = f"{indent_str}{bullet_char} "
            run_b.font.size = Pt(10)
            run_b.font.name = "Meiryo"
            run_b.font.color.rgb = color

            run_t = para.add_run()
            run_t.text = item["text"]
            run_t.font.size = Pt(11) if indent == 0 else Pt(10)
            run_t.font.name = "Meiryo"
            run_t.font.color.rgb = color

    if two_column and len(content_items) == 2:
        col_w = (content_right - content_left - 0.3) / 2
        add_bullets(slide, content_items[0],
                    content_left, content_top, col_w, content_h)
        add_bullets(slide, content_items[1],
                    content_left + col_w + 0.3, content_top, col_w, content_h)
    else:
        add_bullets(slide, content_items,
                    content_left, content_top, content_right - content_left, content_h)

    return slide
```

---

## 処理フロー

1. ユーザーの要件ヒアリング（テーマ・スライド構成・内容）
2. `references/format-rules.md` を読み込み（比較マトリクス・アーキテクチャ図のパターン参照）
3. 各スライドの内容を設計
4. 上記コードパターンを使ってPythonスクリプトを生成
5. スクリプトを実行して `.pptx` 出力
6. `presentations/` フォルダに保存
7. LibreOffice等でサムネイル確認（可能な場合）

## 注意事項

- 必ず `pip install python-pptx` を確認すること
- シェブロン形状（52）は環境によってレンダリングが異なる場合がある。問題時は矩形（1）で代替し、右端に三角形を重ねる
- 日本語フォント「Meiryo」が利用できない環境では「Yu Gothic」「MS Gothic」を代替として使用
- スライドごとに `slide_number` を1始まりでインクリメントして渡すこと
- コンテンツが多い場合はスライドを分割し、1スライド1メッセージを原則とする
