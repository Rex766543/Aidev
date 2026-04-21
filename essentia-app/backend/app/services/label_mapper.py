"""Discogs ラベル文字列のパーサ。

Discogs-EffNet の出力ラベルは "ClassName---StyleName" 形式。
例: "Electronic---House", "Rock---Indie Rock"
"""

CLASS_SEPARATOR = "---"


def parse_label(label: str) -> dict[str, str]:
    """'Electronic---House' → {'class': 'Electronic', 'style': 'House'}"""
    if CLASS_SEPARATOR in label:
        cls, style = label.split(CLASS_SEPARATOR, 1)
        return {"class": cls.strip(), "style": style.strip()}
    # セパレータなし → class と style を同一にする
    return {"class": label.strip(), "style": label.strip()}
