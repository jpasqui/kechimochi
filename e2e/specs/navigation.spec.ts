import { waitForAppReady } from '../helpers/setup.js';
import {
  navigateTo,
  verifyActiveView,
  verifyViewNotBroken,
} from '../helpers/navigation.js';

type ViewName = 'dashboard' | 'media' | 'profile';

describe('Navigation CUJ', () => {
  before(async () => {
    await waitForAppReady();
  });

  // The full navigation sequence as specified
  const sequence: ViewName[] = [
    'dashboard',  // Starting view (verified, not navigated to)
    'media',
    'profile',
    'dashboard',
    'profile',
    'media',
    'dashboard',
  ];

  it('should start on the dashboard view', async () => {
    expect(await verifyActiveView('dashboard')).toBe(true);
    await verifyViewNotBroken();
  });

  // Generate a test for each navigation step
  for (let i = 1; i < sequence.length; i++) {
    const from = sequence[i - 1];
    const to = sequence[i];
    const stepNumber = i;

    it(`Step ${stepNumber}: should navigate from ${from} to ${to}`, async () => {
      await navigateTo(to);
      await browser.pause(500);

      expect(await verifyActiveView(to)).toBe(true);
    });

    it(`Step ${stepNumber}: ${to} view should not be broken`, async () => {
      await verifyViewNotBroken();

      const container = await $('#view-container');
      const children = await container.$$('*');
      expect(children.length).toBeGreaterThan(5);
    });
  }
});
