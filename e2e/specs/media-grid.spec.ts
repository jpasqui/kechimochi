import { waitForAppReady } from '../helpers/setup.js';
import {
  navigateTo,
  verifyActiveView,
  verifyViewNotBroken,
} from '../helpers/navigation.js';
import { takeAndCompareScreenshot } from '../helpers/common.js';
import { isWebMode } from '../helpers/mode.js';

describe('Media Grid CUJ', () => {
  before(async () => {
    await waitForAppReady();
    await navigateTo('media');
  });

  it('should navigate to the media view', async () => {
    expect(await verifyActiveView('media')).toBe(true);
  });

  it('should display media items from fixture data', async () => {
    const mediaItems = await $$('.media-grid-item');
    expect(mediaItems.length).toBeGreaterThan(0);
  });

  it('should have a working search bar', async () => {
    const searchInput = await $('#grid-search-filter');
    if (await searchInput.isExisting()) {
      const seedTitle = await browser.execute(() => {
        const firstItem = document.querySelector('.media-grid-item');
        return firstItem?.getAttribute('data-title') || firstItem?.textContent || '';
      }) as string;
      const query = seedTitle.trim().slice(0, Math.max(1, Math.min(4, seedTitle.trim().length)));

      expect(query.length).toBeGreaterThan(0);

      await searchInput.setValue(query);
      await browser.waitUntil(async () => {
        const gridState = await browser.execute(() => {
          const items = Array.from(document.querySelectorAll('.media-grid-item'));
          return {
            count: items.length,
            titles: items.map((item) => item.getAttribute('data-title') || item.textContent || ''),
          };
        }) as { count: number; titles: string[] };

        return gridState.count > 0 && gridState.titles.every((title) => title.toLowerCase().includes(query.toLowerCase()));
      }, {
        timeout: 5000,
        timeoutMsg: 'Search filter did not narrow the media grid as expected',
      });

      // Clear the search
      await searchInput.clearValue();
      await browser.pause(500);
    }
  });

  it('should open detail view when clicking a media item', async () => {
    const firstItem = await $('.media-grid-item');
    if (await firstItem.isExisting()) {
      await firstItem.click();
      await browser.pause(500);

      // Detail view should show -- check for detail-specific elements
      const detailView = await $('#media-root');
      if (await detailView.isExisting()) {
        expect(await detailView.isDisplayed()).toBe(true);
      }
    }
  });

  it('should not be in a broken state', async () => {
    await verifyViewNotBroken();
  });

  it('should match the baseline screenshot', async () => {
    // Navigate back to grid first
    await navigateTo('media');
    await browser.pause(500);
    await takeAndCompareScreenshot(isWebMode() ? 'media-grid-web' : 'media-grid');
  });
});
