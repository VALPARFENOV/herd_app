#!/usr/bin/env python3
"""
Playwright test script for HerdMaster Pro
Tests all main pages and reports any errors
"""

from playwright.sync_api import sync_playwright
import sys
import time

def test_herdmaster_app():
    errors = []
    screenshots_dir = "/tmp/herdmaster_screenshots"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # Capture console errors
        console_errors = []
        page.on("console", lambda msg:
            console_errors.append(f"{msg.type()}: {msg.text()}") if msg.type() == "error" else None
        )

        # Capture page errors
        page_errors = []
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))

        print("Testing HerdMaster Pro application...")
        print("=" * 60)

        # Test 1: Dashboard
        print("\n1. Testing Dashboard (/)...")
        try:
            page.goto('http://localhost:3003/', wait_until='networkidle', timeout=30000)
            time.sleep(2)  # Wait for React to hydrate
            page.screenshot(path='/tmp/dashboard.png', full_page=True)
            print("   ✓ Dashboard loaded successfully")
        except Exception as e:
            errors.append(f"Dashboard: {str(e)}")
            print(f"   ✗ Dashboard failed: {str(e)}")

        # Test 2: Animals list
        print("\n2. Testing Animals list (/animals)...")
        try:
            page.goto('http://localhost:3003/animals', wait_until='networkidle', timeout=30000)
            time.sleep(2)
            page.screenshot(path='/tmp/animals.png', full_page=True)

            # Check if table is rendered
            animals_table = page.locator('table').count()
            if animals_table > 0:
                print(f"   ✓ Animals list loaded ({animals_table} table(s) found)")
            else:
                errors.append("Animals: No table found")
                print("   ✗ Animals: No table found")
        except Exception as e:
            errors.append(f"Animals: {str(e)}")
            print(f"   ✗ Animals failed: {str(e)}")

        # Test 3: Breeding page
        print("\n3. Testing Breeding page (/breeding)...")
        try:
            page.goto('http://localhost:3003/breeding', wait_until='networkidle', timeout=30000)
            time.sleep(2)
            page.screenshot(path='/tmp/breeding.png', full_page=True)

            # Check for tabs
            tabs = page.locator('[role="tab"]').count()
            if tabs >= 4:
                print(f"   ✓ Breeding page loaded ({tabs} tabs found)")
            else:
                errors.append(f"Breeding: Expected 4 tabs, found {tabs}")
                print(f"   ✗ Breeding: Expected 4 tabs, found {tabs}")
        except Exception as e:
            errors.append(f"Breeding: {str(e)}")
            print(f"   ✗ Breeding failed: {str(e)}")

        # Test 4: Vet page
        print("\n4. Testing Vet page (/vet)...")
        try:
            page.goto('http://localhost:3003/vet', wait_until='networkidle', timeout=30000)
            time.sleep(2)
            page.screenshot(path='/tmp/vet.png', full_page=True)
            print("   ✓ Vet page loaded successfully")
        except Exception as e:
            errors.append(f"Vet: {str(e)}")
            print(f"   ✗ Vet failed: {str(e)}")

        # Test 5: Quality page
        print("\n5. Testing Quality page (/quality)...")
        try:
            page.goto('http://localhost:3003/quality', wait_until='networkidle', timeout=30000)
            time.sleep(2)
            page.screenshot(path='/tmp/quality.png', full_page=True)
            print("   ✓ Quality page loaded successfully")
        except Exception as e:
            errors.append(f"Quality: {str(e)}")
            print(f"   ✗ Quality failed: {str(e)}")

        # Test 6: Notifications page
        print("\n6. Testing Notifications page (/notifications)...")
        try:
            page.goto('http://localhost:3003/notifications', wait_until='networkidle', timeout=30000)
            time.sleep(2)
            page.screenshot(path='/tmp/notifications.png', full_page=True)

            # Check for stats cards
            cards = page.locator('[class*="card"]').count()
            if cards > 0:
                print(f"   ✓ Notifications page loaded ({cards} cards found)")
            else:
                errors.append("Notifications: No cards found")
                print("   ✗ Notifications: No cards found")
        except Exception as e:
            errors.append(f"Notifications: {str(e)}")
            print(f"   ✗ Notifications failed: {str(e)}")

        # Test 7: Notification bell dropdown
        print("\n7. Testing Notification Bell...")
        try:
            page.goto('http://localhost:3003/', wait_until='networkidle', timeout=30000)
            time.sleep(2)

            # Find and click the notification bell
            bell_button = page.locator('button:has(svg.lucide-bell)').first
            if bell_button.count() > 0:
                bell_button.click()
                time.sleep(1)
                page.screenshot(path='/tmp/notification_dropdown.png')
                print("   ✓ Notification bell dropdown opened")
            else:
                errors.append("Notification Bell: Button not found")
                print("   ✗ Notification Bell: Button not found")
        except Exception as e:
            errors.append(f"Notification Bell: {str(e)}")
            print(f"   ✗ Notification Bell failed: {str(e)}")

        browser.close()

        # Report results
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)

        if console_errors:
            print(f"\n⚠️  Console Errors ({len(console_errors)}):")
            for err in console_errors[:10]:  # Show first 10
                print(f"   {err}")

        if page_errors:
            print(f"\n⚠️  Page Errors ({len(page_errors)}):")
            for err in page_errors[:10]:  # Show first 10
                print(f"   {err}")

        if errors:
            print(f"\n❌ Test Failures ({len(errors)}):")
            for err in errors:
                print(f"   - {err}")
            print("\n❌ TESTS FAILED")
            return 1
        else:
            print("\n✅ ALL TESTS PASSED")
            print("\nScreenshots saved to /tmp/")
            return 0

if __name__ == "__main__":
    sys.exit(test_herdmaster_app())
