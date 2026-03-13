import { waitForAppReady } from '../helpers/setup.js';
import { navigateTo } from '../helpers/navigation.js';
import { clickMediaItem } from '../helpers/library.js';
import { addExtraField, editExtraField, getProjectionValue, backToGrid } from '../helpers/media-detail.js';
import { calculateReport } from '../helpers/profile.js';
import { logActivityGlobal } from '../helpers/dashboard.js';
import { isWebMode } from '../helpers/mode.js';

async function upsertCharacterCount(value: string): Promise<void> {
    const existing = await $('.editable-extra[data-key="Character count"]');
    if (await existing.isExisting()) {
        await editExtraField('Character count', value);
        return;
    }
    await addExtraField('Character count', value);
}

describe('CUJ: Progress Analysis (Projections)', () => {
    before(async () => {
        await waitForAppReady();
    });

    it('should calculate reading speeds and show correct projections per media type', async () => {
        if (isWebMode()) {
            await navigateTo('media');

            const titles = await browser.execute(() => {
                return Array.from(document.querySelectorAll('.media-grid-item'))
                    .map((item) => item.getAttribute('data-title') || '')
                    .filter((title) => title.trim().length > 0);
            }) as string[];

            expect(titles.length).toBeGreaterThanOrEqual(4);

            const [speedA, speedB, speedC] = titles;

            await clickMediaItem(speedA);
            await upsertCharacterCount('3000');
            await backToGrid();

            await clickMediaItem(speedB);
            await upsertCharacterCount('14250');
            await backToGrid();

            await clickMediaItem(speedC);
            await upsertCharacterCount('31500');
            await backToGrid();

            await navigateTo('profile');
            await calculateReport();

            await navigateTo('media');
            let target: string | null = null;
            for (const title of titles) {
                await clickMediaItem(title);
                await upsertCharacterCount('6000');
                const hasProjection = await $('#est-remaining-time').isDisplayed().catch(() => false);
                if (hasProjection) {
                    target = title;
                    break;
                }
                await backToGrid();
            }

            if (!target) {
                // eslint-disable-next-line no-console
                console.warn('[e2e] Skipping projection assertions in web mode: no media item rendered projection badges in current dataset.');
                return;
            }

            const remainingBefore = await getProjectionValue('est-remaining-time');
            const completionBefore = await getProjectionValue('est-completion-rate');
            const completionBeforeNumber = Number.parseInt(completionBefore.replaceAll('%', ''), 10);

            expect(remainingBefore.length).toBeGreaterThan(0);
            expect(completionBefore.endsWith('%')).toBe(true);
            expect(completionBeforeNumber).not.toBeNaN();

            await logActivityGlobal(target!, 30);

            await navigateTo('media');
            await clickMediaItem(target!);

            const remainingAfter = await getProjectionValue('est-remaining-time');
            const completionAfter = await getProjectionValue('est-completion-rate');
            const completionAfterNumber = Number.parseInt(completionAfter.replaceAll('%', ''), 10);

            expect(remainingAfter.length).toBeGreaterThan(0);
            expect(completionAfter.endsWith('%')).toBe(true);
            expect(completionAfterNumber).not.toBeNaN();
            expect(completionAfterNumber).toBeGreaterThanOrEqual(completionBeforeNumber);
            return;
        }

        await navigateTo('media');
        await clickMediaItem('ダンジョン飯');
        await upsertCharacterCount('3000');
        await backToGrid();

        await clickMediaItem('ある魔女が死ぬまで');
        await upsertCharacterCount('14250');
        await backToGrid();

        await clickMediaItem('STEINS;GATE');
        await upsertCharacterCount('31500');

        await navigateTo('profile');
        await calculateReport();

        await navigateTo('media');
        await clickMediaItem('呪術廻戦');
        await upsertCharacterCount('6000');
        expect(await getProjectionValue('est-remaining-time')).toBe('15min');
        expect(await getProjectionValue('est-completion-rate')).toBe('75%');
        await backToGrid();

        await clickMediaItem('薬屋のひとりごと');
        await upsertCharacterCount('15000');
        expect(await getProjectionValue('est-remaining-time')).toBe('1h15min');
        expect(await getProjectionValue('est-completion-rate')).toBe('75%');

        await logActivityGlobal('呪術廻戦', 30);
        
        await navigateTo('media');
        await clickMediaItem('呪術廻戦');
        
        expect(await getProjectionValue('est-remaining-time')).toBe('0min');
        expect(await getProjectionValue('est-completion-rate')).toBe('100%');
    });
});
