from typing import Generator

from sqlalchemy.orm import Session

from app.db import SessionLocal
from app.models.anonymous_user import AnonymousUser


def get_db() -> Generator[Session, None, None]:
    """FastAPI Depends 用 DB セッション。リクエスト完了時に自動クローズ。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_or_create_anon_user(client_uid: str, db: Session) -> AnonymousUser:
    """client_uid（localStorage UUID）で AnonymousUser を取得または新規作成する。"""
    user = (
        db.query(AnonymousUser)
        .filter(AnonymousUser.client_uid == client_uid)
        .first()
    )
    if not user:
        user = AnonymousUser(client_uid=client_uid)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
