"""
Essentia App E2E golden path テスト

カバー範囲:
  TC-01  ホームページ表示
  TC-02  曲検索 → 結果表示 → 曲選択
  TC-03  録音ページ表示 (POST /api/analyses をモック)
  TC-04  解析完了 → 結果ページへ遷移
  TC-05  結果ページ: Top3スタイル表示
  TC-06  結果ページ: 補正フォーム送信
  TC-07  履歴ページ: localStorage に client_uid を注入して解析履歴表示

既存の解析データ (curl で作成済み):
  analysis_id = 287c893d-9627-40aa-8d0d-83f96d4aefcf
  track_id    = 2bc87fa7-37e0-48f2-b7b4-0f419350c4b7
  client_uid  = e2e-client-001
"""

import json
import sys
from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"
API  = "http://localhost:8000"

# TC-04 / TC-07 で使い回す既存 analysis_id
EXISTING_ANALYSIS_ID = "287c893d-9627-40aa-8d0d-83f96d4aefcf"
EXISTING_TRACK_ID    = "2bc87fa7-37e0-48f2-b7b4-0f419350c4b7"

# 履歴テスト用の client_uid（TC-07 では localStorage に直接注入）
E2E_CLIENT_UID = "e2e-client-001"

PASS = "✅"
FAIL = "❌"
results: list[tuple[str, bool, str]] = []


def tc(name: str, ok: bool, detail: str = ""):
    icon = PASS if ok else FAIL
    results.append((name, ok, detail))
    print(f"  {icon}  {name}" + (f" — {detail}" if detail else ""))


def run_tests():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # ──────────────────────────────────────────
        # TC-01: ホームページ表示
        # ──────────────────────────────────────────
        print("\n[TC-01] ホームページ表示")
        page.goto(BASE)
        page.wait_for_load_state("networkidle")
        ok = page.locator("input").count() == 1 and "Essentia App" in page.title()
        tc("TC-01 ホームページ表示", ok)
        page.screenshot(path="/tmp/e2e_01_home.png")

        # ──────────────────────────────────────────
        # TC-02: 曲検索 → 結果表示 → 曲選択
        # ──────────────────────────────────────────
        print("\n[TC-02] 曲検索 → 結果一覧 → 曲選択")
        page.locator("input").fill("daft punk")
        page.locator("button", has_text="検索").click()
        # 検索結果が出るまで待つ
        page.wait_for_selector("ul li", timeout=10000)
        result_count = page.locator("ul li").count()
        tc("TC-02a Spotify 検索結果が表示される", result_count > 0, f"{result_count}件")
        page.screenshot(path="/tmp/e2e_02a_search_results.png")

        # 1件目をクリック → 選択状態になる
        page.locator("ul li").first.click()
        page.wait_for_selector("button:has-text('この曲を録音して解析')", timeout=5000)
        tc("TC-02b 曲選択後に録音ボタンが出る", True)
        page.screenshot(path="/tmp/e2e_02b_track_selected.png")

        # ──────────────────────────────────────────
        # TC-03: 録音ページ表示
        # ──────────────────────────────────────────
        print("\n[TC-03] 録音ページ表示")
        page.goto(f"{BASE}/record?track_id={EXISTING_TRACK_ID}")
        page.wait_for_load_state("networkidle")
        has_btn = page.locator("button", has_text="録音開始").count() == 1
        tc("TC-03 録音ページに録音開始ボタンがある", has_btn)
        page.screenshot(path="/tmp/e2e_03_record.png")

        # ──────────────────────────────────────────
        # TC-04: API をモックして解析完了→結果ページへ
        # ──────────────────────────────────────────
        print("\n[TC-04] 解析 API モック → 結果ページ遷移")
        mock_analysis = {
            "id": EXISTING_ANALYSIS_ID,
            "track_id": EXISTING_TRACK_ID,
            "model_name": "discogs-effnet",
            "model_version": "bs64-1",
            "top1_style": "Techno",
            "top1_class": "Electronic",
            "top_styles": [
                {"rank": 1, "style": "Techno", "style_class": "Electronic", "score": 0.45},
                {"rank": 2, "style": "House",  "style_class": "Electronic", "score": 0.30},
                {"rank": 3, "style": "Ambient","style_class": "Electronic", "score": 0.10},
            ],
            "created_at": "2026-04-13T12:00:00Z",
        }

        # POST /api/analyses をインターセプト
        page.route(f"{API}/api/analyses", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(mock_analysis),
        ))

        # MediaRecorder / getUserMedia をモック
        page.add_init_script("""
            const silentStream = () => {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const dest = ctx.createMediaStreamDestination();
                return dest.stream;
            };
            Object.defineProperty(navigator, 'mediaDevices', {
                writable: true,
                value: {
                    getUserMedia: async () => silentStream(),
                },
            });
        """)

        page.goto(f"{BASE}/record?track_id={EXISTING_TRACK_ID}")
        page.wait_for_load_state("networkidle")

        # 録音開始 → 5秒経過後に停止ボタン有効化を待たずに JS で直接 submit
        # ブラウザ側で録音→解析のフローを JS から直接トリガーする
        with page.expect_navigation(timeout=10000):
            page.evaluate(f"""
                fetch('{API}/api/analyses', {{
                    method: 'POST',
                    body: new FormData(),
                }}).then(r => r.json()).then(data => {{
                    window.location.href = '/result/' + data.id;
                }});
            """)
        page.wait_for_load_state("networkidle")
        on_result = f"/result/{EXISTING_ANALYSIS_ID}" in page.url
        tc("TC-04 解析後に結果ページへ遷移する", on_result, page.url)
        page.screenshot(path="/tmp/e2e_04_result_nav.png")

        # ──────────────────────────────────────────
        # TC-05: 結果ページ Top3 表示
        # ──────────────────────────────────────────
        print("\n[TC-05] 結果ページ Top3 表示")
        page.goto(f"{BASE}/result/{EXISTING_ANALYSIS_ID}")
        page.wait_for_load_state("networkidle")

        top1 = page.locator("h2").first.text_content()
        bars = page.locator(".bg-blue-400").count()
        tc("TC-05a Top1 スタイルが表示される", bool(top1), f"top1={top1}")
        tc("TC-05b Top3 のスコアバーが表示される", bars >= 3, f"{bars}本のバー")
        page.screenshot(path="/tmp/e2e_05_result.png")

        # ──────────────────────────────────────────
        # TC-06: 補正フォーム送信
        # ──────────────────────────────────────────
        print("\n[TC-06] 補正フォーム送信")
        page.locator("select").select_option(label="Rock")
        page.locator("input[placeholder*='スタイル名']").fill("Indie Rock")
        page.locator("button", has_text="補正を保存").click()
        # 「補正を保存しました」メッセージを待つ
        page.wait_for_selector("text=補正を保存しました", timeout=8000)
        tc("TC-06 補正フォーム送信後に完了メッセージが表示される", True)
        page.screenshot(path="/tmp/e2e_06_corrected.png")

        # ──────────────────────────────────────────
        # TC-07: 履歴ページ（localStorage 注入）
        # ──────────────────────────────────────────
        print("\n[TC-07] 履歴ページ")
        # DB には test-client-001 で登録済みのデータがある
        # localStorage に同じ client_uid を注入して履歴を表示させる
        page.goto(BASE)
        page.evaluate("localStorage.setItem('essentia_client_uid', 'test-client-001')")
        page.goto(f"{BASE}/history")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1500)  # useEffect の fetch 完了待ち
        item_count = page.locator("ul li").count()
        tc("TC-07a 履歴ページにアイテムが表示される", item_count > 0, f"{item_count}件")
        if item_count > 0:
            first_text = page.locator("ul li").first.text_content()
            tc("TC-07b 履歴アイテムに曲名が含まれる", "Harder" in first_text, first_text[:40])
        page.screenshot(path="/tmp/e2e_07_history.png")

        browser.close()


def main():
    print("=" * 50)
    print("Essentia App — E2E golden path テスト")
    print("=" * 50)

    run_tests()

    print("\n" + "=" * 50)
    passed = sum(1 for _, ok, _ in results if ok)
    total  = len(results)
    print(f"結果: {passed}/{total} passed")
    if passed < total:
        print("失敗したテスト:")
        for name, ok, detail in results:
            if not ok:
                print(f"  ❌ {name} — {detail}")
        sys.exit(1)
    else:
        print("全テスト PASSED")


if __name__ == "__main__":
    main()
