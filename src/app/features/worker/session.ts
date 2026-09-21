import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ChartConfiguration } from 'chart.js';

import { ClientApi } from '../../core/api/client.service';
import { poll } from '../../shared/poll';
import { ChartComponent, TIME_SCALE_24H } from '../../shared/chart.component';
import { EmptyComponent } from '../../shared/empty.component';
import { formatDifficulty, formatHashrate } from '../../shared/format';
import { TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [RouterLink, MatIconModule, ChartComponent, EmptyComponent, TimeAgoPipe],
  template: `
    <a [routerLink]="['../']" class="back-link"><mat-icon>arrow_back</mat-icon> {{ worker() }}</a>
    <h2 class="session-title">
      <mat-icon>cable</mat-icon> Session <span class="mono">{{ session() }}</span>
    </h2>

    <section class="card-grid">
      <div class="stat-card">
        <div class="stat-label">Worker</div>
        <div class="stat-value">{{ data.value()?.name ?? worker() }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Best difficulty</div>
        <div class="stat-value">{{ fmt.formatDifficulty(data.value()?.bestDifficulty ?? 0) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Connected</div>
        <div class="stat-value">{{ data.value()?.startTime | timeAgo }}</div>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">Hashrate</h2>
      @if (chartConfig(); as cfg) {
        <app-chart [config]="cfg" />
      } @else {
        <app-empty [loading]="data.isLoading()" [error]="data.error() ? 'Session not found' : null" />
      }
    </section>
  `,
  styles: `
    .back-link {
      display: inline-flex; align-items: center; gap: 6px; margin-bottom: 12px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .session-title {
      display: flex; align-items: center; gap: 10px; font-weight: 600; margin: 0 0 20px;
      mat-icon { color: var(--mat-sys-primary); }
    }
  `,
})
export class SessionComponent {
  readonly address = input.required<string>();
  readonly worker = input.required<string>();
  readonly session = input.required<string>();

  protected readonly fmt = { formatHashrate, formatDifficulty };
  private readonly clientApi = inject(ClientApi);

  protected readonly data = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address(), worker: this.worker(), session: this.session() }),
    stream: (p) => this.clientApi.session(p.address, p.worker, p.session),
  });

  protected readonly chartConfig = computed<ChartConfiguration | null>(() => {
    const rows = this.data.value()?.chartData;
    if (!rows) return null;
    return {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Hashrate',
            data: rows.map((r) => ({ x: Date.parse(r.label), y: r.data })),
            borderColor: '#f7931a',
            backgroundColor: 'rgba(247,147,26,0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            type: 'time',
            time: TIME_SCALE_24H,
            ticks: { color: '#a8a29e', maxTicksLimit: 8 },
            grid: { color: 'rgba(128,128,128,0.12)' },
          },
          y: {
            beginAtZero: true,
            ticks: { color: '#a8a29e', callback: (v) => formatHashrate(Number(v)) },
            grid: { color: 'rgba(128,128,128,0.12)' },
          },
        },
      },
    };
  });
}
