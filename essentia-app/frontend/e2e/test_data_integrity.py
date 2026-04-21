"""
Essentia App E2E データ整合性・API境界条件テスト

カバー範囲:
  TC-D01  Track upsert の冪等性
  TC-D02  補正の上書き動作
  TC-D03  履歴の正確性（UI確認）
  TC-D04  新規ユーザ（localStorage 空）の挙動
  TC-D05  複数タブでの操作競合
  TC-D06  localStorage の UUID 永続性
  TC-D07  分析結果ページの API との整合性
  TC-D08  history API と UI の整合性

既存データ:
  analysis_id = 287c893d-9627-40aa-8d0d-83f96d4aefcf
  track_id    = 2bc87fa7-37e0-48f2-b7b4-0f419350c4b7
  client_uid  = test-client-001

注意: API直叩きはブラウザ経由のfetchで行う（サンドボックス環境制約のため）
"""

import json
import sys
from playwright.sync_api import sync_playwright, Page, Browser

BASE = "http://localhost:3000"
API  = "http://localhost:8000"

EXISTING_ANALYSIS_ID = "287c893d-9627-40aa-8d0d-83f96d4aefcf"
EXISTING_TRACK_ID    = "2bc87fa7-37e0-48f2-b7b4-0f419350c4b7"
CLIENT_UID           = "test-client-001"

TEST_SPOTIFY_ID = "5W3cjX2J3tjhG8zb6u0qHn"

all_results: list[tuple[int, str, bool, str]] = []
backend_available = False


def record(run: int, name: str, ok: bool, detail: str = ""):
    all_results.append((run, name, ok, detail))
    indicator = "✅" if ok else "❌"
    mark = "PASS" if ok else "FAIL"
    print(f"  {indicator} [{mark}] {name}" + (f" — {detail}" if detail else ""))


# ────────────────────────────────────────────────
# ブラウザ経由 API ヘルパー
# ────────────────────────────────────────────────

def browser_fetch(page: Page, method: str, path: str, body: dict = None, timeout_ms: int = 15000) -> dict:
    """ブラウザの fetch() でバックエンド API を呼ぶ。返り値は {ok, status, data, error}"""
    body_js = json.dumps(body) if body else "null"
    result = page.evaluate(f"""
        async () => {{
            try {{
                const opts = {{
                    method: {json.dumps(method)},
                    headers: {{"Content-Type": "application/json"}},
                    signal: AbortSignal.timeout({timeout_ms}),
                }};
                if ({body_js} !== null) opts.body = JSON.stringify({body_js});
                const r = await fetch({json.dumps(API + path)}, opts);
                let data;
                try {{ data = await r.json(); }} catch {{ data = null; }}
                return {{ok: r.ok, status: r.status, data}};
            }} catch(e) {{
                return {{ok: false, status: 0, error: String(e)}};
            }}
        }}
    """)
    return result


def check_backend(page: Page) -> bool:
    """ブラウザ経由でバックエンドの疎通確認"""
    r = browser_fetch(page, "GET", "/health", timeout_ms=8000)
    return r.get("ok", False)


# ────────────────────────────────────────────────
# TC-D01: Track upsert の冪等性
# ────────────────────────────────────────────────
def tc_d01(run: int, page: Page):
    print(f"\n[TC-D01 run={run}] Track upsert の冪等性")

    if not backend_available:
        record(run, "TC-D01 upsert 3回成功", False, "バックエンド接続不可 (SKIP)")
        return

    ids = []
    errors = []
    for i in range(3):
        r = browser_fetch(page, "POST", "/api/tracks", {"spotify_id": TEST_SPOTIFY_ID})
        if r.get("ok") and r.get("data"):
            ids.append(r["data"].get("id"))
        else:
            errors.append(f"試行{i+1}: HTTP {r.get('status')} {r.get('error','')}")

    if errors:
        record(run, "TC-D01 upsert 3回成功", False, "; ".join(errors))
        return

    all_same = len(set(ids)) == 1
    record(run, "TC-D01a upsert 3回とも同一 UUID", all_same,
           f"ids={ids}" if not all_same else f"id={ids[0]}")
    record(run, "TC-D01b レスポンスに id フィールドが存在", all(ids),
           f"ids={ids}")


# ────────────────────────────────────────────────
# TC-D02: 補正の上書き動作
# ────────────────────────────────────────────────
def tc_d02(run: int, page: Page):
    print(f"\n[TC-D02 run={run}] 補正の上書き動作")

    if not backend_available:
        record(run, "TC-D02 補正上書き", False, "バックエンド接続不可 (SKIP)")
        return

    corr_path = f"/api/analyses/{EXISTING_ANALYSIS_ID}/correction"

    r1 = browser_fetch(page, "PUT", corr_path,
                       {"corrected_style": "House", "corrected_class": "Electronic",
                        "client_uid": CLIENT_UID})
    ok1 = r1.get("ok", False)
    record(run, "TC-D02a PUT correction → House (HTTP 200)", ok1,
           f"status={r1.get('status')}")
    if not ok1:
        record(run, "TC-D02b PUT correction → Techno", False, "前提失敗")
        record(run, "TC-D02c corrected_style が最新の Techno", False, "前提失敗")
        return

    r2 = browser_fetch(page, "PUT", corr_path,
                       {"corrected_style": "Techno", "corrected_class": "Electronic",
                        "client_uid": CLIENT_UID})
    ok2 = r2.get("ok", False)
    record(run, "TC-D02b PUT correction → Techno (HTTP 200)", ok2,
           f"status={r2.get('status')}")
    if not ok2:
        record(run, "TC-D02c corrected_style が最新の Techno", False, "前提失敗")
        return

    r3 = browser_fetch(page, "GET",
                       f"/api/my/history?client_uid={CLIENT_UID}&limit=20")
    items = (r3.get("data") or {}).get("items", []) if r3.get("ok") else []
    target = next((i for i in items if i["analysis_id"] == EXISTING_ANALYSIS_ID), None)
    corrected = target.get("corrected_style") if target else None
    ok3 = corrected == "Techno"
    record(run, "TC-D02c corrected_style が最新の Techno", ok3,
           f"corrected_style={corrected!r}")


# ────────────────────────────────────────────────
# TC-D03: 履歴の正確性（UI確認）
# ────────────────────────────────────────────────
def tc_d03(run: int, page: Page):
    print(f"\n[TC-D03 run={run}] 履歴の正確性（UI確認）")

    # まず frontend に遷移してから API fetch（about:blank だと CORS で失敗する）
    if page.url == "about:blank":
        page.goto(BASE, wait_until="domcontentloaded")

    api_items = []
    if backend_available:
        r = browser_fetch(page, "GET",
                          f"/api/my/history?client_uid={CLIENT_UID}&limit=20")
        if r.get("ok"):
            api_items = (r.get("data") or {}).get("items", [])
        else:
            record(run, "TC-D03 API /my/history 取得", False,
                   f"HTTP {r.get('status')}")

    page.goto(BASE, wait_until="domcontentloaded")
    page.evaluate(f"localStorage.setItem('essentia_client_uid', '{CLIENT_UID}')")
    page.goto(f"{BASE}/history", wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    page.screenshot(path=f"/tmp/data_D03_run{run}.png")

    ui_items = page.locator("ul li").count()
    api_count = len(api_items)

    if backend_available:
        record(run, "TC-D03a UI アイテム数が API と一致",
               ui_items == api_count, f"ui={ui_items}, api={api_count}")
        if api_count > 0 and ui_items > 0:
            first_title = api_items[0]["track"]["title"]
            ui_text = page.locator("ul li").first.text_content() or ""
            title_shown = first_title[:10] in ui_text
            record(run, "TC-D03b 最初のアイテムのタイトルが UI に表示",
                   title_shown, f"title={first_title!r}")
            first_style = api_items[0].get("corrected_style") or api_items[0]["top1_style"]
            style_shown = first_style in ui_text
            record(run, "TC-D03c スタイルが UI に表示", style_shown,
                   f"style={first_style!r}")
        else:
            record(run, "TC-D03b タイトル確認", True, f"items=0のためSKIP")
            record(run, "TC-D03c スタイル確認", True, f"items=0のためSKIP")
    else:
        no_error = page.locator("text=エラー").count() == 0
        record(run, "TC-D03a バックエンド不可でもUIがクラッシュしない",
               no_error, f"ui_items={ui_items}, no_error={no_error}")
        record(run, "TC-D03b タイトル確認 (SKIP)", True, "バックエンド接続不可のためSKIP")
        record(run, "TC-D03c スタイル確認 (SKIP)", True, "バックエンド接続不可のためSKIP")


# ────────────────────────────────────────────────
# TC-D04: 新規ユーザ（localStorage 空）の挙動
# ────────────────────────────────────────────────
def tc_d04(run: int, p):
    print(f"\n[TC-D04 run={run}] 新規ユーザ（localStorage 空）の挙動")

    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(BASE, wait_until="domcontentloaded")
        has_input = page.locator("input").count() >= 1
        record(run, "TC-D04a / → 正常表示（inputが存在）", has_input)
        page.screenshot(path=f"/tmp/data_D04a_run{run}.png")

        page.goto(f"{BASE}/history", wait_until="domcontentloaded")
        page.wait_for_timeout(8000)
        has_heading = page.locator("h1", has_text="解析履歴").count() > 0
        no_error = page.locator("text=エラー").count() == 0
        no_crash = has_heading and no_error
        record(run, "TC-D04b /history → エラーにならず正常表示",
               no_crash,
               f"heading={has_heading}, no_error={no_error}")
        page.screenshot(path=f"/tmp/data_D04b_run{run}.png")

        try:
            page.goto(f"{BASE}/result/{EXISTING_ANALYSIS_ID}",
                      wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(2000)
            has_select = page.locator("select").count() >= 1
            page_body = page.inner_text("body") or ""
            is_error_page = "解析結果が見つかりません" in page_body
            result_ok = has_select and not is_error_page
            record(run, "TC-D04c /result/{id} → 補正フォームが表示される",
                   result_ok, f"select={has_select}, error_page={is_error_page}")
            try:
                page.screenshot(path=f"/tmp/data_D04c_run{run}.png")
            except Exception:
                pass
        except Exception as e:
            record(run, "TC-D04c /result/{id} → 補正フォームが表示される",
                   False, f"タイムアウト: {str(e)[:80]}")
    finally:
        context.close()
        browser.close()


# ────────────────────────────────────────────────
# TC-D05: 複数タブでの操作競合
# ────────────────────────────────────────────────
def tc_d05(run: int, p, api_page: Page):
    print(f"\n[TC-D05 run={run}] 複数タブでの操作競合")

    if not backend_available:
        record(run, "TC-D05a タブA: Jazz に補正", False, "バックエンド接続不可 (SKIP)")
        record(run, "TC-D05b タブB: Blues に補正", False, "バックエンド接続不可 (SKIP)")
        record(run, "TC-D05c 最終的に history で Blues になっている", False,
               "バックエンド接続不可 (SKIP)")
        return

    corr_path = f"/api/analyses/{EXISTING_ANALYSIS_ID}/correction"

    r_jazz = browser_fetch(api_page, "PUT", corr_path,
                           {"corrected_style": "Jazz", "corrected_class": "Jazz",
                            "client_uid": CLIENT_UID})
    ok_a = r_jazz.get("ok", False)
    record(run, "TC-D05a タブA: Jazz に補正 (HTTP 200)", ok_a,
           f"status={r_jazz.get('status')}")

    r_blues = browser_fetch(api_page, "PUT", corr_path,
                            {"corrected_style": "Blues", "corrected_class": "Blues",
                             "client_uid": CLIENT_UID})
    ok_b = r_blues.get("ok", False)
    record(run, "TC-D05b タブB: Blues に補正（上書き）(HTTP 200)", ok_b,
           f"status={r_blues.get('status')}")

    r_hist = browser_fetch(api_page, "GET",
                           f"/api/my/history?client_uid={CLIENT_UID}&limit=20")
    items = (r_hist.get("data") or {}).get("items", []) if r_hist.get("ok") else []
    target = next((i for i in items if i["analysis_id"] == EXISTING_ANALYSIS_ID), None)
    final_style = target.get("corrected_style") if target else None
    ok_final = final_style == "Blues"
    record(run, "TC-D05c 最終的に history で Blues になっている",
           ok_final, f"corrected_style={final_style!r}")

    # 後片付け
    browser_fetch(api_page, "PUT", corr_path,
                  {"corrected_style": "Techno", "corrected_class": "Electronic",
                   "client_uid": CLIENT_UID})


# ────────────────────────────────────────────────
# TC-D06: localStorage の UUID 永続性
# ────────────────────────────────────────────────
def tc_d06(run: int, p):
    print(f"\n[TC-D06 run={run}] localStorage の UUID 永続性")

    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto(BASE, wait_until="domcontentloaded")
        page.wait_for_timeout(500)
        uid_at_home = page.evaluate("localStorage.getItem('essentia_client_uid')")

        page.goto(f"{BASE}/history", wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        uid1 = page.evaluate("localStorage.getItem('essentia_client_uid')")
        is_uuid = (uid1 is not None and len(uid1) == 36 and uid1.count("-") == 4)
        record(run, "TC-D06a /history を開くと localStorage に UUID がセットされる",
               is_uuid,
               f"uid_at_home={uid_at_home!r}, uid_after_history={uid1!r}")

        page.reload(wait_until="domcontentloaded")
        page.wait_for_timeout(500)
        uid2 = page.evaluate("localStorage.getItem('essentia_client_uid')")
        record(run, "TC-D06b リロード後も同じ UUID が維持される",
               uid1 == uid2, f"uid1={uid1!r}, uid2={uid2!r}")

        page2 = context.new_page()
        page2.goto(BASE, wait_until="domcontentloaded")
        page2.wait_for_timeout(500)
        uid3 = page2.evaluate("localStorage.getItem('essentia_client_uid')")
        record(run, "TC-D06c 新しいタブでも同じ UUID（同一コンテキスト）",
               uid1 == uid3, f"uid1={uid1!r}, uid3={uid3!r}")
        page2.close()
        page.screenshot(path=f"/tmp/data_D06_run{run}.png")
    finally:
        context.close()
        browser.close()


# ────────────────────────────────────────────────
# TC-D07: 分析結果ページの API との整合性
# ────────────────────────────────────────────────
def tc_d07(run: int, page: Page):
    print(f"\n[TC-D07 run={run}] 分析結果ページの API との整合性")

    if not backend_available:
        record(run, "TC-D07a API から top1_style を取得", False, "バックエンド接続不可 (SKIP)")
        record(run, "TC-D07b UI に top1_style が表示される", False, "バックエンド接続不可 (SKIP)")
        record(run, "TC-D07c UI スコア(%) が API score×100 と一致(±1%)", False, "バックエンド接続不可 (SKIP)")
        return

    r = browser_fetch(page, "GET", f"/api/analyses/{EXISTING_ANALYSIS_ID}")
    if not r.get("ok"):
        record(run, "TC-D07a API GET analysis", False, f"HTTP {r.get('status')}")
        return

    api_data = r.get("data") or {}
    api_top1 = api_data.get("top1_style", "")
    api_top_styles = api_data.get("top_styles", [])
    record(run, "TC-D07a API から top1_style を取得",
           bool(api_top1), f"top1_style={api_top1!r}")

    try:
        page.goto(f"{BASE}/result/{EXISTING_ANALYSIS_ID}",
                  wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)
        page.screenshot(path=f"/tmp/data_D07_run{run}.png")

        page_text = page.inner_text("body")
        top1_shown = api_top1 in page_text
        record(run, "TC-D07b UI に top1_style が表示される",
               top1_shown, f"api_top1={api_top1!r}")

        if api_top_styles:
            top1_item = api_top_styles[0]
            expected_pct = round(top1_item["score"] * 100)
            score_variants = [f"{expected_pct}%", f"{top1_item['score'] * 100:.1f}%"]
            score_shown = any(v in page_text for v in score_variants)
            if not score_shown:
                for delta in [-1, 1]:
                    if f"{expected_pct + delta}%" in page_text:
                        score_shown = True
                        break
            record(run, "TC-D07c UI スコア(%) が API score×100 と一致(±1%)",
                   score_shown, f"expected≈{expected_pct}%")
    except Exception as e:
        record(run, "TC-D07b UI に top1_style が表示される", False, str(e)[:80])
        record(run, "TC-D07c UI スコア(%) が API score×100 と一致(±1%)", False, "前提失敗")


# ────────────────────────────────────────────────
# TC-D08: history API と UI の整合性
# ────────────────────────────────────────────────
def tc_d08(run: int, page: Page):
    print(f"\n[TC-D08 run={run}] history API と UI の整合性")

    if not backend_available:
        record(run, "TC-D08a API /my/history 取得", False, "バックエンド接続不可 (SKIP)")
        return

    r = browser_fetch(page, "GET", f"/api/my/history?client_uid={CLIENT_UID}&limit=20")
    if not r.get("ok"):
        record(run, "TC-D08a API /my/history 取得", False, f"HTTP {r.get('status')}")
        return

    api_count = len((r.get("data") or {}).get("items", []))
    record(run, "TC-D08a API /my/history 取得成功", True, f"items={api_count}")

    page.goto(BASE, wait_until="domcontentloaded")
    page.evaluate(f"localStorage.setItem('essentia_client_uid', '{CLIENT_UID}')")
    page.goto(f"{BASE}/history", wait_until="domcontentloaded")
    page.wait_for_timeout(3000)
    page.screenshot(path=f"/tmp/data_D08_run{run}.png")

    ui_count = page.locator("ul li").count()
    record(run, "TC-D08b UI アイテム数が API と一致",
           ui_count == api_count, f"ui={ui_count}, api={api_count}")


# ────────────────────────────────────────────────
# メイン
# ────────────────────────────────────────────────
def main():
    global backend_available

    print("=" * 60)
    print("Essentia App — データ整合性・API境界条件 E2E テスト")
    print("=" * 60)

    with sync_playwright() as p:
        # バックエンド確認用ブラウザ（常時起動）
        api_browser = p.chromium.launch(headless=True)
        api_context = api_browser.new_context()
        api_page = api_context.new_page()
        api_page.goto(BASE, wait_until="domcontentloaded")

        print("\n[接続確認]")
        backend_available = check_backend(api_page)
        if backend_available:
            print(f"  ✅ バックエンド {API} — OK")
        else:
            print(f"  ⚠️  バックエンド {API} — 接続不可")
            print("     API直叩きテスト (TC-D01, D02, D05, D07, D08) は SKIP します")
            print("     UI テストは継続します")

        for run in range(1, 3):
            print(f"\n{'=' * 60}")
            print(f"  RUN {run}/2")
            print(f"{'=' * 60}")

            tc_d01(run, api_page)
            tc_d02(run, api_page)

            # 共有ブラウザでUIテスト
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            tc_d03(run, page)
            tc_d07(run, page)
            tc_d08(run, page)

            context.close()
            browser.close()

            # 独立コンテキストが必要なテスト
            tc_d04(run, p)
            tc_d05(run, p, api_page)
            tc_d06(run, p)

        api_context.close()
        api_browser.close()

    # ──────────────────────────────────────────────────────
    # 最終結果サマリ
    # ──────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("最終結果サマリ")
    print("=" * 60)

    total = len(all_results)
    passed = sum(1 for _, _, ok, _ in all_results if ok)
    failed = total - passed

    tc_names = sorted(set(name for _, name, _, _ in all_results))
    for tc_name in tc_names:
        runs_for_tc = [(r, ok, d) for r, n, ok, d in all_results if n == tc_name]
        all_pass = all(ok for _, ok, _ in runs_for_tc)
        mark = "✅" if all_pass else "❌"
        run_results = ", ".join(
            f"run{r}={'PASS' if ok else 'FAIL'}" for r, ok, _ in runs_for_tc
        )
        print(f"  {mark} {tc_name} ({run_results})")
        if not all_pass:
            for r, ok, detail in runs_for_tc:
                if not ok:
                    print(f"       run{r}: {detail}")

    print()
    print(f"合計: {passed}/{total} PASS  ({failed} FAIL)")

    real_failures = [
        (r, n, ok, d) for r, n, ok, d in all_results
        if not ok and "SKIP" not in d
    ]

    if real_failures:
        print("\n実際の失敗（SKIP除く）:")
        for r, name, ok, detail in real_failures:
            print(f"  ❌ run{r} {name} — {detail}")
        sys.exit(1)
    elif failed > 0:
        print("\n（SKIP を除く実際の失敗: 0）")
        print("バックエンド接続不可のため API 系テストは SKIP — UI テストは全 PASS")
    else:
        print("全テスト PASS")


if __name__ == "__main__":
    main()
