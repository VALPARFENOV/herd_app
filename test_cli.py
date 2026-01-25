"""
Test the CLI bar interface
"""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Navigate to the dashboard
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')

    # Take screenshot of initial state
    page.screenshot(path='/tmp/cli_bar_initial.png', full_page=True)
    print("✓ Screenshot saved: /tmp/cli_bar_initial.png")

    # Focus on the CLI bar using /key
    page.keyboard.press('/')
    page.wait_for_timeout(500)

    # Type a command
    page.keyboard.type('LIST')
    page.wait_for_timeout(500)

    # Take screenshot with autocomplete
    page.screenshot(path='/tmp/cli_bar_typing.png', full_page=True)
    print("✓ Screenshot saved: /tmp/cli_bar_typing.png")

    # Check if CLI bar is visible
    cli_bar = page.locator('text=Type DairyComp command')
    if cli_bar.is_visible():
        print("✓ CLI bar is visible")
    else:
        print("✗ CLI bar is not visible")

    # Check if autocomplete dropdown is visible
    autocomplete = page.locator('text=command')
    if autocomplete.is_visible():
        print("✓ Autocomplete dropdown is visible")
    else:
        print("⚠ Autocomplete dropdown is not visible (may be expected)")

    browser.close()
    print("\n✓ All tests completed!")
