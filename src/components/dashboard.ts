import { Component } from '../core/component';
import { html } from '../core/html';
import { getLogs, getHeatmap, getAllMedia, ActivitySummary, DailyHeatmap, deleteLog } from '../api';
import { customConfirm } from '../modals';
import { StatsCard } from './dashboard/StatsCard';
import { HeatmapView } from './dashboard/HeatmapView';
import { ActivityCharts } from './dashboard/ActivityCharts';
import { setupCopyButton } from '../utils/clipboard';
import { formatLoggedDuration } from '../utils/time';

interface DashboardState {
    logs: ActivitySummary[];
    heatmapData: DailyHeatmap[];
    mediaList: any[];
    currentHeatmapYear: number;
    chartParams: {
        timeRangeDays: number;
        timeRangeOffset: number;
        groupByMode: 'media_type' | 'log_name';
        chartType: 'bar' | 'line';
    };
    isInitialized: boolean;
}

export class Dashboard extends Component<DashboardState> {
    private activeChartsComponent: ActivityCharts | null = null;
    private isRefreshing: boolean = false;

    constructor(container: HTMLElement) {
        super(container, {
            logs: [],
            heatmapData: [],
            mediaList: [],
            currentHeatmapYear: new Date().getFullYear(),
            chartParams: {
                timeRangeDays: 7,
                timeRangeOffset: 0,
                groupByMode: 'media_type',
                chartType: 'bar'
            },
            isInitialized: false
        });
    }

    async loadData() {
        if (this.isRefreshing) return;
        this.isRefreshing = true;
        try {
            const [logs, heatmapData, mediaList] = await Promise.all([
                getLogs(),
                getHeatmap(),
                getAllMedia()
            ]);
            this.setState({ logs, heatmapData, mediaList, isInitialized: true });
        } catch (e) {
            console.error("Dashboard failed to load data", e);
        } finally {
            this.isRefreshing = false;
        }
    }

    async render() {
        if (!this.state.isInitialized && !this.isRefreshing) {
            await this.loadData();
            return;
        }

        this.clear();
        const root = html`<div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 2rem;"></div>`;
        this.container.appendChild(root);

        // 1. Stats and Heatmap Row
        const topRow = html`<div style="display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 2rem;"></div>`;
        root.appendChild(topRow);

        const statsContainer = html`<div class="card" id="stats-box-container" style="display: flex; flex-direction: column;"></div>`;
        topRow.appendChild(statsContainer);
        new StatsCard(statsContainer, { logs: this.state.logs, mediaList: this.state.mediaList }).render();

        const heatmapContainer = html`<div id="heatmap-container" style="min-width: 0;"></div>`;
        topRow.appendChild(heatmapContainer);
        new HeatmapView(heatmapContainer, { heatmapData: this.state.heatmapData, year: this.state.currentHeatmapYear }, (dir) => {
            this.setState({ currentHeatmapYear: this.state.currentHeatmapYear + dir });
        }).render();

        // 2. Charts Row
        const chartsContainer = html`<div id="charts-container"></div>`;
        root.appendChild(chartsContainer);
        
        if (this.activeChartsComponent) this.activeChartsComponent.destroy();
        this.activeChartsComponent = new ActivityCharts(
            chartsContainer,
            { logs: this.state.logs, ...this.state.chartParams },
            (newParams) => {
                this.setState({ chartParams: { ...this.state.chartParams, ...newParams } });
            }
        );
        this.activeChartsComponent.render();

        // 3. Recent Logs Row
        const logsCard = html`
            <div class="card">
                <h3 style="margin-bottom: 1rem;">Recent Activity</h3>
                <div id="recent-logs-list" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
            </div>
        `;
        root.appendChild(logsCard);
        this.renderLogs(logsCard.querySelector('#recent-logs-list') as HTMLElement);
    }

    private renderLogs(list: HTMLElement) {
        const { logs } = this.state;
        const currentProfile = localStorage.getItem('kechimochi_profile') || 'default';

        if (logs.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary);">No activity logged yet.</p>';
            return;
        }

        list.innerHTML = logs.slice(0, 20).map(log => {
            const durationStr = formatLoggedDuration(log.duration_minutes);

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-dark); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap;">
                        <span style="color: var(--accent-green); font-weight: 500;">${currentProfile}</span> 
                        <span style="color: var(--text-secondary);">logged</span> 
                        <span>${durationStr}</span> 
                        <span style="color: var(--text-secondary);">of ${log.media_type}</span> 
                        <a class="dashboard-media-link" data-media-id="${log.media_id}" style="color: var(--text-primary); font-weight: 600; cursor: pointer; text-decoration: underline; text-decoration-color: var(--accent-blue);">${log.title}</a>
                        <button class="copy-btn copy-activity-title" data-title="${log.title.replace(/"/g, '&quot;')}" title="Copy Title" style="background: transparent; border: none; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-secondary);"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="color: var(--text-secondary);">${log.date}</div>
                        <button class="btn btn-danger btn-sm delete-log-btn" data-id="${log.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; background-color: #ff4757 !important; color: #ffffff !important; border: none; cursor: pointer;">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.copy-activity-title').forEach(btn => {
            const title = (btn as HTMLElement).getAttribute('data-title') || '';
            setupCopyButton(btn as HTMLElement, title);
        });

        list.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt((e.target as HTMLElement).getAttribute('data-id')!);
                const confirm = await customConfirm("Delete Log", "Are you sure you want to permanently delete this log entry?");
                if (confirm) {
                    await deleteLog(id);
                    await this.loadData();
                }
            });
        });

        list.querySelectorAll('.dashboard-media-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const mediaId = parseInt((e.target as HTMLElement).getAttribute('data-media-id')!);
                window.dispatchEvent(new CustomEvent('app-navigate', { detail: { view: 'media', focusMediaId: mediaId } }));
            });
        });
    }
}
