const { test, expect } = require('@playwright/test');

test.describe('Sounny GitHub IO Critical Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting URL before each test
    await page.goto('/');
  });

  test('critical page rendering', async ({ page }) => {
    // Basic status code is handled by playwright if not set to fail, but we can check if body has content
    await expect(page.locator('body')).toBeVisible();

    // Check critical elements: H1 and Navigation
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('#mainNav')).toBeVisible();
  });

  test('navigation functionality', async ({ page }) => {
    // Check navigation for desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.click('text=Projects');
    // Ensure that it scrolled correctly
    await expect(page.locator('#projects')).toBeInViewport();
  });

  test('responsive behavior', async ({ page }) => {
    // Check desktop view menu visibility
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('#navLinks')).toBeVisible();

    // Check mobile view menu toggler visibility
    await page.setViewportSize({ width: 375, height: 667 });
    const navbarToggler = page.locator('.nav-toggle');
    await expect(navbarToggler).toBeVisible();

    // Check if toggling menu works
    await navbarToggler.click();
    await expect(page.locator('#navLinks')).toBeVisible();
  });

  test('malformed or missing content check', async ({ page }) => {
    // Check for malformed or missing content (e.g. broken images or links)
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Scroll down to trigger lazy loaded images
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for a short while for images to load
    await page.waitForTimeout(2000);

    // Wait for network idle
    await page.waitForLoadState('networkidle');

    // Any images that failed to load?
    const images = await page.evaluate(() => {
      return Array.from(document.images).map(img => ({
        src: img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth
      }));
    });

    const brokenImages = images.filter(img => !img.complete || img.naturalWidth === 0);
    expect(brokenImages).toEqual([]);

    // We expect no critical console errors (might need to filter some out depending on external scripts, but keeping it strict for now)
    // Ignore Google Analytics related errors which can happen in automated tests without real navigation tracking
    const criticalErrors = consoleErrors.filter(e => !e.includes('gtag') && !e.includes('googletagmanager'));
    expect(criticalErrors).toEqual([]);
  });
});
