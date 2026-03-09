import { Component } from '../../core/component';
import { html } from '../../core/html';
import { ActivitySummary } from '../../api';

interface MediaLogState {
    logs: ActivitySummary[];
}

export class MediaLog extends Component<MediaLogState> {
    constructor(container: HTMLElement, logs: ActivitySummary[]) {
        super(container, { logs });
    }

    render() {
        this.clear();

        if (this.state.logs.length === 0) {
            this.container.innerHTML = '<div style="color: var(--text-secondary);">No activity logs found for this media.</div>';
            return;
        }

        const list = html`<div style="display: flex; flex-direction: column; gap: 0.5rem; flex: 1; overflow-y: auto;"></div>`;

        this.state.logs.forEach(log => {
            const entry = html`
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
                    <span><span style="color: var(--text-secondary);">Activity:</span> ${log.duration_minutes} Minutes</span>
                    <span style="color: var(--text-secondary);">${log.date}</span>
                </div>
            `;
            list.appendChild(entry);
        });

        this.container.appendChild(list);
    }
}
