#!/usr/bin/env python3
"""
Test script to verify udder health data is displayed correctly in the Health tab
"""

from playwright.sync_api import sync_playwright
import time

def test_udder_health():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Navigate to an animal card page (using animal ID from seed data)
            # Cow 1001 (a0000001-0000-0000-0000-000000000001) has SCC and CMT tests
            animal_id = 'a0000001-0000-0000-0000-000000000001'
            url = f'http://localhost:3003/animals/{animal_id}'

            print(f"Navigating to: {url}")
            page.goto(url)
            page.wait_for_load_state('networkidle')

            # Take screenshot of initial page
            page.screenshot(path='/tmp/animal_card_initial.png', full_page=True)
            print("Screenshot saved: /tmp/animal_card_initial.png")

            # Click on Health tab
            health_tab = page.locator('button:has-text("Health")')
            if health_tab.count() > 0:
                print("Clicking Health tab...")
                health_tab.click()
                page.wait_for_timeout(1000)

                # Click on Udder sub-tab
                udder_tab = page.locator('button:has-text("Udder")')
                if udder_tab.count() > 0:
                    print("Clicking Udder tab...")
                    udder_tab.click()
                    page.wait_for_timeout(1000)

                    # Take screenshot of udder tab
                    page.screenshot(path='/tmp/udder_health_tab.png', full_page=True)
                    print("Screenshot saved: /tmp/udder_health_tab.png")

                    # Check if SCC data is displayed
                    scc_text = page.locator('text=/SCC by Quarter/i')
                    if scc_text.count() > 0:
                        print("✅ SCC by Quarter section found")
                    else:
                        print("❌ SCC by Quarter section NOT found")

                    # Check if Latest Results table exists
                    latest_results = page.locator('text=/Latest Results/i')
                    if latest_results.count() > 0:
                        print("✅ Latest Results section found")

                        # Check for quarter labels
                        quarters = ['LF', 'LR', 'RF', 'RR']
                        for q in quarters:
                            if page.locator(f'text="{q}"').count() > 0:
                                print(f"✅ Quarter {q} found in table")
                    else:
                        print("❌ Latest Results section NOT found")

                    # Check if no data message appears (should NOT appear for cow 1001)
                    no_data = page.locator('text=/No udder test data available/i')
                    if no_data.count() > 0:
                        print("⚠️  'No data' message displayed (unexpected for cow 1001)")
                    else:
                        print("✅ Real data is being displayed (no 'no data' message)")

                else:
                    print("❌ Udder tab not found")
            else:
                print("❌ Health tab not found")

            print("\n=== Page Content ===")
            print(page.content()[:2000])

        except Exception as e:
            print(f"Error during test: {e}")
            page.screenshot(path='/tmp/error_screenshot.png', full_page=True)
            print("Error screenshot saved: /tmp/error_screenshot.png")

        finally:
            browser.close()

if __name__ == '__main__':
    test_udder_health()
