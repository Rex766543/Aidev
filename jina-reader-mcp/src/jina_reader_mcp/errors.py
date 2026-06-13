from __future__ import annotations

import httpx

from .schemas import ErrorDetail


def classify_http_error(exc: httpx.HTTPStatusError, url: str = "") -> ErrorDetail:
    status = exc.response.status_code
    text = exc.response.text[:200]

    if status == 429:
        return ErrorDetail(type="rate_limited", message=f"Rate limited by Jina API. {text}", status_code=status)
    if status == 401:
        return ErrorDetail(type="auth_error", message="Invalid or missing API key.", status_code=status)
    if status == 403:
        x_msg = ""
        if "x.com" in url or "twitter.com" in url:
            x_msg = " X/Twitter URL may require login or be restricted."
        return ErrorDetail(
            type="forbidden",
            message=f"Access forbidden.{x_msg} {text}",
            status_code=status,
        )
    if status == 404:
        return ErrorDetail(type="not_found", message=f"URL not found: {url}", status_code=status)

    return ErrorDetail(type="http_error", message=f"HTTP {status}: {text}", status_code=status)


def classify_request_error(exc: httpx.RequestError) -> ErrorDetail:
    if isinstance(exc, httpx.TimeoutException):
        return ErrorDetail(type="timeout", message=f"Request timed out: {exc}")
    return ErrorDetail(type="unknown", message=f"Request error: {exc}")


def x_twitter_hint(url: str) -> str:
    if "x.com" in url or "twitter.com" in url:
        return " (X/Twitter URLs may fail if the content requires login or is restricted by X.)"
    return ""
