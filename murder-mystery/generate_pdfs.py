"""
マーダーミステリー「最後の晩餐会」PDF生成スクリプト
生成物:
  - pdf/rules.pdf              ルール説明書
  - pdf/gm_guide.pdf           GM進行ガイド
  - pdf/handout_01_aoi.pdf     蒼井 美咲
  - pdf/handout_02_kuroda.pdf  黒田 剛
  - pdf/handout_03_shiraishi.pdf 白石 玲奈（犯人）
  - pdf/handout_04_akabane.pdf 赤羽 翔太
  - pdf/handout_05_midorikawa.pdf 緑川 教授
  - pdf/handout_06_kanazawa.pdf 金沢 ルミ（偽犯人）
  - pdf/cards_phase1.pdf       フェーズ1カード（7枚）
  - pdf/cards_phase2.pdf       フェーズ2カード（10枚）
"""

import os
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# --- Font Setup ---
FONT_PATH = "/Library/Fonts/Arial Unicode.ttf"
pdfmetrics.registerFont(TTFont("JP", FONT_PATH))
pdfmetrics.registerFont(TTFont("JP-Bold", FONT_PATH))  # same file, simulate bold

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(BASE_DIR, "pdf")
os.makedirs(PDF_DIR, exist_ok=True)

# --- Color Scheme ---
DARK = HexColor("#1a1a2e")
ACCENT = HexColor("#c0392b")
LIGHT_BG = HexColor("#f5f5f0")
CARD_BG = HexColor("#faf8f0")

# --- Styles ---
def get_styles():
    styles = {}
    styles["title"] = ParagraphStyle(
        "Title", fontName="JP", fontSize=20, leading=28,
        textColor=DARK, alignment=TA_CENTER, spaceAfter=6*mm
    )
    styles["subtitle"] = ParagraphStyle(
        "Subtitle", fontName="JP", fontSize=12, leading=18,
        textColor=ACCENT, alignment=TA_CENTER, spaceAfter=8*mm
    )
    styles["h1"] = ParagraphStyle(
        "H1", fontName="JP", fontSize=14, leading=20,
        textColor=DARK, spaceBefore=6*mm, spaceAfter=3*mm,
        borderWidth=0, borderPadding=0,
    )
    styles["h2"] = ParagraphStyle(
        "H2", fontName="JP", fontSize=12, leading=17,
        textColor=ACCENT, spaceBefore=5*mm, spaceAfter=2*mm
    )
    styles["h3"] = ParagraphStyle(
        "H3", fontName="JP", fontSize=10.5, leading=15,
        textColor=DARK, spaceBefore=3*mm, spaceAfter=2*mm
    )
    styles["body"] = ParagraphStyle(
        "Body", fontName="JP", fontSize=9.5, leading=15,
        textColor=black, spaceAfter=2*mm, alignment=TA_JUSTIFY
    )
    styles["body_small"] = ParagraphStyle(
        "BodySmall", fontName="JP", fontSize=8.5, leading=13,
        textColor=black, spaceAfter=1.5*mm
    )
    styles["quote"] = ParagraphStyle(
        "Quote", fontName="JP", fontSize=9, leading=14,
        textColor=HexColor("#555555"), leftIndent=10*mm,
        borderLeftWidth=2, borderLeftColor=ACCENT,
        borderPadding=3, spaceAfter=3*mm, spaceBefore=2*mm
    )
    styles["warning"] = ParagraphStyle(
        "Warning", fontName="JP", fontSize=9, leading=14,
        textColor=ACCENT, alignment=TA_CENTER,
        spaceBefore=3*mm, spaceAfter=3*mm
    )
    styles["card_title"] = ParagraphStyle(
        "CardTitle", fontName="JP", fontSize=11, leading=16,
        textColor=DARK, spaceAfter=2*mm
    )
    styles["card_body"] = ParagraphStyle(
        "CardBody", fontName="JP", fontSize=9, leading=14,
        textColor=black, spaceAfter=1.5*mm
    )
    styles["card_note"] = ParagraphStyle(
        "CardNote", fontName="JP", fontSize=8, leading=12,
        textColor=HexColor("#888888"), spaceAfter=1*mm
    )
    return styles

S = get_styles()

# --- Helpers ---
def hr():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor("#cccccc"),
                       spaceBefore=3*mm, spaceAfter=3*mm)

def make_doc(filename, title_text=None):
    path = os.path.join(PDF_DIR, filename)
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=20*mm, bottomMargin=18*mm,
        title=title_text or filename
    )
    return doc, path

def read_md(rel_path):
    with open(os.path.join(BASE_DIR, rel_path), "r", encoding="utf-8") as f:
        return f.read()

def md_to_story(md_text, styles_map=None):
    """Simple markdown to reportlab story converter."""
    if styles_map is None:
        styles_map = S
    story = []
    lines = md_text.split("\n")
    i = 0
    in_table = False
    table_rows = []

    while i < len(lines):
        line = lines[i].strip()

        # Skip empty lines
        if not line:
            if in_table and table_rows:
                story.append(build_table(table_rows))
                table_rows = []
                in_table = False
            i += 1
            continue

        # Skip HTML/metadata comments
        if line.startswith(">") and ("GM専用" in line or "このシート" in line or "プレイヤーには" in line):
            story.append(Paragraph(escape(line[1:].strip()), S["warning"]))
            i += 1
            continue

        # Headers
        if line.startswith("# ") and not line.startswith("##"):
            story.append(Paragraph(escape(line[2:]), S["title"]))
            i += 1
            continue
        if line.startswith("## "):
            story.append(Paragraph(escape(line[3:]), S["h1"]))
            story.append(hr())
            i += 1
            continue
        if line.startswith("### "):
            story.append(Paragraph(escape(line[4:]), S["h2"]))
            i += 1
            continue
        if line.startswith("#### "):
            story.append(Paragraph(escape(line[5:]), S["h3"]))
            i += 1
            continue

        # Horizontal rule
        if line == "---":
            story.append(hr())
            i += 1
            continue

        # Table
        if "|" in line and not line.startswith(">"):
            cells = [c.strip() for c in line.split("|")[1:-1]]
            if cells and all(set(c) <= set("- :") for c in cells):
                # separator line, skip
                i += 1
                continue
            if cells:
                in_table = True
                table_rows.append(cells)
                i += 1
                continue

        # Flush table if we were in one
        if in_table and table_rows:
            story.append(build_table(table_rows))
            table_rows = []
            in_table = False

        # Blockquote
        if line.startswith("> "):
            quote_text = line[2:]
            # Collect multi-line quotes
            while i + 1 < len(lines) and lines[i + 1].strip().startswith("> "):
                i += 1
                quote_text += "<br/>" + lines[i].strip()[2:]
            story.append(Paragraph(escape(quote_text), S["quote"]))
            i += 1
            continue

        # Bullet list
        if line.startswith("- ") or line.startswith("* "):
            text = line[2:]
            story.append(Paragraph("  " + escape(text), S["body"]))
            i += 1
            continue

        # Checkbox list
        if line.startswith("- ["):
            text = line[6:] if line[3] == "x" else line[5:]
            mark = "[x]" if line[3] == "x" else "[ ]"
            story.append(Paragraph(f"  {mark} {escape(text)}", S["body"]))
            i += 1
            continue

        # Code block - skip
        if line.startswith("```"):
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                i += 1
            i += 1
            continue

        # Normal paragraph
        para_text = line
        while (i + 1 < len(lines) and lines[i + 1].strip()
               and not lines[i + 1].strip().startswith(("#", "|", ">", "- ", "* ", "```", "---"))):
            i += 1
            para_text += " " + lines[i].strip()
        story.append(Paragraph(escape(para_text), S["body"]))
        i += 1

    # Flush remaining table
    if in_table and table_rows:
        story.append(build_table(table_rows))

    return story

def escape(text):
    """Escape XML special chars and convert markdown bold/italic."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Bold: **text**
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Italic: *text*  (but not **)
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'<i>\1</i>', text)
    # Inline code: `text`
    text = re.sub(r'`(.+?)`', r'\1', text)
    # Stars marker
    text = text.replace("★", "[*]").replace("☆", "[ ]")
    return text

def build_table(rows):
    """Build a reportlab Table from parsed rows."""
    if not rows:
        return Spacer(1, 1)

    max_cols = max(len(r) for r in rows)
    # Pad rows
    for r in rows:
        while len(r) < max_cols:
            r.append("")

    # Convert to Paragraphs
    data = []
    for ri, row in enumerate(rows):
        data.append([Paragraph(escape(cell), S["body_small"]) for cell in row])

    col_width = (A4[0] - 36*mm) / max_cols
    col_widths = [col_width] * max_cols

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#e8e4dc")),
        ("TEXTCOLOR", (0, 0), (-1, 0), DARK),
        ("FONTNAME", (0, 0), (-1, -1), "JP"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]
    # Alternate row colors
    for ri in range(1, len(data)):
        if ri % 2 == 0:
            style_cmds.append(("BACKGROUND", (0, ri), (-1, ri), HexColor("#faf8f0")))

    t.setStyle(TableStyle(style_cmds))
    return t

# --- PDF Generators ---

def generate_rules():
    doc, path = make_doc("rules.pdf", "ルール説明書")
    md = read_md("rules/rules.md")
    story = md_to_story(md)
    doc.build(story)
    print(f"  -> {path}")

def generate_gm_guide():
    doc, path = make_doc("gm_guide.pdf", "GM進行ガイド")
    md = read_md("gm/guide.md")
    story = md_to_story(md)
    doc.build(story)
    print(f"  -> {path}")

def generate_handout(num, name, filename):
    doc, path = make_doc(f"handout_{num:02d}_{name}.pdf", f"ハンドアウト: {filename}")
    md = read_md(f"handouts/character_{num:02d}_{name}.md")
    story = md_to_story(md)
    doc.build(story)
    print(f"  -> {path}")

def generate_cards(phase, card_files, output_name):
    doc, path = make_doc(output_name, f"カード フェーズ{phase}")
    story = []

    story.append(Paragraph(f"フェーズ{phase} カード", S["title"]))
    story.append(Paragraph("切り取り線に沿ってカットしてください", S["subtitle"]))
    story.append(hr())

    for ci, card_file in enumerate(card_files):
        md = read_md(card_file)
        # Each card as a kept-together block
        card_story = md_to_story(md)
        # Add separator between cards
        card_story.append(Spacer(1, 5*mm))
        card_story.append(HRFlowable(width="100%", thickness=1, color=ACCENT,
                                      spaceBefore=2*mm, spaceAfter=5*mm, dash=[4, 4]))
        story.append(KeepTogether(card_story))

    doc.build(story)
    print(f"  -> {path}")


# --- Main ---
if __name__ == "__main__":
    print("PDF生成開始...")

    print("\n[1/4] ルール説明書")
    generate_rules()

    print("\n[2/4] GMガイド")
    generate_gm_guide()

    print("\n[3/4] ハンドアウト (6人分)")
    handouts = [
        (1, "aoi", "蒼井 美咲"),
        (2, "kuroda", "黒田 剛"),
        (3, "shiraishi", "白石 玲奈"),
        (4, "akabane", "赤羽 翔太"),
        (5, "midorikawa", "緑川 教授"),
        (6, "kanazawa", "金沢 ルミ"),
    ]
    for num, name, display in handouts:
        generate_handout(num, name, display)

    print("\n[4/4] カード")
    phase1_cards = [
        "cards/evidence/E1-01_wine_glass.md",
        "cards/evidence/E1-02_garden_plants.md",
        "cards/evidence/E1-03_cellar_log.md",
        "cards/clues/E1-04_newspaper.md",
        "cards/clues/E1-05_knife_set.md",
        "cards/clues/E1-06_secret_ingredient.md",
        "cards/clues/E1-07_akabane_phone.md",
    ]
    generate_cards(1, phase1_cards, "cards_phase1.pdf")

    phase2_cards = [
        "cards/evidence/E2-01_two_decanters.md",
        "cards/evidence/E2-02_aconitine_test.md",
        "cards/clues/E2-03_maiden_name.md",
        "cards/evidence/E2-04_glass_vial.md",
        "cards/clues/E2-05_will_draft.md",
        "cards/clues/E2-06_stolen_paper.md",
        "cards/clues/E2-07_dna_evidence.md",
        "cards/evidence/E2-08_champagne_glass.md",
        "cards/evidence/E2-09_arrival_log.md",
        "cards/clues/E2-10_memo.md",
    ]
    generate_cards(2, phase2_cards, "cards_phase2.pdf")

    print(f"\n完了! PDFは {PDF_DIR}/ に生成されました")
