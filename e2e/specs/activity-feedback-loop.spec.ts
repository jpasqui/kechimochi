import { waitForAppReady } from '../helpers/setup.js';
import { 
    navigateTo, 
    verifyActiveView, 
    getStatValue,
    deleteMostRecentLog,
    getHeatmapCellColor,
    logActivityGlobal
} from '../helpers/interactions.js';

describe('CUJ: Activity Feedback Loop (Dashboard Management)', () => {
    before(async () => {
        await waitForAppReady();
    });

    it('should reflect deletions and new logs on the dashboard immediately', async () => {
        // 1) Navigate to Dashboard
        await navigateTo('dashboard');
        expect(await verifyActiveView('dashboard')).toBe(true);

        // 2) Note the "Total Lifetime Logs" count
        const initialLogsCount = await getStatValue('stat-total-logs');
        console.log(`Initial logs count: ${initialLogsCount}`);

        // 3) Delete the most recent log
        // Based on seed.ts, it should be '2024-03-08'
        const targetDate = '2024-03-08';
        const initialCellColor = await getHeatmapCellColor(targetDate);
        
        await deleteMostRecentLog();

        // 4) Verify count decreases by one
        const afterDeleteCount = await getStatValue('stat-total-logs');
        expect(afterDeleteCount).toBe(initialLogsCount - 1);

        // 5) Verify heatmap color for that day updates
        const afterDeleteCellColor = await getHeatmapCellColor(targetDate);
        // If it was the only log for that day (which it is in seed), it should become transparent/empty
        // In our CSS, empty cells have no background-color specified inline, so they inherit or are transparent
        // But getHeatmapCellColor returns the computed color.
        expect(afterDeleteCellColor).not.toBe(initialCellColor);

        // 6) Click Log (+) button and log a 1000-minute session for today (2024-03-31)
        const todayDate = '2024-03-31';
        await logActivityGlobal('呪術廻戦', 1000);

        // 7) Verify "Total Lifetime Logs" count increased back
        const finalLogsCount = await getStatValue('stat-total-logs');
        expect(finalLogsCount).toBe(afterDeleteCount + 1);

        // 8) Verify today's heatmap cell reflects max intensity
        const todayCellColor = await getHeatmapCellColor(todayDate);
        // Max intensity for 1000 mins should be high saturation/lightness
        // Let's just verify it's not the default color (which is usually rgba(0,0,0,0) or transparent)
        expect(todayCellColor).not.toContain('rgba(0, 0, 0, 0)');
        expect(todayCellColor).not.toBe('');

        // 9) Verify Streak and Daily Average
        // 2024-03-31 with 1000 mins should increase current streak if the previous log was yesterday
        // However, seed ends at 2024-03-08. So current streak will be 1.
        const currentStreak = await getStatValue('stat-current-streak');
        expect(currentStreak).toBeGreaterThanOrEqual(1);

        const dailyAvg = await getStatValue('stat-total-avg');
        expect(dailyAvg).toBeGreaterThan(0);
    });
});
