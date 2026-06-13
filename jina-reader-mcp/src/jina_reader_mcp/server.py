from __future__ import annotations

from pydantic import ValidationError
from fastmcp import FastMCP

from . import client as jina
from .schemas import (
    ErrorDetail,
    HealthcheckInput,
    HealthcheckResult,
    ReadUrlInput,
    ReadUrlResult,
    ReadUrlsBatchResult,
    ReadUrlsInput,
    SearchWebInput,
    SearchWebResult,
)

mcp = FastMCP("jina-reader-mcp")


@mcp.tool()
async def jina_read_url(
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
) -> dict:
    """Fetch a single URL via Jina Reader and return structured content (markdown/text/html)."""
    try:
        inp = ReadUrlInput(
            url=url,
            respond_with=respond_with,  # type: ignore[arg-type]
            engine=engine,  # type: ignore[arg-type]
            no_cache=no_cache,
            cache_tolerance=cache_tolerance,
            target_selector=target_selector,
            wait_for_selector=wait_for_selector,
            remove_selector=remove_selector,
            with_links_summary=with_links_summary,
            with_images_summary=with_images_summary,
            timeout=timeout,
            token_budget=token_budget,
        )
    except ValidationError as exc:
        return ReadUrlResult(
            ok=False, url=url,
            error=ErrorDetail(type="unsupported", message=str(exc)),
        ).model_dump()

    result = await jina.read_url(
        url=inp.url,
        respond_with=inp.respond_with,
        engine=inp.engine,
        no_cache=inp.no_cache,
        cache_tolerance=inp.cache_tolerance,
        target_selector=inp.target_selector,
        wait_for_selector=inp.wait_for_selector,
        remove_selector=inp.remove_selector,
        with_links_summary=inp.with_links_summary,
        with_images_summary=inp.with_images_summary,
        timeout=inp.timeout,
        token_budget=inp.token_budget,
    )
    return result.model_dump()


@mcp.tool()
async def jina_read_urls(
    urls: list[str],
    respond_with: str = "markdown",
    engine: str = "auto",
    no_cache: bool = False,
    dedupe: bool = True,
    concurrency: int = 2,
    timeout: int = 30,
    token_budget_per_url: int | None = None,
) -> dict:
    """Fetch multiple URLs in parallel via Jina Reader. Returns per-URL results."""
    inp = ReadUrlsInput(
        urls=urls,
        respond_with=respond_with,  # type: ignore[arg-type]
        engine=engine,  # type: ignore[arg-type]
        no_cache=no_cache,
        dedupe=dedupe,
        concurrency=concurrency,
        timeout=timeout,
        token_budget_per_url=token_budget_per_url,
    )
    results = await jina.read_urls(
        urls=inp.urls,
        respond_with=inp.respond_with,
        engine=inp.engine,
        no_cache=inp.no_cache,
        dedupe=inp.dedupe,
        concurrency=inp.concurrency,
        timeout=inp.timeout,
        token_budget_per_url=inp.token_budget_per_url,
    )
    success = sum(1 for r in results if r.ok)
    batch = ReadUrlsBatchResult(
        ok=True,
        count=len(results),
        success_count=success,
        failure_count=len(results) - success,
        results=results,
    )
    return batch.model_dump()


@mcp.tool()
async def jina_search_web(
    query: str,
    site: list[str] | None = None,
    respond_with: str = "markdown",
    engine: str = "auto",
    no_cache: bool = False,
    timeout: int = 30,
    token_budget: int | None = None,
) -> dict:
    """Search the web via Jina Search and return page content for each result."""
    inp = SearchWebInput(
        query=query,
        site=site,
        respond_with=respond_with,  # type: ignore[arg-type]
        engine=engine,  # type: ignore[arg-type]
        no_cache=no_cache,
        timeout=timeout,
        token_budget=token_budget,
    )
    result = await jina.search_web(
        query=inp.query,
        site=inp.site,
        respond_with=inp.respond_with,
        engine=inp.engine,
        no_cache=inp.no_cache,
        timeout=inp.timeout,
        token_budget=inp.token_budget,
    )
    return result.model_dump()


@mcp.tool()
async def jina_healthcheck(test_url: str = "https://example.com") -> dict:
    """Check Jina Reader/Search API reachability and API key presence."""
    inp = HealthcheckInput(test_url=test_url)
    return await jina.healthcheck(inp.test_url)


def main() -> None:
    mcp.run()


if __name__ == "__main__":
    main()
