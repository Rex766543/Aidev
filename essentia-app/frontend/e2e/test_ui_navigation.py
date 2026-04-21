"""
E2E UI / Navigation tests for Essentia App
Run: python3 test_ui_navigation.py
"""

import time
import sys
from playwright.sync_api import sync_playwright, Page

BASE_URL = "http://localhost:3000"
ANALYSIS_ID = "287c893d-9627-40aa-8d0d-83f96d4aefcf"
TRACK_ID = "2bc87fa7-37e0-48f2-b7b4-0f419350c4b7"

RESULTS: list[tuple[str, str, str]] = []  # (run, tc, PASS/FAIL:reason)

GOTO_TIMEOUT = 30000
WAIT_TIMEOUT = 15000


def record(run: int, tc: str, passed: bool, reason: str = ""):
    status = "PASS" if passed else f"FAIL: {reason}"
    RESULTS.append((f"Run{run}", tc, status))
    mark = "v" if passed else "x"
    print(f"  [{mark}] {tc}: {status}")


def safe_screenshot(page: Page, path: str):
    try:
        page.screenshot(path=path, timeout=10000)
    except Exception as e:
        print(f"    (screenshot failed: {e})")


# ---------------------------------------------------------------------------
# TC-U01: 各ページに直接URLでアクセスできる
# ---------------------------------------------------------------------------
def tc_u01(page: Page, run: int):
    tc = "TC-U01"
    pages_spec = [
        ("/", "Essentia App"),
        (f"/record?track_id={TRACK_ID}", "録音"),
        (f"/result/{ANALYSIS_ID}", "解析"),
        ("/history", "履歴"),
    ]
    all_ok = True
    fail_reason = ""
    for path, keyword in pages_spec:
        url = BASE_URL + path
        try:
            resp = page.goto(url, wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
            status_code = resp.status if resp else 0
            if status_code not in (200, 0):
                all_ok = False
                fail_reason = f"{path} status={status_code}"
                break
            content = page.content()
            title = page.title()
            if keyword not in content and keyword not in title:
                all_ok = False
                fail_reason = f"{path}: キーワード'{keyword}'未検出"
                break
        except Exception as e:
            all_ok = False
            fail_reason = f"{path} exception: {e}"
            break
    safe_screenshot(page, f"/tmp/ui_u01_run{run}.png")
    record(run, tc, all_ok, fail_reason)


# ---------------------------------------------------------------------------
# TC-U02: ヘッダのナビゲーションリンク
# ---------------------------------------------------------------------------
def tc_u02(page: Page, run: int):
    tc = "TC-U02"
    try:
        test_pages = [
            f"/result/{ANALYSIS_ID}",
            "/history",
            f"/record?track_id={TRACK_ID}",
        ]
        for path in test_pages:
            # ロゴクリック → /
            page.goto(BASE_URL + path, wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
            page.click("a:has-text('Essentia App')")
            page.wait_for_url(f"{BASE_URL}/", timeout=WAIT_TIMEOUT)
            cur = page.url.rstrip("/")
            assert cur == BASE_URL or cur == BASE_URL + "/", \
                f"Logo click from {path} landed on {page.url}"

            # 検索リンク → /
            page.goto(BASE_URL + path, wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
            page.click("nav a:has-text('検索')")
            page.wait_for_url(f"{BASE_URL}/", timeout=WAIT_TIMEOUT)
            cur = page.url.rstrip("/")
            assert cur == BASE_URL or cur == BASE_URL + "/", \
                f"検索 link from {path} landed on {page.url}"

        safe_screenshot(page, f"/tmp/ui_u02_run{run}.png")
        record(run, tc, True)
    except Exception as e:
        safe_screenshot(page, f"/tmp/ui_u02_run{run}.png")
        record(run, tc, False, str(e))


# ---------------------------------------------------------------------------
# TC-U03: 結果ページから履歴・トップへの遷移
# ---------------------------------------------------------------------------
def tc_u03(page: Page, run: int):
    tc = "TC-U03"
    try:
        # トップへ戻る
        page.goto(f"{BASE_URL}/result/{ANALYSIS_ID}", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
        page.click("a:has-text('トップへ戻る')")
        page.wait_for_url(f"{BASE_URL}/", timeout=WAIT_TIMEOUT)
        cur = page.url.rstrip("/")
        assert cur == BASE_URL, f"トップへ戻る landed on {page.url}"

        # 履歴を見る
        page.goto(f"{BASE_URL}/result/{ANALYSIS_ID}", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
        page.click("a:has-text('履歴を見る')")
        page.wait_for_url(f"{BASE_URL}/history", timeout=WAIT_TIMEOUT)
        assert "/history" in page.url, f"履歴を見る landed on {page.url}"

        safe_screenshot(page, f"/tmp/ui_u03_run{run}.png")
        record(run, tc, True)
    except Exception as e:
        safe_screenshot(page, f"/tmp/ui_u03_run{run}.png")
        record(run, tc, False, str(e))


# ---------------------------------------------------------------------------
# TC-U04: モバイルビューポート（375×812）
# ---------------------------------------------------------------------------
def tc_u04(page: Page, run: int):
    tc = "TC-U04"
    try:
        page.set_viewport_size({"width": 375, "height": 812})
        issues = []

        # 各ページで横スクロール確認
        check_pages = [
            ("/", "top"),
            (f"/result/{ANALYSIS_ID}", "result"),
            ("/history", "history"),
        ]
        for path, label in check_pages:
            page.goto(BASE_URL + path, wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
            scroll_width = page.evaluate("document.documentElement.scrollWidth")
            client_width = page.evaluate("document.documentElement.clientWidth")
            if scroll_width > client_width + 2:
                issues.append(
                    f"{label}: scrollWidth={scroll_width} > clientWidth={client_width} (横スクロール発生)"
                )
            safe_screenshot(page, f"/tmp/ui_u04_{label}_run{run}.png")

        # 検索ページ: input と検索ボタンが使える
        page.goto(BASE_URL + "/", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
        inp = page.locator("input[type='text']")
        btn = page.locator("button:has-text('検索')")
        if not inp.is_visible():
            issues.append("検索input が不可視 (mobile)")
        if not btn.is_visible():
            issues.append("検索button が不可視 (mobile)")

        # 結果ページ: スコアバーが存在（縦並び確認）
        page.goto(f"{BASE_URL}/result/{ANALYSIS_ID}", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
        # Use JS to query bars with inline style containing width%
        bar_count = page.evaluate(
            "document.querySelectorAll('[style*=\"width:\"]').length"
        )
        if bar_count < 1:
            issues.append(f"結果ページ(mobile)でスコアバーが見つからない (bar_count={bar_count})")

        safe_screenshot(page, f"/tmp/ui_u04_result_run{run}.png")

        page.set_viewport_size({"width": 1280, "height": 720})
        record(run, tc, len(issues) == 0, "; ".join(issues))
    except Exception as e:
        page.set_viewport_size({"width": 1280, "height": 720})
        safe_screenshot(page, f"/tmp/ui_u04_err_run{run}.png")
        record(run, tc, False, str(e))


# ---------------------------------------------------------------------------
# TC-U05: タブレットビューポート（768×1024）
# ---------------------------------------------------------------------------
def tc_u05(page: Page, run: int):
    tc = "TC-U05"
    try:
        page.set_viewport_size({"width": 768, "height": 1024})
        issues = []

        check_pages = [
            ("/", "top"),
            (f"/result/{ANALYSIS_ID}", "result"),
            ("/history", "history"),
        ]
        for path, label in check_pages:
            page.goto(BASE_URL + path, wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
            scroll_width = page.evaluate("document.documentElement.scrollWidth")
            client_width = page.evaluate("document.documentElement.clientWidth")
            if scroll_width > client_width + 2:
                issues.append(
                    f"{label}: scrollWidth={scroll_width} > clientWidth={client_width} (横スクロール発生)"
                )
            safe_screenshot(page, f"/tmp/ui_u05_{label}_run{run}.png")

        page.set_viewport_size({"width": 1280, "height": 720})
        record(run, tc, len(issues) == 0, "; ".join(issues))
    except Exception as e:
        page.set_viewport_size({"width": 1280, "height": 720})
        record(run, tc, False, str(e))


# ---------------------------------------------------------------------------
# TC-U06: ローディング状態の確認
# ---------------------------------------------------------------------------
def tc_u06(page: Page, run: int):
    tc = "TC-U06"
    try:
        issues = []

        # 検索ボタン disabled チェック
        page.goto(BASE_URL + "/", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
        inp = page.locator("input[type='text']")
        inp.fill("test query loading check")
        btn = page.locator("button:has-text('検索')")
        btn.click()

        # クリック直後に disabled になるかチェック (100ms 以内, 20回 x 5ms)
        found_disabled = False
        for _ in range(40):
            time.sleep(0.025)
            disabled = page.evaluate(
                "Array.from(document.querySelectorAll('button')).some("
                "  b => b.disabled && (b.textContent.includes('検索') || b.textContent.trim() === '検索')"
                ")"
            )
            if disabled:
                found_disabled = True
                break
        if not found_disabled:
            issues.append("検索ボタンが一時的に disabled にならない（またはローディング表示なし）")

        # CorrectionPicker: 「保存中...」テキスト
        page.goto(f"{BASE_URL}/result/{ANALYSIS_ID}", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
        page.select_option("select", index=1)
        page.locator("input[placeholder*='スタイル名']").fill("TestStyle")
        save_btn = page.locator("button:has-text('補正を保存')")
        save_btn.click()

        found_saving = False
        for _ in range(40):
            time.sleep(0.025)
            content = page.content()
            if "保存中" in content:
                found_saving = True
                break
        if not found_saving:
            issues.append("補正保存ボタンクリック後に「保存中...」テキストが現れない")

        safe_screenshot(page, f"/tmp/ui_u06_run{run}.png")
        record(run, tc, len(issues) == 0, "; ".join(issues))
    except Exception as e:
        safe_screenshot(page, f"/tmp/ui_u06_run{run}.png")
        record(run, tc, False, str(e))


# ---------------------------------------------------------------------------
# TC-U07: ページタイトル確認
# ---------------------------------------------------------------------------
def tc_u07(page: Page, run: int):
    tc = "TC-U07"
    try:
        issues = []

        page.goto(BASE_URL + "/", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
        title_top = page.title()
        if "Essentia App" not in title_top:
            issues.append(f"/ title='{title_top}' に 'Essentia App' が含まれない")

        page.goto(f"{BASE_URL}/result/{ANALYSIS_ID}", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
        title_result = page.title()
        if "Essentia App" not in title_result:
            issues.append(f"/result title='{title_result}' に 'Essentia App' が含まれない")

        safe_screenshot(page, f"/tmp/ui_u07_run{run}.png")
        record(run, tc, len(issues) == 0, "; ".join(issues))
    except Exception as e:
        safe_screenshot(page, f"/tmp/ui_u07_run{run}.png")
        record(run, tc, False, str(e))


# ---------------------------------------------------------------------------
# TC-U08: キーボード操作（Enter キー）
# ---------------------------------------------------------------------------
def tc_u08(page: Page, run: int):
    tc = "TC-U08"
    try:
        page.goto(BASE_URL + "/", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)
        inp = page.locator("input[type='text']")
        inp.click()
        inp.fill("Beatles")
        inp.press("Enter")

        # 検索結果が現れるまで待つ（最大 12 秒）
        page.wait_for_selector("ul li", timeout=12000)
        items = page.locator("ul li").count()
        if items < 1:
            raise AssertionError(f"Enter キー後の検索結果が 0 件 (items={items})")

        safe_screenshot(page, f"/tmp/ui_u08_run{run}.png")
        record(run, tc, True)
    except Exception as e:
        safe_screenshot(page, f"/tmp/ui_u08_run{run}.png")
        record(run, tc, False, str(e))


# ---------------------------------------------------------------------------
# TC-U09: スコアバーの視覚的整合性
# ---------------------------------------------------------------------------
def tc_u09(page: Page, run: int):
    tc = "TC-U09"
    try:
        page.goto(f"{BASE_URL}/result/{ANALYSIS_ID}", wait_until="domcontentloaded", timeout=GOTO_TIMEOUT)

        # インラインスタイルで width% を持つ要素を取得
        bar_widths = page.evaluate("""
            () => {
                const allEls = document.querySelectorAll('[style]');
                const widths = [];
                for (const el of allEls) {
                    const m = el.getAttribute('style').match(/width:\\s*([\\d.]+)%/);
                    if (m) widths.push(parseFloat(m[1]));
                }
                return widths;
            }
        """)

        issues = []
        valid = [w for w in bar_widths if w is not None and w > 0]

        if len(valid) < 3:
            issues.append(f"width% を持つバー要素が3本未満 (found={len(valid)}, raw={bar_widths})")
        else:
            # スコアバーは降順であることを確認 (#1 が最大)
            if valid[0] < valid[1] or valid[0] < valid[2]:
                issues.append(f"#1バーが最大でない: {valid}")

            # スコアテキストとバー幅の照合
            # text-gray-500 text-xs はスコアパーセント表示に使われる
            score_texts = page.evaluate("""
                () => {
                    const els = document.querySelectorAll('.text-gray-500.text-xs');
                    return Array.from(els).map(e => e.textContent.trim());
                }
            """)
            for i, txt in enumerate(score_texts[:3]):
                txt_clean = txt.replace("%", "").strip()
                try:
                    expected = float(txt_clean)
                    actual = valid[i]
                    if abs(expected - actual) > 1.5:
                        issues.append(
                            f"#{i+1} スコア表示={txt}% vs バー幅={actual:.1f}% (差>{1.5}%)"
                        )
                except ValueError:
                    pass

        safe_screenshot(page, f"/tmp/ui_u09_run{run}.png")
        record(run, tc, len(issues) == 0, "; ".join(issues))
    except Exception as e:
        safe_screenshot(page, f"/tmp/ui_u09_run{run}.png")
        record(run, tc, False, str(e))


# ---------------------------------------------------------------------------
# TC-U10: キャンセルボタンの動作
# ---------------------------------------------------------------------------
def tc_u10(page: Page, run: int):
    tc = "TC-U10"
    try:
        page.goto(
            f"{BASE_URL}/record?track_id={TRACK_ID}",
            wait_until="domcontentloaded",
            timeout=GOTO_TIMEOUT,
        )
        cancel_btn = page.locator("button:has-text('キャンセル')")
        cancel_btn.click()
        page.wait_for_url(f"{BASE_URL}/", timeout=WAIT_TIMEOUT)
        cur = page.url.rstrip("/")
        assert cur == BASE_URL, f"キャンセル後 {page.url} に遷移"

        safe_screenshot(page, f"/tmp/ui_u10_run{run}.png")
        record(run, tc, True)
    except Exception as e:
        safe_screenshot(page, f"/tmp/ui_u10_run{run}.png")
        record(run, tc, False, str(e))


# ---------------------------------------------------------------------------
# Main runner
# ---------------------------------------------------------------------------
def run_all(run: int):
    print(f"\n{'='*60}")
    print(f"  Run {run}")
    print(f"{'='*60}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context()
        page = ctx.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        tc_u01(page, run)
        tc_u02(page, run)
        tc_u03(page, run)
        tc_u04(page, run)
        tc_u05(page, run)
        tc_u06(page, run)
        tc_u07(page, run)
        tc_u08(page, run)
        tc_u09(page, run)
        tc_u10(page, run)

        ctx.close()
        browser.close()


if __name__ == "__main__":
    for run_num in [1, 2]:
        run_all(run_num)

    print(f"\n{'='*60}")
    print("  FINAL RESULTS")
    print(f"{'='*60}")

    pass_count = 0
    fail_count = 0
    failures = []

    from collections import defaultdict
    tc_runs: dict[str, list[str]] = defaultdict(list)
    for run_label, tc, status in RESULTS:
        tc_runs[tc].append(status)

    for tc in sorted(tc_runs.keys()):
        statuses = tc_runs[tc]
        all_pass = all(s == "PASS" for s in statuses)
        if all_pass:
            pass_count += 1
            print(f"  PASS  {tc}")
        else:
            fail_count += 1
            fail_detail = [s for s in statuses if s != "PASS"]
            print(f"  FAIL  {tc}  ({'; '.join(fail_detail)})")
            failures.append((tc, fail_detail))

    total = pass_count + fail_count
    print(f"\n  合計: {pass_count}/{total} PASS, {fail_count}/{total} FAIL")

    if failures:
        print("\n  失敗した TC:")
        for tc, reasons in failures:
            print(f"    {tc}: {reasons}")

    sys.exit(0 if fail_count == 0 else 1)
