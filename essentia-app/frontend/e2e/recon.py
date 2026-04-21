"""偵察スクリプト: 各ページのDOM・スクリーンショットを確認する"""
from playwright.sync_api import sync_playwright

ANALYSIS_ID = "287c893d-9627-40aa-8d0d-83f96d4aefcf"
TRACK_ID = "2bc87fa7-37e0-48f2-b7b4-0f419350c4b7"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Homepage
    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/e2e_home.png", full_page=True)
    print("=== HOME ===")
    print(page.title())
    print(page.locator("input").count(), "inputs")
    print(page.locator("button").all_text_contents())

    # 2. Result page
    page.goto(f"http://localhost:3000/result/{ANALYSIS_ID}")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/e2e_result.png", full_page=True)
    print("\n=== RESULT ===")
    print(page.locator("h2").all_text_contents())
    print(page.locator("select").count(), "selects")
    print(page.locator("button").all_text_contents())

    # 3. Record page
    page.goto(f"http://localhost:3000/record?track_id={TRACK_ID}")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/e2e_record.png", full_page=True)
    print("\n=== RECORD ===")
    print(page.locator("h1").all_text_contents())
    print(page.locator("button").all_text_contents())

    # 4. History page
    page.goto("http://localhost:3000/history")
    page.wait_for_load_state("networkidle")
    page.screenshot(path="/tmp/e2e_history.png", full_page=True)
    print("\n=== HISTORY ===")
    print(page.locator("h1").all_text_contents())
    print(page.locator("li").count(), "items")

    browser.close()
    print("\nDone. Screenshots saved to /tmp/e2e_*.png")
