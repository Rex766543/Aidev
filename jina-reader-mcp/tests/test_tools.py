from __future__ import annotations

import pytest
import respx
import httpx

from jina_reader_mcp.server import jina_read_url, jina_read_urls, jina_search_web


READER_RESPONSE = {
    "data": {
        "title": "Example Domain",
        "content": "# Example Domain",
        "url": "https://example.com",
    }
}


@respx.mock
@pytest.mark.asyncio
async def test_tool_jina_read_url():
    respx.get("https://r.jina.ai/https://example.com").mock(
        return_value=httpx.Response(200, json=READER_RESPONSE)
    )
    result = await jina_read_url(url="https://example.com")
    assert result["ok"] is True
    assert result["source"] == "jina_reader"
    assert result["title"] == "Example Domain"


@respx.mock
@pytest.mark.asyncio
async def test_tool_jina_read_urls():
    respx.get("https://r.jina.ai/https://example.com").mock(
        return_value=httpx.Response(200, json=READER_RESPONSE)
    )
    result = await jina_read_urls(urls=["https://example.com"])
    assert result["ok"] is True
    assert result["source"] == "jina_reader_batch"
    assert result["success_count"] == 1
    assert result["failure_count"] == 0


@respx.mock
@pytest.mark.asyncio
async def test_tool_jina_search_web():
    respx.get("https://s.jina.ai/AI%E6%9C%80%E6%96%B0%E6%83%85%E5%A0%B1").mock(
        return_value=httpx.Response(200, json={
            "data": [{"url": "https://example.com", "title": "AI News", "content": "..."}]
        })
    )
    result = await jina_search_web(query="AI最新情報")
    assert result["ok"] is True
    assert result["source"] == "jina_search"
    assert len(result["results"]) == 1


@pytest.mark.asyncio
async def test_tool_invalid_url():
    result = await jina_read_url(url="not-a-url")
    assert result["ok"] is False
    assert "http" in result["error"]["message"].lower() or result["error"]["type"] in ("http_error", "unknown")
