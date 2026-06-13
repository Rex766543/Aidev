from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


RespondWith = Literal["markdown", "text", "html", "frontmatter", "markdown+frontmatter"]
Engine = Literal["auto", "browser", "curl"]
ErrorType = Literal[
    "http_error", "timeout", "rate_limited", "auth_error", "forbidden",
    "not_found", "parse_error", "unsupported", "unknown"
]


# ---------- input schemas ----------

class ReadUrlInput(BaseModel):
    url: str
    respond_with: RespondWith = "markdown"
    engine: Engine = "auto"
    no_cache: bool = False
    cache_tolerance: int | None = None
    target_selector: str | None = None
    wait_for_selector: str | None = None
    remove_selector: str | None = None
    with_links_summary: bool = False
    with_images_summary: bool = False
    timeout: int = Field(default=30, ge=1, le=120)
    token_budget: int | None = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class ReadUrlsInput(BaseModel):
    urls: list[str] = Field(min_length=1, max_length=50)
    respond_with: RespondWith = "markdown"
    engine: Engine = "auto"
    no_cache: bool = False
    dedupe: bool = True
    concurrency: int = Field(default=2, ge=1, le=5)
    timeout: int = Field(default=30, ge=1, le=120)
    token_budget_per_url: int | None = None

    @field_validator("urls")
    @classmethod
    def validate_urls(cls, v: list[str]) -> list[str]:
        for url in v:
            if not url.startswith(("http://", "https://")):
                raise ValueError(f"URL must start with http:// or https://: {url}")
        return v


class SearchWebInput(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    site: list[str] | None = None
    respond_with: RespondWith = "markdown"
    engine: Engine = "auto"
    no_cache: bool = False
    timeout: int = Field(default=30, ge=1, le=120)
    token_budget: int | None = None


class HealthcheckInput(BaseModel):
    test_url: str = "https://example.com"

    @field_validator("test_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


# ---------- output schemas ----------

class ErrorDetail(BaseModel):
    type: ErrorType
    message: str
    status_code: int | None = None


class ReadUrlResult(BaseModel):
    ok: bool
    source: str = "jina_reader"
    url: str
    title: str | None = None
    content: str | None = None
    content_type: str | None = None
    fetched_at: str = Field(default_factory=_now_iso)
    metadata: dict[str, Any] = Field(default_factory=dict)
    error: ErrorDetail | None = None


class ReadUrlsBatchResult(BaseModel):
    ok: bool
    source: str = "jina_reader_batch"
    count: int
    success_count: int
    failure_count: int
    results: list[ReadUrlResult]


class SearchResult(BaseModel):
    url: str
    title: str | None = None
    content: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class SearchWebResult(BaseModel):
    ok: bool
    source: str = "jina_search"
    query: str
    site: list[str] | None = None
    results: list[SearchResult] = Field(default_factory=list)
    raw_content: str | None = None
    error: ErrorDetail | None = None


class HealthcheckResult(BaseModel):
    ok: bool
    has_api_key: bool
    reader_accessible: bool
    search_accessible: bool
    message: str
