from __future__ import annotations

import asyncio
import os
from typing import Any

import httpx

from .errors import classify_http_error, classify_request_error, x_twitter_hint
from .schemas import ErrorDetail, ReadUrlResult, SearchResult, SearchWebResult
from .utils import (
    build_reader_headers,
    build_search_headers,
    encode_query_for_jina,
    exponential_backoff,
)

READER_BASE = "https://r.jina.ai"
SEARCH_BASE = "https://s.jina.ai"
MAX_RETRIES = 3


def _get_api_key() -> str | None:
    return os.environ.get("JINA_API_KEY") or None


def _parse_reader_response(data: Any, url: str, content_type: str) -> tuple[str | None, str | None]:
    """Extract title and content from Jina Reader JSON response."""
    if isinstance(data, dict):
        d = data.get("data", data)
        title = d.get("title") or data.get("title")
        content = d.get("content") or d.get("text") or data.get("content") or data.get("text")
        return title, content
    return None, str(data) if data else None


def _parse_search_response(data: Any) -> list[SearchResult]:
    """Extract results from Jina Search JSON response."""
    results: list[SearchResult] = []

    if isinstance(data, dict):
        items = data.get("data") or data.get("results") or []
    elif isinstance(data, list):
        items = data
    else:
        return results

    for item in items:
        if not isinstance(item, dict):
            continue
        results.append(SearchResult(
            url=item.get("url", ""),
            title=item.get("title"),
            content=item.get("content") or item.get("text"),
            metadata={k: v for k, v in item.items() if k not in ("url", "title", "content", "text")},
        ))
    return results


async def read_url(
    url: str,
    respond_with: str = "markdown",
    engine: str = "auto",
    no_cache: bool = False,
    cache_tolerance: int | None = None,
    target_selector: str | None = None,
    wait_for_selector: str | None = None,
    remove_selector: str | None = None,
    with_links_summary: bool = False,
    with_images_summary: bool = False,
    timeout: int = 30,
    token_budget: int | None = None,
) -> ReadUrlResult:
    api_key = _get_api_key()
    headers = build_reader_headers(
        api_key, respond_with, engine, no_cache, cache_tolerance,
        target_selector, wait_for_selector, remove_selector,
        with_links_summary, with_images_summary, timeout, token_budget,
    )

    jina_url = f"{READER_BASE}/{url}"

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=timeout + 5) as client:
                resp = await client.get(jina_url, headers=headers)

            if resp.status_code == 429:
                if attempt < MAX_RETRIES - 1:
                    retry_after = resp.headers.get("Retry-After")
                    if retry_after:
                        await asyncio.sleep(float(retry_after))
                    else:
                        await exponential_backoff(attempt)
                    continue
                return ReadUrlResult(
                    ok=False, url=url,
                    error=ErrorDetail(type="rate_limited", message="Rate limited after retries.", status_code=429),
                    metadata={"engine": engine, "no_cache": no_cache},
                )

            resp.raise_for_status()

            try:
                data = resp.json()
                title, content = _parse_reader_response(data, url, respond_with)
            except Exception:
                content = resp.text
                title = None

            return ReadUrlResult(
                ok=True, url=url,
                title=title,
                content=content,
                content_type=respond_with,
                metadata={"engine": engine, "no_cache": no_cache},
            )

        except httpx.HTTPStatusError as exc:
            err = classify_http_error(exc, url)
            hint = x_twitter_hint(url)
            if hint:
                err = ErrorDetail(type=err.type, message=err.message + hint, status_code=err.status_code)
            return ReadUrlResult(ok=False, url=url, error=err, metadata={"engine": engine, "no_cache": no_cache})

        except httpx.RequestError as exc:
            err = classify_request_error(exc)
            if attempt < MAX_RETRIES - 1 and err.type == "timeout":
                await exponential_backoff(attempt)
                continue
            return ReadUrlResult(ok=False, url=url, error=err, metadata={"engine": engine, "no_cache": no_cache})

    return ReadUrlResult(
        ok=False, url=url,
        error=ErrorDetail(type="unknown", message="Max retries exceeded."),
        metadata={"engine": engine, "no_cache": no_cache},
    )


async def read_urls(
    urls: list[str],
    respond_with: str = "markdown",
    engine: str = "auto",
    no_cache: bool = False,
    dedupe: bool = True,
    concurrency: int = 2,
    timeout: int = 30,
    token_budget_per_url: int | None = None,
) -> list[ReadUrlResult]:
    if dedupe:
        seen: set[str] = set()
        deduped: list[str] = []
        for u in urls:
            if u not in seen:
                seen.add(u)
                deduped.append(u)
        urls = deduped

    semaphore = asyncio.Semaphore(concurrency)

    async def fetch(url: str) -> ReadUrlResult:
        async with semaphore:
            return await read_url(
                url=url,
                respond_with=respond_with,
                engine=engine,
                no_cache=no_cache,
                timeout=timeout,
                token_budget=token_budget_per_url,
            )

    return await asyncio.gather(*[fetch(u) for u in urls])


async def search_web(
    query: str,
    site: list[str] | None = None,
    respond_with: str = "markdown",
    engine: str = "auto",
    no_cache: bool = False,
    timeout: int = 30,
    token_budget: int | None = None,
) -> SearchWebResult:
    api_key = _get_api_key()
    headers = build_search_headers(api_key, respond_with, engine, no_cache, timeout, token_budget)

    encoded_query = encode_query_for_jina(query)
    params: dict[str, str] = {}
    if site:
        params["site"] = ",".join(site)

    jina_url = f"{SEARCH_BASE}/{encoded_query}"

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=timeout + 5) as client:
                resp = await client.get(jina_url, headers=headers, params=params)

            if resp.status_code == 429:
                if attempt < MAX_RETRIES - 1:
                    retry_after = resp.headers.get("Retry-After")
                    if retry_after:
                        await asyncio.sleep(float(retry_after))
                    else:
                        await exponential_backoff(attempt)
                    continue
                return SearchWebResult(
                    ok=False, query=query, site=site,
                    error=ErrorDetail(type="rate_limited", message="Rate limited after retries.", status_code=429),
                )

            resp.raise_for_status()

            raw_text = resp.text
            try:
                data = resp.json()
                results = _parse_search_response(data)
                return SearchWebResult(ok=True, query=query, site=site, results=results)
            except Exception:
                return SearchWebResult(ok=True, query=query, site=site, raw_content=raw_text)

        except httpx.HTTPStatusError as exc:
            err = classify_http_error(exc, jina_url)
            return SearchWebResult(ok=False, query=query, site=site, error=err)

        except httpx.RequestError as exc:
            err = classify_request_error(exc)
            if attempt < MAX_RETRIES - 1 and err.type == "timeout":
                await exponential_backoff(attempt)
                continue
            return SearchWebResult(ok=False, query=query, site=site, error=err)

    return SearchWebResult(
        ok=False, query=query, site=site,
        error=ErrorDetail(type="unknown", message="Max retries exceeded."),
    )


async def healthcheck(test_url: str = "https://example.com") -> dict:
    api_key = _get_api_key()
    has_api_key = api_key is not None

    reader_ok = False
    search_ok = False

    result = await read_url(url=test_url, timeout=15)
    reader_ok = result.ok

    search_result = await search_web(query="test", timeout=15)
    search_ok = search_result.ok

    all_ok = reader_ok and search_ok
    parts = []
    if not reader_ok:
        parts.append("Reader unreachable")
    if not search_ok:
        parts.append("Search unreachable")
    message = "Jina Reader/Search are reachable." if all_ok else "; ".join(parts) + "."

    return {
        "ok": all_ok,
        "has_api_key": has_api_key,
        "reader_accessible": reader_ok,
        "search_accessible": search_ok,
        "message": message,
    }
