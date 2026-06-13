from __future__ import annotations

import asyncio
import random
from urllib.parse import quote


def encode_url_for_jina(url: str) -> str:
    """URL-encode a URL for use as a path component in Jina endpoints."""
    return url


def encode_query_for_jina(query: str) -> str:
    return quote(query, safe="")


async def exponential_backoff(attempt: int, base: float = 1.0, cap: float = 30.0) -> None:
    delay = min(base * (2 ** attempt) + random.uniform(0, 1), cap)
    await asyncio.sleep(delay)


def build_reader_headers(
    api_key: str | None,
    respond_with: str,
    engine: str,
    no_cache: bool,
    cache_tolerance: int | None,
    target_selector: str | None,
    wait_for_selector: str | None,
    remove_selector: str | None,
    with_links_summary: bool,
    with_images_summary: bool,
    timeout: int,
    token_budget: int | None,
) -> dict[str, str]:
    headers: dict[str, str] = {"Accept": "application/json"}

    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    if respond_with != "markdown":
        headers["X-Respond-With"] = respond_with
    if engine != "auto":
        headers["X-Engine"] = engine
    if no_cache:
        headers["X-No-Cache"] = "true"
    if cache_tolerance is not None:
        headers["X-Cache-Tolerance"] = str(cache_tolerance)
    if target_selector:
        headers["X-Target-Selector"] = target_selector
    if wait_for_selector:
        headers["X-Wait-For-Selector"] = wait_for_selector
    if remove_selector:
        headers["X-Remove-Selector"] = remove_selector
    if with_links_summary:
        headers["X-With-Links-Summary"] = "true"
    if with_images_summary:
        headers["X-With-Images-Summary"] = "true"
    if timeout != 30:
        headers["X-Timeout"] = str(timeout)
    if token_budget is not None:
        headers["X-Token-Budget"] = str(token_budget)

    return headers


def build_search_headers(
    api_key: str | None,
    respond_with: str,
    engine: str,
    no_cache: bool,
    timeout: int,
    token_budget: int | None,
) -> dict[str, str]:
    headers: dict[str, str] = {"Accept": "application/json"}

    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    if respond_with != "markdown":
        headers["X-Respond-With"] = respond_with
    if engine != "auto":
        headers["X-Engine"] = engine
    if no_cache:
        headers["X-No-Cache"] = "true"
    if timeout != 30:
        headers["X-Timeout"] = str(timeout)
    if token_budget is not None:
        headers["X-Token-Budget"] = str(token_budget)

    return headers
