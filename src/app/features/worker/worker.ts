import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChartConfiguration } from 'chart.js';

import { ClientApi } from '../../core/api/client.service';
import { poll } from '../../shared/poll';
import { ChartComponent, TIME_SCALE_24H } from '../../shared/chart.component';
import { EmptyComponent } from '../../shared/empty.component';
import { formatCount, formatDifficulty, formatHashrate } from '../../shared/format';

@Component({
  selector: 'app-worker',
  standalone: true,
  imports: [RouterLink, DatePipe, MatIconModule, ChartComponent, EmptyComponent],
  template: `
    <a routerLink="../" class="back-link"><mat-icon>arrow_back</mat-icon> {{ address() }}</a>
    <h2 class="worker-title"><mat-icon>memory</mat-icon> {{ worker() }}</h2>

    <section class="card-grid">
      <div class="stat-card">
        <div class="stat-label">Best difficulty</div>
        <div class="stat-value">{{ fmt.formatDifficulty(data.value()?.bestDifficulty ?? 0) }}</div>
      </div>
    </section>

    <section class="panel">
      <h2 class="panel-title">Hashrate &amp; rejections</h2>
      @if (chartConfig(); as cfg) {
        <app-chart [config]="cfg" />
      } @else {
        <app-empty [loading]="data.isLoading()" [error]="data.error() ? 'Worker not found' : null" />
      }
    </section>

    <section class="panel">
      <h2 class="panel-title">Slots</h2>
      @if (data.value()?.chartData?.length) {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Slot end</th><th>Hashrate</th><th>Accepted</th>
                <th>JobNotFound</th><th>Duplicate</th><th>LowDiff</th><th>Stale</th><th>VR</th>
              </tr>
            </thead>
            <tbody>
              @for (p of data.value()!.chartData; track p.label) {
                <tr>
                  <td class="muted">{{ p.label | date: 'MMM d HH:mm' }}</td>
                  <td class="mono">{{ fmt.formatHashrate(p.data) }}</td>
                  <td class="mono">{{ fmt.formatCount(p.accepted) }}</td>
                  <td class="mono">{{ p.rejectedJobNotFound || '—' }}</td>
                  <td class="mono">{{ p.rejectedDuplicatedShare || '—' }}</td>
                  <td class="mono">{{ p.rejectedLowDifficultyShare || '—' }}</td>
                  <td class="mono">{{ p.rejectedStale || '—' }}</td>
                  <td class="mono">{{ p.rejectedVersionRolling || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 12px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
    }
    .worker-title {
      display: flex; align-items: center; gap: 10px; font-weight: 600; margin: 0 0 20px;
      mat-icon { color: var(--mat-sys-primary); }
    }
  `,
})
export class WorkerComponent {
  readonly address = input.required<string>();
  readonly worker = input.required<string>();

  protected readonly fmt = { formatHashrate, formatCount, formatDifficulty };
  private readonly clientApi = inject(ClientApi);

  protected readonly data = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address(), worker: this.worker() }),
    stream: (p) => this.clientApi.worker(p.address, p.worker),
  });

  protected readonly chartConfig = computed<ChartConfiguration | null>(() => {
    const rows = this.data.value()?.chartData;
    if (!rows) return null;
    const rejected = (k: keyof (typeof rows)[number]) =>
      rows.map((r) => ({ x: Date.parse(r.label), y: (r[k] as number) || 0 }));
    return {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Hashrate',
            data: rows.map((r) => ({ x: Date.parse(r.label), y: r.data })),
            borderColor: '#f7931a',
            backgroundColor: 'rgba(247,147,26,0.12)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: 'y',
          },
          {
            label: 'Accepted shares',
            data: rejected('accepted'),
            borderColor: '#4caf50',
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 1.5,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: { legend: { labels: { color: '#a8a29e' } } },
        scales: {
          x: {
            type: 'time',
            time: TIME_SCALE_24H,
            ticks: { color: '#a8a29e', maxTicksLimit: 8 },
            grid: { color: 'rgba(128,128,128,0.12)' },
          },
          y: {
            beginAtZero: true,
            position: 'left',
            ticks: { color: '#a8a29e', callback: (v) => formatHashrate(Number(v)) },
            grid: { color: 'rgba(128,128,128,0.12)' },
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            ticks: { color: '#a8a29e' },
            grid: { drawOnChartArea: false },
          },
        },
      },
    };
  });
}
