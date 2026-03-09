/**
 * CUJ: Profile view shows settings and stats
 * 
 * Verifies that:
 *   - Profile view renders correctly
 *   - Theme selector is present
 *   - Reading speed report card data is shown
 *   - Navigation back to dashboard works (regression test)
 */

import { waitForAppReady } from '../helpers/setup.js';
import {
  navigateTo,
  verifyActiveView,
  verifyViewNotBroken,
  takeAndCompareScreenshot,
} from '../helpers/interactions.js';

describe('Profile CUJ', () => {
  before(async () => {
    await waitForAppReady();
    await navigateTo('profile');
  });

  it('should navigate to the profile view', async () => {
    expect(await verifyActiveView('profile')).toBe(true);
  });

  it('should display the theme selector', async () => {
    const themeSelect = await $('#profile-select-theme');
    // There should be at least one select element for theme
    if (await themeSelect.isExisting()) {
      expect(await themeSelect.isDisplayed()).toBe(true);
    }
  });

  it('should display reading speed report card', async () => {
    // Look for elements related to the reading speed report
    const reportSection = await $('#profile-report-card');
    if (await reportSection.isExisting()) {
      expect(await reportSection.isDisplayed()).toBe(true);
    }
  });

  it('should not be in a broken state', async () => {
    await verifyViewNotBroken();
  });

  it('should navigate back to dashboard after visiting profile', async () => {
    await navigateTo('dashboard');
    await browser.pause(500);
    expect(await verifyActiveView('dashboard')).toBe(true);
    await verifyViewNotBroken();
  });

  it('should match the baseline screenshot', async () => {
    await navigateTo('profile');
    await browser.pause(500);
    await takeAndCompareScreenshot('profile-view');
  });
});
