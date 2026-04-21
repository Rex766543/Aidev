"""スタイル/ジャンル一覧ルーター。

GET /api/styles — Discogs-EffNet の全ジャンル・スタイル一覧を返す
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.genre_taxonomy import get_all_styles

router = APIRouter()


class StyleEntry(BaseModel):
    genre: str   # クラス（Electronic, Rock など）
    style: str   # スタイル（House, Techno など）


class StylesResponse(BaseModel):
    items: list[StyleEntry]


@router.get("", response_model=StylesResponse)
def list_styles():
    """Discogs-EffNet の全ジャンル・スタイル一覧を返す。
    モデルが未配置の場合は空リスト。
    """
    raw = get_all_styles()
    items = [StyleEntry(genre=s["class"], style=s["style"]) for s in raw]
    return StylesResponse(items=items)
