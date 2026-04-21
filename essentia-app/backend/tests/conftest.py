"""pytest 設定。

テストは Docker 内 PostgreSQL に対して実行する（UUID/JSONB 互換のため）。
各テスト後にロールバックして副作用を消す。
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.dependencies import get_db
from app.main import app
from app.models.base import Base

# Docker Compose 内の DB に接続（テスト用スキーマを使う）
_TEST_DB_URL = settings.database_url

engine = create_engine(_TEST_DB_URL, pool_pre_ping=True)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_tables():
    """セッション開始時にテーブルを確認（migrations で作成済みのはず）。"""
    # テーブルが存在しない場合のみ作成（通常は migrations が済んでいる）
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture
def db_session():
    """各テストでロールバックするセッション。"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    """DB セッションをオーバーライドした TestClient。"""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
