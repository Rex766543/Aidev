# コンサルティング資料フォーマットルール

## デザインシステム

### カラー定義

| 用途 | 変数名 | HEX |
|------|--------|-----|
| 主要紫（ヘッダー・バリューチェーンボックス） | PRIMARY_PURPLE | #7030A0 |
| 強調紫（本文ハイライト） | HIGHLIGHT_PURPLE | #CC00CC |
| 薄紫（テーブル背景・セル） | LIGHT_PURPLE | #E8D5F5 |
| 本文濃色 | DARK_TEXT | #262626 |
| サブタイトル・説明 | GRAY_TEXT | #595959 |
| 薄グレー背景 | LIGHT_GRAY | #F2F2F2 |
| コピーライト | COPYRIGHT_GRAY | #999999 |
| 白 | WHITE | #FFFFFF |
| ★マーク黄色 | STAR_YELLOW | #FFC000 |

### タイポグラフィ

| 要素 | フォント | サイズ | スタイル |
|------|---------|--------|----------|
| メインタイトル | Meiryo | 26pt | Bold |
| セクション番号 | Meiryo | 11pt | Regular |
| サブタイトル・説明 | Meiryo | 12pt | Regular |
| 本文・箇条書き（第1階層） | Meiryo | 11pt | Regular |
| 本文・箇条書き（第2階層） | Meiryo | 10pt | Regular |
| テーブルヘッダー | Meiryo | 10pt | Bold |
| テーブル本文 | Meiryo | 10pt | Regular |
| バリューチェーンラベル | Meiryo | 12pt | Bold, White |
| パンくずタブ | Meiryo | 9pt | Regular/Bold |
| スライド番号 | Meiryo | 10pt | Regular |
| コピーライト | Meiryo | 8pt | Regular |

### スライドサイズ・余白

- スライドサイズ: 33.867cm × 19.05cm（16:9）
- 左右余白: 0.8cm
- 上部タイトルエリア: 上端から 0.3cm〜 2.2cm
- コンテンツエリア: 2.3cm〜 18.2cm
- 下部フッターエリア: 18.3cm〜 19.05cm

---

## 比較マトリクス スライドパターン

企業・機能の比較表スライド（右ページの参考スライド参照）。

```python
def add_comparison_matrix_slide(
    prs, slide_number, section_number, title, subtitle,
    row_headers,      # [{"domain": "ユーザーIF(UI)", "function": "充電器検索...", "icon": "📱"}, ...]
    col_groups,       # [{"group": "米国", "columns": ["ChargePoint", "EVgo", "TESLA"]}, ...]
    matrix_data,      # 2次元リスト: matrix_data[row][col] = "star" | "check" | "dash" | ""
    breadcrumbs=None, active_breadcrumb=None,
    copyright_text="Copyright © 2024 YourCompany."
):
    """
    matrix_data の値:
    "star"  → ★ (キャッシュポイント・主要機能) - 紫背景
    "check" → ✓ (カバーしている)
    "dash"  → -  (カバーしていない)
    ""      → 空白
    """
    from pptx.util import Cm, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
    from pptx.oxml.ns import qn
    from lxml import etree

    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE

    add_common_elements(slide, slide_number, prs.slides.__len__(),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    # ---- テーブル設定 ----
    table_top = 2.4
    table_left = 0.8
    table_width = SLIDE_W - 1.6
    table_bottom = SLIDE_H - 0.9
    table_height = table_bottom - table_top

    # 列幅の計算
    total_data_cols = sum(len(g["columns"]) for g in col_groups)
    row_header_col_w = 2.5   # 事業ドメイン列
    func_col_w = 4.5          # 機能説明列
    data_col_w = (table_width - row_header_col_w - func_col_w) / total_data_cols

    total_cols = 2 + total_data_cols  # ドメイン列 + 機能列 + データ列
    total_rows = 1 + 1 + len(row_headers)  # グループヘッダー + 凡例 + データ行

    col_widths = [Cm(row_header_col_w), Cm(func_col_w)] + \
                 [Cm(data_col_w)] * total_data_cols
    row_height = Cm(table_height / total_rows)

    table = slide.shapes.add_table(
        total_rows, total_cols,
        Cm(table_left), Cm(table_top),
        Cm(table_width), Cm(table_height)
    ).table

    # 列幅設定
    for c_idx, w in enumerate(col_widths):
        table.columns[c_idx].width = w

    # ---- グループヘッダー行（行0）----
    # "事業ドメイン" "機能" ヘッダー
    for c_idx, hdr in [(0, "事業ドメイン"), (1, "機能")]:
        cell = table.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = LIGHT_GRAY
        _set_cell_text(cell, hdr, Pt(10), bold=True, color=DARK_TEXT,
                       align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)

    # グループ名（結合セル風に最初のカラムに書く）
    col_offset = 2
    for group in col_groups:
        group_cols = group["columns"]
        # グループ名セル（最初のカラム）
        cell = table.cell(0, col_offset)
        cell.fill.solid()
        cell.fill.fore_color.rgb = LIGHT_PURPLE
        _set_cell_text(cell, group["group"], Pt(10), bold=True,
                       color=PRIMARY_PURPLE, align=PP_ALIGN.CENTER,
                       valign=MSO_ANCHOR.MIDDLE)
        col_offset += len(group_cols)

    # ---- 企業名行（行1）----
    _set_cell_text(table.cell(1, 0), "★ : キャッシュポイント", Pt(8),
                   color=GRAY_TEXT)
    _set_cell_text(table.cell(1, 1), "✓ : カバーするドメイン", Pt(8),
                   color=GRAY_TEXT)

    col_offset = 2
    for group in col_groups:
        for col_name in group["columns"]:
            cell = table.cell(1, col_offset)
            cell.fill.solid()
            cell.fill.fore_color.rgb = LIGHT_GRAY
            _set_cell_text(cell, col_name, Pt(9), bold=True,
                           color=DARK_TEXT, align=PP_ALIGN.CENTER,
                           valign=MSO_ANCHOR.MIDDLE)
            col_offset += 1

    # ---- データ行 ----
    for r_idx, row_info in enumerate(row_headers):
        table_row = r_idx + 2  # 0:グループ, 1:企業名, 2+:データ

        # 事業ドメイン列
        cell_domain = table.cell(table_row, 0)
        bg = LIGHT_PURPLE if r_idx % 2 == 0 else WHITE
        cell_domain.fill.solid()
        cell_domain.fill.fore_color.rgb = bg

        icon = row_info.get("icon", "")
        domain_text = f"{icon} {row_info['domain']}" if icon else row_info['domain']
        _set_cell_text(cell_domain, domain_text, Pt(10), bold=True,
                       color=PRIMARY_PURPLE, valign=MSO_ANCHOR.MIDDLE)

        # 機能説明列
        cell_func = table.cell(table_row, 1)
        cell_func.fill.solid()
        cell_func.fill.fore_color.rgb = bg
        _set_cell_text(cell_func, row_info.get("function", ""), Pt(9),
                       color=DARK_TEXT, valign=MSO_ANCHOR.MIDDLE)

        # データセル
        data_row = matrix_data[r_idx]
        col_offset = 2
        for group in col_groups:
            for col_idx_in_group, _ in enumerate(group["columns"]):
                cell = table.cell(table_row, col_offset)
                value = data_row[col_offset - 2] if col_offset - 2 < len(data_row) else ""

                if value == "star":
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = PRIMARY_PURPLE
                    _set_cell_text(cell, "★", Pt(12), bold=True,
                                   color=WHITE, align=PP_ALIGN.CENTER,
                                   valign=MSO_ANCHOR.MIDDLE)
                elif value == "check":
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = bg
                    _set_cell_text(cell, "✓", Pt(12), bold=False,
                                   color=DARK_TEXT, align=PP_ALIGN.CENTER,
                                   valign=MSO_ANCHOR.MIDDLE)
                else:
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = bg
                    _set_cell_text(cell, "-", Pt(10), color=GRAY_TEXT,
                                   align=PP_ALIGN.CENTER,
                                   valign=MSO_ANCHOR.MIDDLE)
                col_offset += 1

    return slide


def _set_cell_text(cell, text, font_size, bold=False, color=None,
                   align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.MIDDLE):
    """テーブルセルにテキストを設定するユーティリティ"""
    from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
    tf = cell.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = valign
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    run.font.size = font_size
    run.font.bold = bold
    run.font.name = "Meiryo"
    if color:
        run.font.color.rgb = color
```

---

## アーキテクチャ図 スライドパターン

システム構成やフレームワーク図を描く場合のパターン（3枚目の参考スライド参照）。

### 基本的なアプローチ

python-pptxで複雑な図を描く場合、以下の要素を組み合わせる：

1. **外枠ボックス**（プラットフォーム全体を囲む大きな矩形）
2. **コンポーネントボックス**（各機能ブロック）
3. **ラベル付きテキストボックス**（アクター・ユーザー）
4. **矢印コネクター**（フロー・接続）

```python
def add_architecture_slide(prs, slide_number, section_number, title, subtitle,
                            components, actors, connections,
                            platform_label=None, platform_box=None,
                            breadcrumbs=None, active_breadcrumb=None,
                            copyright_text="Copyright © 2024 YourCompany."):
    """
    components: [
        {"id": "llm1", "label": "LLM", "x": 5.0, "y": 4.0, "w": 3.0, "h": 1.5,
         "color": PRIMARY_PURPLE, "text_color": WHITE, "icon": "🤖"}
    ]
    actors: [
        {"id": "user", "label": "経営者", "x": 1.0, "y": 4.0, "w": 2.0, "h": 2.0}
    ]
    connections: [
        {"from": "user", "to": "llm1", "label": "チャット入力",
         "style": "arrow"}  # "arrow" | "double_arrow" | "line"
    ]
    platform_box: {"x": 3.5, "y": 3.0, "w": 25.0, "h": 12.0, "label": "AI HUBプラットフォーム"}
    """
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE

    add_common_elements(slide, slide_number, prs.slides.__len__(),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    # コンポーネント位置マップ（接続線描画用）
    comp_map = {}

    # ---- プラットフォーム外枠 ----
    if platform_box:
        pb = platform_box
        frame = slide.shapes.add_shape(
            1,  # rectangle
            Cm(pb["x"]), Cm(pb["y"]), Cm(pb["w"]), Cm(pb["h"])
        )
        frame.fill.solid()
        frame.fill.fore_color.rgb = LIGHT_PURPLE
        frame.line.color.rgb = PRIMARY_PURPLE
        frame.line.width = Pt(1.5)

        if pb.get("label"):
            lbl = slide.shapes.add_textbox(
                Cm(pb["x"] + 0.2), Cm(pb["y"] + 0.1),
                Cm(pb["w"] - 0.4), Cm(0.5)
            )
            tf = lbl.text_frame
            p = tf.paragraphs[0]
            run = p.add_run()
            run.text = pb["label"]
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.name = "Meiryo"
            run.font.color.rgb = PRIMARY_PURPLE

    # ---- アクター（ユーザー等の外部要素） ----
    for actor in actors:
        x, y, w, h = actor["x"], actor["y"], actor["w"], actor["h"]
        comp_map[actor["id"]] = {"x": x + w/2, "y": y + h/2}  # 中心座標

        box = slide.shapes.add_shape(
            1, Cm(x), Cm(y), Cm(w), Cm(h)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = LIGHT_GRAY
        box.line.color.rgb = GRAY_TEXT
        box.line.width = Pt(0.75)

        tf = box.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER

        if actor.get("icon"):
            run = p.add_run()
            run.text = actor["icon"] + "\n"
            run.font.size = Pt(18)

        run2 = p.add_run() if actor.get("icon") else p.add_run()
        if not actor.get("icon"):
            run2 = p.add_run()
        run2.text = actor["label"]
        run2.font.size = Pt(10)
        run2.font.bold = True
        run2.font.name = "Meiryo"
        run2.font.color.rgb = DARK_TEXT

    # ---- コンポーネントボックス ----
    for comp in components:
        x, y, w, h = comp["x"], comp["y"], comp["w"], comp["h"]
        comp_map[comp["id"]] = {"x": x + w/2, "y": y + h/2}

        fill_color = comp.get("color", PRIMARY_PURPLE)
        text_color = comp.get("text_color", WHITE)

        box = slide.shapes.add_shape(
            1, Cm(x), Cm(y), Cm(w), Cm(h)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = fill_color
        box.line.color.rgb = fill_color
        box.line.width = Pt(0.5)

        tf = box.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER

        if comp.get("icon"):
            run_icon = p.add_run()
            run_icon.text = comp["icon"] + "  "
            run_icon.font.size = Pt(14)

        run_label = p.add_run()
        run_label.text = comp["label"]
        run_label.font.size = Pt(10)
        run_label.font.bold = True
        run_label.font.name = "Meiryo"
        run_label.font.color.rgb = text_color

        # サブラベル
        if comp.get("sublabel"):
            p2 = tf.add_paragraph()
            p2.alignment = PP_ALIGN.CENTER
            run2 = p2.add_run()
            run2.text = comp["sublabel"]
            run2.font.size = Pt(8)
            run2.font.name = "Meiryo"
            run2.font.color.rgb = text_color

    # ---- 接続線（矢印） ----
    # python-pptxのコネクターは add_connector を使う
    from pptx.util import Cm as _Cm
    from pptx.oxml.ns import qn
    STRAIGHT_ARROW = 5   # MSO_CONNECTOR_TYPE.STRAIGHT

    for conn in connections:
        from_id = conn["from"]
        to_id = conn["to"]
        if from_id not in comp_map or to_id not in comp_map:
            continue

        fx, fy = comp_map[from_id]["x"], comp_map[from_id]["y"]
        tx, ty = comp_map[to_id]["x"], comp_map[to_id]["y"]

        connector = slide.shapes.add_connector(
            STRAIGHT_ARROW, _Cm(fx), _Cm(fy), _Cm(tx), _Cm(ty)
        )
        connector.line.color.rgb = GRAY_TEXT
        connector.line.width = Pt(1.0)

        if conn.get("label"):
            # ラベルはテキストボックスで中間に配置
            mid_x = (fx + tx) / 2 - 0.8
            mid_y = (fy + ty) / 2 - 0.2
            lbl = slide.shapes.add_textbox(
                _Cm(mid_x), _Cm(mid_y), _Cm(1.6), _Cm(0.4)
            )
            tf = lbl.text_frame
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.add_run()
            run.text = conn["label"]
            run.font.size = Pt(8)
            run.font.name = "Meiryo"
            run.font.color.rgb = GRAY_TEXT

    return slide
```

---

## タイトルスライドパターン

```python
def add_title_slide(prs, title, subtitle="", date="", author="",
                    copyright_text="Copyright © 2024 YourCompany."):
    """
    表紙スライド: 紫帯＋タイトルの標準コンサルスタイル
    """
    slide_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(slide_layout)
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE

    # 上部紫帯
    header_band = slide.shapes.add_shape(
        1, Cm(0), Cm(0), Cm(SLIDE_W), Cm(1.5)
    )
    header_band.fill.solid()
    header_band.fill.fore_color.rgb = PRIMARY_PURPLE
    header_band.line.fill.background()

    # 下部紫帯
    footer_band = slide.shapes.add_shape(
        1, Cm(0), Cm(SLIDE_H - 1.5), Cm(SLIDE_W), Cm(1.5)
    )
    footer_band.fill.solid()
    footer_band.fill.fore_color.rgb = PRIMARY_PURPLE
    footer_band.line.fill.background()

    # メインタイトル
    title_box = slide.shapes.add_textbox(
        Cm(2.0), Cm(4.0), Cm(SLIDE_W - 4.0), Cm(3.0)
    )
    tf = title_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = title
    run.font.size = Pt(36)
    run.font.bold = True
    run.font.name = "Meiryo"
    run.font.color.rgb = DARK_TEXT

    # サブタイトル
    if subtitle:
        sub_box = slide.shapes.add_textbox(
            Cm(2.0), Cm(7.5), Cm(SLIDE_W - 4.0), Cm(1.5)
        )
        tf = sub_box.text_frame
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = subtitle
        run.font.size = Pt(18)
        run.font.name = "Meiryo"
        run.font.color.rgb = GRAY_TEXT

    # 日付・作成者
    meta_text = "  |  ".join(filter(None, [date, author]))
    if meta_text:
        meta_box = slide.shapes.add_textbox(
            Cm(2.0), Cm(SLIDE_H - 1.2), Cm(SLIDE_W - 4.0), Cm(0.6)
        )
        tf = meta_box.text_frame
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = meta_text
        run.font.size = Pt(12)
        run.font.name = "Meiryo"
        run.font.color.rgb = WHITE

    # コピーライト
    copy_box = slide.shapes.add_textbox(
        Cm(SLIDE_W - 8.0), Cm(SLIDE_H - 1.2), Cm(7.5), Cm(0.6)
    )
    tf = copy_box.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    run = p.add_run()
    run.text = copyright_text
    run.font.size = Pt(8)
    run.font.name = "Meiryo"
    run.font.color.rgb = WHITE

    return slide
```

---

## 完全な生成スクリプト テンプレート

```python
#!/usr/bin/env python3
"""コンサルティング資料生成スクリプト"""

from pptx import Presentation
from pptx.util import Cm, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# --- カラー定義 ---
PRIMARY_PURPLE   = RGBColor(0x70, 0x30, 0xA0)
HIGHLIGHT_PURPLE = RGBColor(0xCC, 0x00, 0xCC)
LIGHT_PURPLE     = RGBColor(0xE8, 0xD5, 0xF5)
DARK_TEXT        = RGBColor(0x26, 0x26, 0x26)
GRAY_TEXT        = RGBColor(0x59, 0x59, 0x59)
LIGHT_GRAY       = RGBColor(0xF2, 0xF2, 0xF2)
COPYRIGHT_GRAY   = RGBColor(0x99, 0x99, 0x99)
WHITE            = RGBColor(0xFF, 0xFF, 0xFF)

SLIDE_W = 33.867
SLIDE_H = 19.05

# --- ここに add_common_elements, add_title_area, 各スライド関数を貼り付ける ---

def main():
    prs = Presentation()
    prs.slide_width  = Cm(SLIDE_W)
    prs.slide_height = Cm(SLIDE_H)

    COPYRIGHT = "Copyright © 2024 YourCompany. All rights reserved."
    BREADCRUMBS = ["概要", "分析", "提言"]

    # --- スライド1: タイトル ---
    add_title_slide(prs,
        title="戦略提言資料",
        subtitle="〇〇事業における競争優位性の構築",
        date="2024年3月",
        author="コンサルティング部門",
        copyright_text=COPYRIGHT
    )

    # --- スライド2: バリューチェーン ---
    add_value_chain_slide(prs,
        slide_number=2,
        section_number="2.",
        title="各バリューチェーンにおける取り組み",
        subtitle="バリューチェーンの各所において、後発企業ならではの取組みを推進していることが収益性の違いを産み出していると考えられる",
        chain_steps=[
            {"number": "①", "label": "企画"},
            {"number": "②", "label": "開発"},
            {"number": "③", "label": "調達"},
            {"number": "④", "label": "製造"},
            {"number": "⑤", "label": "販売"},
            {"number": "⑥", "label": "アフター\nサポート"},
        ],
        content_blocks=[
            {
                "number": "①",
                "title": "前例に捉われないHW/SWの統一・車両アーキテクチャ簡素化の徹底",
                "bullets": [
                    "モデル間でHWを統一し量を確保することで、コスト削減と投資余力を捻出",
                    "ECUを統合することでシンプルかつUpdate可能なSWを構築"
                ],
                "highlight_bullets": []
            },
            # ... 他のブロック
        ],
        breadcrumbs=BREADCRUMBS, active_breadcrumb=1,
        copyright_text=COPYRIGHT
    )

    prs.save("output/consulting_deck.pptx")
    print("saved: output/consulting_deck.pptx")

if __name__ == "__main__":
    main()
```

---

## よくある問題と対処

| 問題 | 原因 | 対処 |
|------|------|------|
| シェブロン形状が表示されない | 環境依存の形状タイプ | shape_type=1（矩形）に変更し、右に三角形を重ねる |
| 日本語が文字化け | フォント未インストール | "Yu Gothic" または "MS PGothic" を代替として使用 |
| テキストがセルからはみ出る | フォントサイズが大きい | Pt(9) または Pt(8) に縮小 |
| 矢印コネクターが繋がらない | 座標計算ミス | コンポーネント中心座標を再確認 |
| テーブルの罫線が太い | デフォルト値 | `cell.border` の設定でPt(0.5)に統一 |
