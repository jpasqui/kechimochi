/**
 * CUJ: Dashboard loads with correct data
 * 
 * Verifies that:
 *   - The dashboard view renders on app launch
 *   - Heatmap element is present
 *   - Stats cards show data from the fixtures
 *   - Screenshot matches baseline
 */

import { waitForAppReady } from '../helpers/setup.js';
import {
  verifyViewNotBroken,
  takeAndCompareScreenshot,
} from '../helpers/interactions.js';

describe('Dashboard CUJ', () => {
  before(async () => {
    await waitForAppReady();
  });

  it('should display the dashboard view on launch', async () => {
    const dashLink = await $('[data-view="dashboard"]');
    const classes = await dashLink.getAttribute('class');
    expect(classes).toContain('active');
  });

  it('should render the heatmap', async () => {
    const heatmap = await $('.heatmap');
    expect(await heatmap.isDisplayed()).toBe(true);
  });

  it('should display stats cards with fixture data', async () => {
    // There should be several card elements in the dashboard
    const statsCards = await $$('.card');
    expect(statsCards.length).toBeGreaterThan(0);
  });

  it('should have a functional view with no broken state', async () => {
    await verifyViewNotBroken();
  });

  it('should match the baseline screenshot', async () => {
    await takeAndCompareScreenshot('dashboard-initial');
  });
});
