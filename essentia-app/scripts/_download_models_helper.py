#!/usr/bin/env python3
"""download_models.sh から呼ばれるヘルパー。model_manifest.json を読んでモデルを DL する。

curl コマンドがあれば curl を使う（macOS の SSL 証明書問題を回避）。
curl がなければ urllib にフォールバックする。
"""
import json
import os
import shutil
import subprocess
import sys


def _download_with_curl(url: str, dest: str) -> None:
    subprocess.run(
        ["curl", "-L", "--progress-bar", "-o", dest, url],
        check=True,
    )


def _download_with_urllib(url: str, dest: str) -> None:
    import ssl
    import urllib.request

    ctx = ssl.create_default_context()
    try:
        import certifi  # type: ignore[import]
        ctx = ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        # certifi なし → 証明書検証をスキップ（DL 専用の緩和策）
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

    def _progress(count: int, block_size: int, total_size: int) -> None:
        if total_size > 0:
            pct = min(100, count * block_size * 100 // total_size)
            print(f"\r    Progress: {pct}%", end="", flush=True)

    opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx))
    with opener.open(url) as resp, open(dest, "wb") as f:
        total = int(resp.headers.get("Content-Length", 0))
        downloaded = 0
        block = 8192
        while chunk := resp.read(block):
            f.write(chunk)
            downloaded += len(chunk)
            if total:
                pct = min(100, downloaded * 100 // total)
                print(f"\r    Progress: {pct}%", end="", flush=True)
    print()


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: _download_models_helper.py <manifest_path> <models_dir>")
        sys.exit(1)

    manifest_path = sys.argv[1]
    models_dir = sys.argv[2]

    use_curl = shutil.which("curl") is not None

    with open(manifest_path) as f:
        manifest = json.load(f)

    active = manifest["active_model"]
    model = manifest["models"][active]
    print(f"Active model: {active} ({model['description']})")
    print(f"Using: {'curl' if use_curl else 'urllib'}")

    for step in model["pipeline"]:
        for key in ("pb", "json"):
            url = step[f"download_url_{key}"]
            filename = step[f"file_{key}"]
            dest = os.path.join(models_dir, filename)

            if os.path.exists(dest):
                size_mb = os.path.getsize(dest) / 1024 / 1024
                print(f"  SKIP (already exists, {size_mb:.1f}MB): {filename}")
                continue

            print(f"  Downloading: {filename}")
            print(f"    URL: {url}")

            if use_curl:
                _download_with_curl(url, dest)
            else:
                _download_with_urllib(url, dest)

            size_mb = os.path.getsize(dest) / 1024 / 1024
            print(f"  OK ({size_mb:.1f}MB): {filename}")

    print("\nAll model files ready.")


if __name__ == "__main__":
    main()
