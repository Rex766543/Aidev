# スライドタイプ別コードパターン集

このファイルには `SKILL.md` の `format-rules.md` に収録されていない
スライドタイプのコードパターンを記載する。

---

## 目次 (toc)

アジェンダ・目次スライド。番号付きトピックをリスト表示。

```python
def add_toc_slide(prs, slide_number, title, topics,
                  breadcrumbs=None, active_breadcrumb=None,
                  copyright_text="Copyright © 2024 YourCompany."):
    """
    topics: [
        {"number": "01", "title": "現状分析", "subtitle": "業界動向と自社ポジション"},
        {"number": "02", "title": "課題特定", "subtitle": "収益性低下の根本原因"},
        ...
    ]
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, "", title, title_top=0.3,
                   has_breadcrumb=bool(breadcrumbs))

    n = len(topics)
    content_top = 2.4
    content_h = SLIDE_H - content_top - 0.9
    item_h = content_h / max(n, 1)
    left = 2.5
    num_w = 1.5
    text_w = SLIDE_W - left - num_w - 1.0

    for i, topic in enumerate(topics):
        y = content_top + i * item_h

        # 番号ボックス（紫）
        num_box = slide.shapes.add_shape(
            1, Cm(left), Cm(y + 0.1), Cm(num_w), Cm(item_h - 0.3)
        )
        num_box.fill.solid()
        num_box.fill.fore_color.rgb = PRIMARY_PURPLE
        num_box.line.fill.background()
        tf = num_box.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = topic["number"]
        run.font.size = Pt(20)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = WHITE

        # タイトル + サブタイトル
        txt_box = slide.shapes.add_textbox(
            Cm(left + num_w + 0.4), Cm(y + 0.1), Cm(text_w), Cm(item_h - 0.3)
        )
        tf = txt_box.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE

        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = topic["title"]
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = DARK_TEXT

        if topic.get("subtitle"):
            p2 = tf.add_paragraph()
            run2 = p2.add_run()
            run2.text = topic["subtitle"]
            run2.font.size = Pt(11)
            run2.font.name = "Meiryo"
            run2.font.color.rgb = GRAY_TEXT

        # 区切り線
        if i < n - 1:
            line = slide.shapes.add_shape(
                1, Cm(left), Cm(y + item_h - 0.05),
                Cm(SLIDE_W - left - 1.0), Cm(0.04)
            )
            line.fill.solid()
            line.fill.fore_color.rgb = LIGHT_GRAY
            line.line.fill.background()

    return slide
```

---

## セクション区切り (section_divider)

セクションの冒頭に挿入する区切りスライド。紫背景＋大見出し。

```python
def add_section_divider_slide(prs, slide_number, section_number, section_title,
                               section_subtitle="",
                               copyright_text="Copyright © 2024 YourCompany."):
    slide = prs.slides.add_slide(prs.slide_layouts[6])

    # 背景を紫に
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = PRIMARY_PURPLE

    # セクション番号（薄白）
    if section_number:
        num_box = slide.shapes.add_textbox(
            Cm(3.0), Cm(6.0), Cm(SLIDE_W - 6.0), Cm(1.5)
        )
        tf = num_box.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.LEFT
        run = p.add_run()
        run.text = section_number
        run.font.size = Pt(48)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        run.font.color.theme_color = None

    # セクションタイトル
    title_box = slide.shapes.add_textbox(
        Cm(3.0), Cm(7.8), Cm(SLIDE_W - 6.0), Cm(2.5)
    )
    tf = title_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = section_title
    run.font.size = Pt(32)
    run.font.bold = True
    run.font.name = "Meiryo"
    run.font.color.rgb = WHITE

    if section_subtitle:
        p2 = tf.add_paragraph()
        run2 = p2.add_run()
        run2.text = section_subtitle
        run2.font.size = Pt(16)
        run2.font.name = "Meiryo"
        run2.font.color.rgb = RGBColor(0xCC, 0xCC, 0xFF)

    # コピーライト
    copy_box = slide.shapes.add_textbox(
        Cm(0.5), Cm(SLIDE_H - 0.7), Cm(SLIDE_W - 1.0), Cm(0.5)
    )
    tf = copy_box.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    run = p.add_run()
    run.text = copyright_text
    run.font.size = Pt(8)
    run.font.name = "Meiryo"
    run.font.color.rgb = RGBColor(0xCC, 0xCC, 0xFF)

    return slide
```

---

## エグゼクティブサマリー (executive_summary)

冒頭に配置するサマリースライド。メッセージ1文 + 要点3〜5箇条。

```python
def add_executive_summary_slide(prs, slide_number, title, message,
                                  key_points, breadcrumbs=None,
                                  active_breadcrumb=None,
                                  copyright_text="Copyright © 2024 YourCompany."):
    """
    message: "本資料では〇〇を提言する。..."（1〜2文）
    key_points: [
        {"title": "コスト削減", "body": "製造工程の見直しにより20%削減が見込まれる"},
        ...
    ]
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, "", title, title_top=0.3,
                   has_breadcrumb=bool(breadcrumbs))

    # メッセージボックス（紫左ボーダー）
    border = slide.shapes.add_shape(
        1, Cm(0.8), Cm(2.4), Cm(0.18), Cm(1.6)
    )
    border.fill.solid()
    border.fill.fore_color.rgb = PRIMARY_PURPLE
    border.line.fill.background()

    msg_box = slide.shapes.add_textbox(
        Cm(1.3), Cm(2.4), Cm(SLIDE_W - 2.5), Cm(1.6)
    )
    tf = msg_box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    run = p.add_run()
    run.text = message
    run.font.size = Pt(13)
    run.font.bold = True
    run.font.name = "Meiryo"
    run.font.color.rgb = DARK_TEXT

    # キーポイントカード
    n = len(key_points)
    card_top = 4.3
    card_h = SLIDE_H - card_top - 0.9
    card_w = (SLIDE_W - 1.6 - (n - 1) * 0.25) / n

    for i, kp in enumerate(key_points):
        x = 0.8 + i * (card_w + 0.25)

        # カード背景
        card = slide.shapes.add_shape(
            1, Cm(x), Cm(card_top), Cm(card_w), Cm(card_h)
        )
        card.fill.solid()
        card.fill.fore_color.rgb = LIGHT_PURPLE
        card.line.color.rgb = PRIMARY_PURPLE
        card.line.width = Pt(0.75)

        # 番号バッジ
        badge = slide.shapes.add_shape(
            1, Cm(x + 0.3), Cm(card_top + 0.3), Cm(0.7), Cm(0.7)
        )
        badge.fill.solid()
        badge.fill.fore_color.rgb = PRIMARY_PURPLE
        badge.line.fill.background()
        tf = badge.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = str(i + 1)
        run.font.size = Pt(10)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = WHITE

        # タイトル
        ttl = slide.shapes.add_textbox(
            Cm(x + 1.2), Cm(card_top + 0.3),
            Cm(card_w - 1.4), Cm(0.7)
        )
        tf = ttl.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = kp["title"]
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = PRIMARY_PURPLE

        # 本文
        body_box = slide.shapes.add_textbox(
            Cm(x + 0.3), Cm(card_top + 1.2),
            Cm(card_w - 0.6), Cm(card_h - 1.5)
        )
        tf = body_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = kp["body"]
        run.font.size = Pt(10)
        run.font.name = "Meiryo"
        run.font.color.rgb = DARK_TEXT

    return slide
```

---

## キーインサイト・引用ハイライト (quote_insight)

大きなメッセージ1文を中央に配置するインパクトスライド。

```python
def add_quote_insight_slide(prs, slide_number, insight_text,
                              source="", note="",
                              copyright_text="Copyright © 2024 YourCompany."):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        copyright_text=copyright_text)

    # 上下に紫アクセントライン
    for y_pos in [1.5, SLIDE_H - 1.5]:
        line = slide.shapes.add_shape(
            1, Cm(3.0), Cm(y_pos), Cm(SLIDE_W - 6.0), Cm(0.08)
        )
        line.fill.solid()
        line.fill.fore_color.rgb = PRIMARY_PURPLE
        line.line.fill.background()

    # インサイトテキスト（大きく中央）
    txt = slide.shapes.add_textbox(
        Cm(2.0), Cm(3.5), Cm(SLIDE_W - 4.0), Cm(SLIDE_H - 7.0)
    )
    tf = txt.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = f'「{insight_text}」'
    run.font.size = Pt(28)
    run.font.bold = True
    run.font.name = "Meiryo"
    run.font.color.rgb = DARK_TEXT

    if source:
        src = slide.shapes.add_textbox(
            Cm(2.0), Cm(SLIDE_H - 2.2), Cm(SLIDE_W - 4.0), Cm(0.6)
        )
        tf = src.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = f"出典: {source}"
        run.font.size = Pt(10)
        run.font.name = "Meiryo"
        run.font.color.rgb = GRAY_TEXT

    return slide
```

---

## Before / After 比較 (before_after)

AS-IS / TO-BE または課題→解決策を左右2カラムで対比する。

```python
def add_before_after_slide(prs, slide_number, section_number, title, subtitle,
                            left_label, left_items,
                            right_label, right_items,
                            breadcrumbs=None, active_breadcrumb=None,
                            copyright_text="Copyright © 2024 YourCompany."):
    """
    left_items / right_items: [{"text": "...", "highlight": False}, ...]
    left_label / right_label: "AS-IS（現状）" / "TO-BE（あるべき姿）"
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    col_top = 2.4
    col_h = SLIDE_H - col_top - 0.9
    col_w = (SLIDE_W - 2.6) / 2
    gap = 1.0  # 中央の矢印スペース

    for side_idx, (label, items, x) in enumerate([
        (left_label,  left_items,  0.8),
        (right_label, right_items, 0.8 + col_w + gap)
    ]):
        is_right = (side_idx == 1)
        header_color = LIGHT_GRAY if not is_right else LIGHT_PURPLE
        label_color = DARK_TEXT if not is_right else PRIMARY_PURPLE

        # ラベルヘッダー
        hdr = slide.shapes.add_shape(
            1, Cm(x), Cm(col_top), Cm(col_w), Cm(0.8)
        )
        hdr.fill.solid()
        hdr.fill.fore_color.rgb = header_color
        hdr.line.fill.background()
        tf = hdr.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = label
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = label_color

        # コンテンツエリア（薄背景）
        area = slide.shapes.add_shape(
            1, Cm(x), Cm(col_top + 0.8), Cm(col_w), Cm(col_h - 0.8)
        )
        area.fill.solid()
        area.fill.fore_color.rgb = LIGHT_GRAY if not is_right else RGBColor(0xF5, 0xEE, 0xFC)
        area.line.color.rgb = LIGHT_GRAY
        area.line.width = Pt(0.5)

        # 箇条書き
        txt = slide.shapes.add_textbox(
            Cm(x + 0.3), Cm(col_top + 1.0),
            Cm(col_w - 0.6), Cm(col_h - 1.2)
        )
        tf = txt.text_frame
        tf.word_wrap = True
        for i, item in enumerate(items):
            para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            color = HIGHLIGHT_PURPLE if item.get("highlight") else DARK_TEXT
            run = para.add_run()
            run.text = f"● {item['text']}"
            run.font.size = Pt(11)
            run.font.name = "Meiryo"
            run.font.color.rgb = color

    # 中央の矢印
    arrow_x = 0.8 + col_w + 0.1
    arrow_y = col_top + col_h / 2 - 0.3
    arrow = slide.shapes.add_textbox(Cm(arrow_x), Cm(arrow_y), Cm(0.8), Cm(0.6))
    tf = arrow.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = "→"
    run.font.size = Pt(24)
    run.font.bold = True
    run.font.name = "Meiryo"
    run.font.color.rgb = PRIMARY_PURPLE

    return slide
```

---

## プロセスフロー (process_flow)

番号付きステップを横一列に並べた標準的なプロセス図。

```python
def add_process_flow_slide(prs, slide_number, section_number, title, subtitle,
                            steps, detail_section=None,
                            breadcrumbs=None, active_breadcrumb=None,
                            copyright_text="Copyright © 2024 YourCompany."):
    """
    steps: [
        {"number": "1", "label": "現状分析", "detail": "市場・競合・自社を把握"},
        ...
    ]
    detail_section: steps の下に追加説明テキストを置く場合 {"title": "...", "bullets": [...]}
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    n = len(steps)
    flow_top = 4.5
    flow_h = 2.5
    total_w = SLIDE_W - 1.6
    step_w = total_w / n
    arrow_w = 0.5

    for i, step in enumerate(steps):
        x = 0.8 + i * step_w
        box_w = step_w - (arrow_w if i < n - 1 else 0) - 0.1

        # ステップボックス
        box = slide.shapes.add_shape(
            1, Cm(x), Cm(flow_top), Cm(box_w), Cm(flow_h)
        )
        box.fill.solid()
        box.fill.fore_color.rgb = PRIMARY_PURPLE
        box.line.fill.background()

        tf = box.text_frame
        tf.word_wrap = True
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE

        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run_num = p.add_run()
        run_num.text = f"STEP {step['number']}\n"
        run_num.font.size = Pt(9)
        run_num.font.name = "Meiryo"
        run_num.font.color.rgb = RGBColor(0xCC, 0xCC, 0xFF)

        p2 = tf.add_paragraph()
        p2.alignment = PP_ALIGN.CENTER
        run_lbl = p2.add_run()
        run_lbl.text = step["label"]
        run_lbl.font.size = Pt(13)
        run_lbl.font.bold = True
        run_lbl.font.name = "Meiryo"
        run_lbl.font.color.rgb = WHITE

        # 詳細テキスト（ボックス下）
        if step.get("detail"):
            det = slide.shapes.add_textbox(
                Cm(x), Cm(flow_top + flow_h + 0.15),
                Cm(box_w), Cm(1.2)
            )
            tf = det.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.add_run()
            run.text = step["detail"]
            run.font.size = Pt(9)
            run.font.name = "Meiryo"
            run.font.color.rgb = GRAY_TEXT

        # 矢印（ステップ間）
        if i < n - 1:
            arr_x = x + box_w + 0.05
            arr = slide.shapes.add_textbox(
                Cm(arr_x), Cm(flow_top + flow_h / 2 - 0.3),
                Cm(arrow_w - 0.1), Cm(0.6)
            )
            tf = arr.text_frame
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.add_run()
            run.text = "▶"
            run.font.size = Pt(14)
            run.font.name = "Meiryo"
            run.font.color.rgb = PRIMARY_PURPLE

    return slide
```

---

## KPIハイライト (kpi_highlight)

大きな数字・指標を3〜4枚のカードで並べるインパクトスライド。

```python
def add_kpi_highlight_slide(prs, slide_number, section_number, title, subtitle,
                             kpis, breadcrumbs=None, active_breadcrumb=None,
                             copyright_text="Copyright © 2024 YourCompany."):
    """
    kpis: [
        {"label": "市場規模", "value": "¥2.4兆", "unit": "（2024年）",
         "delta": "+15%", "delta_positive": True, "note": "前年比"},
        ...
    ]
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    n = len(kpis)
    card_top = 3.5
    card_h = SLIDE_H - card_top - 1.5
    total_w = SLIDE_W - 1.6
    gap = 0.4
    card_w = (total_w - gap * (n - 1)) / n

    for i, kpi in enumerate(kpis):
        x = 0.8 + i * (card_w + gap)

        # カード
        card = slide.shapes.add_shape(
            1, Cm(x), Cm(card_top), Cm(card_w), Cm(card_h)
        )
        card.fill.solid()
        card.fill.fore_color.rgb = LIGHT_PURPLE
        card.line.color.rgb = PRIMARY_PURPLE
        card.line.width = Pt(1.0)

        # ラベル
        lbl = slide.shapes.add_textbox(
            Cm(x + 0.3), Cm(card_top + 0.4), Cm(card_w - 0.6), Cm(0.6)
        )
        tf = lbl.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = kpi["label"]
        run.font.size = Pt(12)
        run.font.name = "Meiryo"
        run.font.color.rgb = GRAY_TEXT

        # 大きな数値
        val = slide.shapes.add_textbox(
            Cm(x + 0.2), Cm(card_top + 1.2), Cm(card_w - 0.4), Cm(2.0)
        )
        tf = val.text_frame
        tf.word_wrap = False
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = kpi["value"]
        run.font.size = Pt(40)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = PRIMARY_PURPLE

        # 単位
        if kpi.get("unit"):
            unit_box = slide.shapes.add_textbox(
                Cm(x + 0.3), Cm(card_top + 3.3), Cm(card_w - 0.6), Cm(0.5)
            )
            tf = unit_box.text_frame
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.add_run()
            run.text = kpi["unit"]
            run.font.size = Pt(10)
            run.font.name = "Meiryo"
            run.font.color.rgb = GRAY_TEXT

        # デルタ（変化率）
        if kpi.get("delta"):
            is_pos = kpi.get("delta_positive", True)
            d_color = RGBColor(0x00, 0x80, 0x00) if is_pos else RGBColor(0xCC, 0x00, 0x00)
            d_box = slide.shapes.add_textbox(
                Cm(x + 0.3), Cm(card_top + card_h - 1.0), Cm(card_w - 0.6), Cm(0.7)
            )
            tf = d_box.text_frame
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.add_run()
            arrow = "▲" if is_pos else "▼"
            run.text = f"{arrow} {kpi['delta']}"
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.name = "Meiryo"
            run.font.color.rgb = d_color

    return slide
```

---

## 2×2マトリクス (two_by_two)

重要度×緊急度、影響度×実現性など、2軸4象限のフレームワーク図。

```python
def add_two_by_two_slide(prs, slide_number, section_number, title, subtitle,
                          x_axis_label, y_axis_label,
                          x_low_label, x_high_label,
                          y_low_label, y_high_label,
                          quadrant_labels,  # {"TL": ..., "TR": ..., "BL": ..., "BR": ...}
                          items,  # [{"label": "施策A", "x": 0.8, "y": 0.7}, ...]  0.0-1.0の位置
                          breadcrumbs=None, active_breadcrumb=None,
                          copyright_text="Copyright © 2024 YourCompany."):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    # 4象限エリア
    mat_left = 2.5
    mat_top = 2.4
    mat_w = SLIDE_W - mat_left - 1.5
    mat_h = SLIDE_H - mat_top - 1.5
    mid_x = mat_left + mat_w / 2
    mid_y = mat_top + mat_h / 2

    quadrant_configs = {
        "TL": (mat_left, mat_top, LIGHT_GRAY),
        "TR": (mid_x, mat_top, LIGHT_PURPLE),
        "BL": (mat_left, mid_y, LIGHT_GRAY),
        "BR": (mid_x, mid_y, LIGHT_GRAY),
    }
    for key, (qx, qy, color) in quadrant_configs.items():
        q = slide.shapes.add_shape(
            1, Cm(qx), Cm(qy), Cm(mat_w / 2), Cm(mat_h / 2)
        )
        q.fill.solid()
        q.fill.fore_color.rgb = color
        q.line.color.rgb = RGBColor(0xCC, 0xCC, 0xCC)
        q.line.width = Pt(0.5)

        if quadrant_labels.get(key):
            ql = slide.shapes.add_textbox(
                Cm(qx + 0.2), Cm(qy + 0.1),
                Cm(mat_w / 2 - 0.4), Cm(0.6)
            )
            tf = ql.text_frame
            p = tf.paragraphs[0]
            run = p.add_run()
            run.text = quadrant_labels[key]
            run.font.size = Pt(10)
            run.font.bold = True
            run.font.name = "Meiryo"
            run.font.color.rgb = PRIMARY_PURPLE

    # 軸ラベル（Y軸）
    y_lbl = slide.shapes.add_textbox(
        Cm(0.3), Cm(mat_top), Cm(2.0), Cm(mat_h)
    )
    tf = y_lbl.text_frame
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = y_axis_label
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.name = "Meiryo"
    run.font.color.rgb = DARK_TEXT

    # 軸ラベル（X軸）
    x_lbl = slide.shapes.add_textbox(
        Cm(mat_left), Cm(mat_top + mat_h + 0.1), Cm(mat_w), Cm(0.5)
    )
    tf = x_lbl.text_frame
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = x_axis_label
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.name = "Meiryo"
    run.font.color.rgb = DARK_TEXT

    # プロットアイテム
    for item in items:
        px = mat_left + item["x"] * mat_w
        py = mat_top + (1 - item["y"]) * mat_h  # y軸は上が高い

        dot = slide.shapes.add_shape(
            1, Cm(px - 0.35), Cm(py - 0.25), Cm(0.7), Cm(0.5)
        )
        dot.fill.solid()
        dot.fill.fore_color.rgb = PRIMARY_PURPLE
        dot.line.fill.background()

        lbl = slide.shapes.add_textbox(
            Cm(px - 0.5), Cm(py + 0.3), Cm(1.5), Cm(0.4)
        )
        tf = lbl.text_frame
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = item["label"]
        run.font.size = Pt(8)
        run.font.name = "Meiryo"
        run.font.color.rgb = DARK_TEXT

    return slide
```

---

## タイムライン / ロードマップ (timeline)

横軸を時間、縦に施策・フェーズを並べるガントチャート風スライド。

```python
def add_timeline_slide(prs, slide_number, section_number, title, subtitle,
                        periods, lanes,
                        breadcrumbs=None, active_breadcrumb=None,
                        copyright_text="Copyright © 2024 YourCompany."):
    """
    periods: ["2024 Q1", "Q2", "Q3", "Q4", "2025 Q1", ...]
    lanes: [
        {
            "label": "フェーズ1: 基盤整備",
            "bars": [{"start": 0, "end": 2, "color": "primary", "label": "現状調査"}]
        },
        ...
    ]
    bar color: "primary" = PRIMARY_PURPLE, "light" = LIGHT_PURPLE, "gray" = LIGHT_GRAY
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    label_w = 4.0
    tl_left = label_w + 1.0
    tl_top = 2.5
    tl_w = SLIDE_W - tl_left - 0.8
    tl_bottom = SLIDE_H - 0.9
    tl_h = tl_bottom - tl_top

    n_periods = len(periods)
    n_lanes = len(lanes)
    period_w = tl_w / n_periods
    lane_h = tl_h / (n_lanes + 1)  # +1 for header

    color_map = {
        "primary": PRIMARY_PURPLE,
        "light": LIGHT_PURPLE,
        "gray": LIGHT_GRAY,
        "highlight": HIGHLIGHT_PURPLE,
    }

    # 期間ヘッダー
    for j, period in enumerate(periods):
        px = tl_left + j * period_w
        phdr = slide.shapes.add_shape(
            1, Cm(px), Cm(tl_top), Cm(period_w - 0.05), Cm(lane_h - 0.1)
        )
        bg = PRIMARY_PURPLE if j % 4 == 0 else LIGHT_GRAY  # 年の区切りを強調
        phdr.fill.solid()
        phdr.fill.fore_color.rgb = bg
        phdr.line.fill.background()

        tf = phdr.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = period
        run.font.size = Pt(9)
        run.font.bold = (j % 4 == 0)
        run.font.name = "Meiryo"
        run.font.color.rgb = WHITE if j % 4 == 0 else DARK_TEXT

    # レーン
    for i, lane in enumerate(lanes):
        ly = tl_top + (i + 1) * lane_h
        bg = LIGHT_GRAY if i % 2 == 0 else WHITE

        # ラベル
        lbl = slide.shapes.add_textbox(
            Cm(0.8), Cm(ly), Cm(label_w), Cm(lane_h - 0.05)
        )
        tf = lbl.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        tf.word_wrap = True
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = lane["label"]
        run.font.size = Pt(10)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = DARK_TEXT

        # レーン背景
        bg_shape = slide.shapes.add_shape(
            1, Cm(tl_left), Cm(ly), Cm(tl_w), Cm(lane_h - 0.05)
        )
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = bg
        bg_shape.line.fill.background()

        # バー
        for bar in lane.get("bars", []):
            bx = tl_left + bar["start"] * period_w
            bw = (bar["end"] - bar["start"] + 1) * period_w - 0.1
            bar_color = color_map.get(bar.get("color", "primary"), PRIMARY_PURPLE)

            b = slide.shapes.add_shape(
                1, Cm(bx + 0.05), Cm(ly + lane_h * 0.2),
                Cm(bw), Cm(lane_h * 0.6)
            )
            b.fill.solid()
            b.fill.fore_color.rgb = bar_color
            b.line.fill.background()

            if bar.get("label"):
                bl = slide.shapes.add_textbox(
                    Cm(bx + 0.1), Cm(ly + lane_h * 0.15),
                    Cm(bw - 0.2), Cm(lane_h * 0.7)
                )
                tf = bl.text_frame
                tf.vertical_anchor = MSO_ANCHOR.MIDDLE
                p = tf.paragraphs[0]
                p.alignment = PP_ALIGN.CENTER
                run = p.add_run()
                run.text = bar["label"]
                run.font.size = Pt(8)
                run.font.name = "Meiryo"
                run.font.color.rgb = WHITE if bar_color == PRIMARY_PURPLE else DARK_TEXT

    return slide
```

---

## アクションプラン表 (action_plan)

担当・期限・ステータスを含むアクションアイテムの一覧表。

```python
def add_action_plan_slide(prs, slide_number, section_number, title, subtitle,
                           actions, breadcrumbs=None, active_breadcrumb=None,
                           copyright_text="Copyright © 2024 YourCompany."):
    """
    actions: [
        {"no": "1", "action": "市場調査の実施", "owner": "田中",
         "due": "2024/04", "status": "進行中", "note": "外部リサーチ会社と連携"},
        ...
    ]
    status color: "完了"→緑, "進行中"→青, "未着手"→灰, "遅延"→赤
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    # テーブルヘッダー定義
    headers = ["No.", "アクション内容", "担当", "期限", "ステータス", "備考"]
    col_ratios = [0.06, 0.35, 0.10, 0.10, 0.12, 0.27]
    total_w = SLIDE_W - 1.6
    col_widths = [total_w * r for r in col_ratios]

    tbl_left = 0.8
    tbl_top = 2.4
    tbl_bottom = SLIDE_H - 0.9
    tbl_h = tbl_bottom - tbl_top
    row_h = tbl_h / (len(actions) + 1)

    status_colors = {
        "完了": RGBColor(0x00, 0x80, 0x00),
        "進行中": RGBColor(0x00, 0x60, 0xCC),
        "未着手": GRAY_TEXT,
        "遅延": RGBColor(0xCC, 0x00, 0x00),
    }

    # ヘッダー行
    x = tbl_left
    for h, w in zip(headers, col_widths):
        hdr = slide.shapes.add_shape(
            1, Cm(x), Cm(tbl_top), Cm(w - 0.05), Cm(row_h)
        )
        hdr.fill.solid()
        hdr.fill.fore_color.rgb = PRIMARY_PURPLE
        hdr.line.fill.background()
        tf = hdr.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = h
        run.font.size = Pt(10)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = WHITE
        x += w

    # データ行
    for r_idx, action in enumerate(actions):
        ry = tbl_top + (r_idx + 1) * row_h
        bg = LIGHT_GRAY if r_idx % 2 == 0 else WHITE
        values = [
            action.get("no", str(r_idx + 1)),
            action.get("action", ""),
            action.get("owner", ""),
            action.get("due", ""),
            action.get("status", ""),
            action.get("note", ""),
        ]
        x = tbl_left
        for c_idx, (val, w) in enumerate(zip(values, col_widths)):
            cell = slide.shapes.add_shape(
                1, Cm(x), Cm(ry), Cm(w - 0.05), Cm(row_h)
            )
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            cell.line.color.rgb = LIGHT_GRAY
            cell.line.width = Pt(0.5)

            # ステータス列は色付きテキスト
            text_color = DARK_TEXT
            if c_idx == 4:  # ステータス列
                text_color = status_colors.get(val, GRAY_TEXT)

            tf = cell.text_frame
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER if c_idx in [0, 2, 3, 4] else PP_ALIGN.LEFT
            run = p.add_run()
            run.text = val
            run.font.size = Pt(9)
            run.font.bold = (c_idx == 4)
            run.font.name = "Meiryo"
            run.font.color.rgb = text_color
            x += w

    return slide
```

---

## SWOT分析 (swot)

強み・弱み・機会・脅威の4象限フレームワーク。

```python
def add_swot_slide(prs, slide_number, section_number, title, subtitle,
                   strengths, weaknesses, opportunities, threats,
                   breadcrumbs=None, active_breadcrumb=None,
                   copyright_text="Copyright © 2024 YourCompany."):
    """
    各引数はリスト: ["テキスト1", "テキスト2", ...]
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    mat_left = 0.8
    mat_top = 2.4
    mat_w = SLIDE_W - 1.6
    mat_h = SLIDE_H - mat_top - 0.9
    q_w = mat_w / 2
    q_h = mat_h / 2

    swot_configs = [
        ("S  強み (Strengths)",     strengths,     mat_left,       mat_top,       PRIMARY_PURPLE, LIGHT_PURPLE),
        ("W  弱み (Weaknesses)",    weaknesses,    mat_left+q_w,   mat_top,       GRAY_TEXT,      LIGHT_GRAY),
        ("O  機会 (Opportunities)", opportunities, mat_left,       mat_top+q_h,   RGBColor(0x20,0x80,0x40), RGBColor(0xE0,0xF5,0xE8)),
        ("T  脅威 (Threats)",       threats,       mat_left+q_w,   mat_top+q_h,   RGBColor(0xCC,0x30,0x30), RGBColor(0xFC,0xEC,0xEC)),
    ]

    for label, items, qx, qy, hdr_color, bg_color in swot_configs:
        # ヘッダー
        hdr = slide.shapes.add_shape(
            1, Cm(qx + 0.05), Cm(qy + 0.05), Cm(q_w - 0.1), Cm(0.7)
        )
        hdr.fill.solid()
        hdr.fill.fore_color.rgb = hdr_color
        hdr.line.fill.background()
        tf = hdr.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = label
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = WHITE

        # コンテンツ
        area = slide.shapes.add_shape(
            1, Cm(qx + 0.05), Cm(qy + 0.75), Cm(q_w - 0.1), Cm(q_h - 0.8)
        )
        area.fill.solid()
        area.fill.fore_color.rgb = bg_color
        area.line.color.rgb = LIGHT_GRAY
        area.line.width = Pt(0.5)

        txt = slide.shapes.add_textbox(
            Cm(qx + 0.3), Cm(qy + 0.85), Cm(q_w - 0.6), Cm(q_h - 1.0)
        )
        tf = txt.text_frame
        tf.word_wrap = True
        for i, item in enumerate(items):
            para = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
            run = para.add_run()
            run.text = f"● {item}"
            run.font.size = Pt(10)
            run.font.name = "Meiryo"
            run.font.color.rgb = DARK_TEXT

    return slide
```

---

## Next Steps / まとめ (next_steps)

資料の締めくくりに使うアクションまとめスライド。

```python
def add_next_steps_slide(prs, slide_number, section_number, title, subtitle,
                          steps, breadcrumbs=None, active_breadcrumb=None,
                          copyright_text="Copyright © 2024 YourCompany."):
    """
    steps: [
        {"number": "1", "action": "PoC実施", "owner": "田中・鈴木",
         "timeline": "〜2024年6月", "detail": "3社にインタビューを実施し仮説を検証"},
        ...
    ]
    """
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = WHITE
    add_common_elements(slide, slide_number, len(prs.slides),
                        breadcrumbs, active_breadcrumb, copyright_text)
    add_title_area(slide, section_number, title, subtitle,
                   title_top=0.3, has_breadcrumb=bool(breadcrumbs))

    n = len(steps)
    content_top = 2.5
    content_h = SLIDE_H - content_top - 0.9
    item_h = content_h / max(n, 1)

    for i, step in enumerate(steps):
        y = content_top + i * item_h

        # 番号バッジ
        badge = slide.shapes.add_shape(
            1, Cm(0.8), Cm(y + 0.1), Cm(0.9), Cm(item_h - 0.25)
        )
        badge.fill.solid()
        badge.fill.fore_color.rgb = PRIMARY_PURPLE
        badge.line.fill.background()
        tf = badge.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run = p.add_run()
        run.text = step["number"]
        run.font.size = Pt(16)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = WHITE

        # アクション（メイン）
        act = slide.shapes.add_textbox(
            Cm(2.0), Cm(y + 0.1), Cm(12.0), Cm(0.7)
        )
        tf = act.text_frame
        tf.vertical_anchor = MSO_ANCHOR.MIDDLE
        p = tf.paragraphs[0]
        run = p.add_run()
        run.text = step["action"]
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.name = "Meiryo"
        run.font.color.rgb = DARK_TEXT

        # 詳細
        if step.get("detail"):
            det = slide.shapes.add_textbox(
                Cm(2.0), Cm(y + 0.85), Cm(18.0), Cm(item_h - 1.0)
            )
            tf = det.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            run = p.add_run()
            run.text = step["detail"]
            run.font.size = Pt(10)
            run.font.name = "Meiryo"
            run.font.color.rgb = GRAY_TEXT

        # 担当・期限（右側）
        meta_parts = []
        if step.get("owner"):
            meta_parts.append(f"担当: {step['owner']}")
        if step.get("timeline"):
            meta_parts.append(f"期限: {step['timeline']}")

        if meta_parts:
            meta = slide.shapes.add_textbox(
                Cm(21.0), Cm(y + 0.1), Cm(SLIDE_W - 22.0), Cm(item_h - 0.3)
            )
            tf = meta.text_frame
            tf.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf.word_wrap = True
            for j, mp in enumerate(meta_parts):
                para = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
                run = para.add_run()
                run.text = mp
                run.font.size = Pt(10)
                run.font.bold = (j == 1)
                run.font.name = "Meiryo"
                run.font.color.rgb = PRIMARY_PURPLE if j == 1 else GRAY_TEXT

        # 区切り線
        if i < n - 1:
            sep = slide.shapes.add_shape(
                1, Cm(0.8), Cm(y + item_h - 0.06),
                Cm(SLIDE_W - 1.6), Cm(0.04)
            )
            sep.fill.solid()
            sep.fill.fore_color.rgb = LIGHT_GRAY
            sep.line.fill.background()

    return slide
```
