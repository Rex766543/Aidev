from __future__ import annotations

import json
import pytest
import respx
import httpx

from jina_reader_mcp import client as jina


READER_RESPONSE = {
    "data": {
        "title": "Example Domain",
        "content": "# Example Domain\n\nThis domain is for use in examples.",
        "url": "https://example.com",
    }
}

SEARCH_RESPONSE = {
    "data": [
        {
            "url": "https://example.com/result1",
            "title": "Result 1",
            "content": "Some content here.",
        },
        {
            "url": "https://example.com/result2",
            "title": "Result 2",
            "content": "More content.",
        },
    ]
}


@respx.mock
@pytest.mark.asyncio
async def test_read_url_success():
    respx.get("https://r.jina.ai/https://example.com").mock(
        return_value=httpx.Response(200, json=READER_RESPONSE)
    )
    result = await jina.read_url("https://example.com")
    assert result.ok is True
    assert result.title == "Example Domain"
    assert "Example Domain" in result.content


@respx.mock
@pytest.mark.asyncio
async def test_read_url_404():
    respx.get("https://r.jina.ai/https://example.com/missing").mock(
        return_value=httpx.Response(404, text="Not found")
    )
    result = await jina.read_url("https://example.com/missing")
    assert result.ok is False
    assert result.error.type == "not_found"
    assert result.error.status_code == 404


@respx.mock
@pytest.mark.asyncio
async def test_read_url_rate_limited_then_fail():
    respx.get("https://r.jina.ai/https://example.com").mock(
        return_value=httpx.Response(429, text="Too Many Requests")
    )
    result = await jina.read_url("https://example.com", timeout=5)
    assert result.ok is False
    assert result.error.type == "rate_limited"


@respx.mock
@pytest.mark.asyncio
async def test_read_url_x_twitter_hint():
    respx.get("https://r.jina.ai/https://x.com/user/status/123").mock(
        return_value=httpx.Response(403, text="Forbidden")
    )
    result = await jina.read_url("https://x.com/user/status/123")
    assert result.ok is False
    assert result.error.type == "forbidden"
    assert "X/Twitter" in result.error.message


@respx.mock
@pytest.mark.asyncio
async def test_read_urls_batch():
    respx.get("https://r.jina.ai/https://example.com").mock(
        return_value=httpx.Response(200, json=READER_RESPONSE)
    )
    respx.get("https://r.jina.ai/https://www.wikipedia.org/").mock(
        return_value=httpx.Response(200, json={
            "data": {"title": "Wikipedia", "content": "The Free Encyclopedia"}
        })
    )
    results = await jina.read_urls(["https://example.com", "https://www.wikipedia.org/"])
    assert len(results) == 2
    assert all(r.ok for r in results)


@respx.mock
@pytest.mark.asyncio
async def test_read_urls_dedupe():
    respx.get("https://r.jina.ai/https://example.com").mock(
        return_value=httpx.Response(200, json=READER_RESPONSE)
    )
    results = await jina.read_urls(
        ["https://example.com", "https://example.com", "https://example.com"],
        dedupe=True,
    )
    assert len(results) == 1


@respx.mock
@pytest.mark.asyncio
async def test_read_urls_partial_failure():
    respx.get("https://r.jina.ai/https://example.com").mock(
        return_value=httpx.Response(200, json=READER_RESPONSE)
    )
    respx.get("https://r.jina.ai/https://bad.example.com/").mock(
        return_value=httpx.Response(404, text="Not found")
    )
    results = await jina.read_urls(["https://example.com", "https://bad.example.com/"])
    ok_results = [r for r in results if r.ok]
    fail_results = [r for r in results if not r.ok]
    assert len(ok_results) == 1
    assert len(fail_results) == 1


@respx.mock
@pytest.mark.asyncio
async def test_search_web_success():
    respx.get("https://s.jina.ai/%E3%82%B0%E3%83%AA%E3%83%A0%E3%82%B3%E3%83%8D%E3%82%AF%E3%83%88%20%E6%84%9F%E6%83%B3").mock(
        return_value=httpx.Response(200, json=SEARCH_RESPONSE)
    )
    result = await jina.search_web("グリムコネクト 感想")
    assert result.ok is True
    assert len(result.results) == 2
    assert result.results[0].url == "https://example.com/result1"


@respx.mock
@pytest.mark.asyncio
async def test_search_web_with_site():
    respx.get("https://s.jina.ai/test%20query").mock(
        return_value=httpx.Response(200, json=SEARCH_RESPONSE)
    )
    result = await jina.search_web("test query", site=["x.com"])
    assert result.ok is True


@respx.mock
@pytest.mark.asyncio
async def test_search_web_parse_error_returns_raw():
    respx.get("https://s.jina.ai/test").mock(
        return_value=httpx.Response(200, text="not json at all")
    )
    result = await jina.search_web("test")
    assert result.ok is True
    assert result.raw_content == "not json at all"
    assert result.results == []
