"""
Integration tests — hit real Jina Reader/Search APIs.

Run:
    uv run pytest tests/integration/ -v -s

With API key:
    JINA_API_KEY=jina_xxx uv run pytest tests/integration/ -v -s
"""
from __future__ import annotations

import os
import pytest

from jina_reader_mcp import client as jina


pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def _show_api_key_status():
    key = os.environ.get("JINA_API_KEY", "")
    if key:
        print(f"\n[API KEY] set ({key[:12]}...)")
    else:
        print("\n[API KEY] not set — rate limits apply")


# ── Reader ──────────────────────────────────────────────────────────────────

async def test_real_read_url_example():
    """example.com が正常取得できること。"""
    result = await jina.read_url("https://example.com")
    assert result.ok, f"FAILED: {result.error}"
    assert result.content, "content is empty"
    print(f"\ntitle: {result.title}")
    print(f"content[:200]: {result.content[:200]}")


async def test_real_read_url_wikipedia():
    """Wikipedia 英語版トップが取得できること。"""
    result = await jina.read_url("https://en.wikipedia.org/wiki/Artificial_intelligence")
    assert result.ok, f"FAILED: {result.error}"
    assert "artificial intelligence" in result.content.lower() or result.title
    print(f"\ntitle: {result.title}")
    print(f"content[:300]: {result.content[:300]}")


async def test_real_read_url_404():
    """404 URL — Jinaは親ドメインのコンテンツを返すこともあるため ok/ng 両方許容。エラー時は not_found を期待。"""
    result = await jina.read_url("https://httpstat.us/404")
    print(f"\nok={result.ok} error={result.error}")
    if not result.ok:
        assert result.error.type in ("not_found", "http_error", "server_error")
    else:
        print(f"Jina returned content for 404 URL (acceptable): {result.content[:100]}")


async def test_real_read_url_x_twitter_public():
    """X(Twitter) の公開ポストURL — 取得成功 or エラー（ログイン壁など）どちらでも可。エラーには hint が入ること。"""
    result = await jina.read_url("https://x.com/OpenAI/status/1")
    if result.ok:
        print(f"\nX: 取得成功 title={result.title}")
        print(f"content[:200]: {result.content[:200]}")
    else:
        print(f"\nX: エラー (期待動作) error={result.error}")
        # エラー時はX/Twitterヒントが含まれるはず
        assert "X/Twitter" in result.error.message or result.error.type in (
            "forbidden", "not_found", "rate_limited", "server_error", "unknown"
        )


# ── Batch ────────────────────────────────────────────────────────────────────

async def test_real_read_urls_batch():
    """2件バッチ取得が成功すること。"""
    results = await jina.read_urls([
        "https://example.com",
        "https://httpbin.org/get",
    ])
    assert len(results) == 2
    for r in results:
        print(f"\n  url={r.url} ok={r.ok} title={r.title}")
    ok_count = sum(1 for r in results if r.ok)
    assert ok_count >= 1, "少なくとも1件は成功するはず"


async def test_real_read_urls_dedupe():
    """重複URLはdedupeで1件になること。"""
    results = await jina.read_urls(
        ["https://example.com", "https://example.com"],
        dedupe=True,
    )
    assert len(results) == 1


# ── Search ───────────────────────────────────────────────────────────────────

@pytest.mark.skipif(not os.environ.get("JINA_API_KEY"), reason="JINA_API_KEY required for Search API")
async def test_real_search_web_basic():
    """基本的なWeb検索が結果を返すこと。"""
    result = await jina.search_web("Claude AI Anthropic")
    assert result.ok, f"FAILED: {result.error}"
    print(f"\nresults count: {len(result.results)}")
    for r in result.results[:3]:
        print(f"  - [{r.title}] {r.url}")
    assert len(result.results) > 0 or result.raw_content


@pytest.mark.skipif(not os.environ.get("JINA_API_KEY"), reason="JINA_API_KEY required for Search API")
async def test_real_search_web_japanese():
    """日本語クエリで検索できること。"""
    result = await jina.search_web("グリムコネクト 感想")
    assert result.ok, f"FAILED: {result.error}"
    print(f"\nresults count: {len(result.results)}")
    for r in result.results[:3]:
        print(f"  - [{r.title}] {r.url}")


@pytest.mark.skipif(not os.environ.get("JINA_API_KEY"), reason="JINA_API_KEY required for Search API")
async def test_real_search_x_com():
    """site=x.com 絞り込み検索が動作すること。"""
    result = await jina.search_web("Claude AI", site=["x.com"])
    print(f"\nok={result.ok} results={len(result.results)}")
    if result.ok and result.results:
        for r in result.results[:3]:
            print(f"  - [{r.title}] {r.url}")
    # X側の制限で空になることもあるため ok のみ確認
    assert result.ok, f"FAILED: {result.error}"


# ── Healthcheck ──────────────────────────────────────────────────────────────

async def test_real_healthcheck():
    """ヘルスチェックが Reader に到達できること（Search はAPIキーなしでは401になる場合あり）。"""
    from jina_reader_mcp import client as jina_client
    result = await jina_client.healthcheck("https://example.com")
    print(f"\nhealthcheck: {result}")
    assert result.get("reader_accessible") is True, f"Jina Reader に到達できない: {result}"
    has_key = bool(os.environ.get("JINA_API_KEY"))
    if has_key:
        assert result.get("search_accessible") is True, f"Jina Search に到達できない: {result}"
    else:
        print("Search accessible skipped (no API key)")
