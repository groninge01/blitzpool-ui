import { Component, computed, inject, input, signal } from '@angular/core';
import { ChartConfiguration } from 'chart.js';

import { ClientApi } from '../../core/api/client.service';
import { RangeParam, RejectedSlot, SlotCounts } from '../../core/api/models';
import { poll } from '../../shared/poll';
import { ChartComponent } from '../../shared/chart.component';
import { RangeSelectComponent } from '../../shared/range-select.component';
import { EmptyComponent } from '../../shared/empty.component';
import { formatCount, formatDifficulty } from '../../shared/format';
import { WorkerShareEntry } from '../../core/api/models';

const REASON_COLORS: Record<string, string> = {
  JobNotFound: '#f87171',
  DuplicateShare: '#fbbf24',
  LowDifficultyShare: '#fb923c',
  UnauthorizedWorker: '#e879f9',
  NotSubscribed: '#a78bfa',
  Stale: '#94a3b8',
  VersionRollingNotAllowed: '#22d3ee',
  OtherUnknown: '#78716c',
};

function baseOptions(yLabel: (v: number) => string): ChartConfiguration['options'] {
  return {
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { labels: { color: '#a8a29e' } },
      tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${yLabel(ctx.parsed.y ?? 0)}` } },
    },
    scales: {
      x: {
        type: 'time',
        ticks: { color: '#a8a29e', maxTicksLimit: 8 },
        grid: { color: 'rgba(128,128,128,0.12)' },
      },
      y: {
        beginAtZero: true,
        stacked: false,
        ticks: { color: '#a8a29e', callback: (v) => yLabel(Number(v)) },
        grid: { color: 'rgba(128,128,128,0.12)' },
      },
    },
  };
}

@Component({
  selector: 'app-address-stats',
  standalone: true,
  imports: [ChartComponent, RangeSelectComponent, EmptyComponent],
  template: `
    <div class="range-row">
      <app-range-select [value]="range()" (valueChange)="range.set($event)" />
    </div>

    <section class="panel">
      <h2 class="panel-title">Accepted shares</h2>
      @if (acceptedConfig(); as cfg) { <app-chart [config]="cfg" /> }
      @else { <app-empty [loading]="accepted.isLoading()" /> }
    </section>

    <section class="panel">
      <h2 class="panel-title">Rejected shares by reason</h2>
      @if (rejectedConfig(); as cfg) { <app-chart [config]="cfg" /> }
      @else { <app-empty [loading]="rejected.isLoading()" /> }
    </section>

    <section class="panel">
      <h2 class="panel-title">Difficulty scores</h2>
      @if (diffConfig(); as cfg) { <app-chart [config]="cfg" /> }
      @else { <app-empty [loading]="diffScores.isLoading()" /> }
    </section>

    <section class="panel">
      <h2 class="panel-title">Active workers / addresses</h2>
      @if (workersConfig(); as cfg) { <app-chart [config]="cfg" /> }
      @else { <app-empty [loading]="workers.isLoading()" /> }
    </section>

    <section class="panel">
      <h2 class="panel-title">Share totals by worker</h2>
      @if (workerShares.value()?.length) {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Worker</th><th>Accepted shares</th><th>Rejected</th></tr></thead>
            <tbody>
              @for (w of workerShares.value()!; track w.workerName) {
                <tr>
                  <td>{{ w.workerName }}</td>
                  <td class="mono">{{ fmt.formatCount(w.totalShares) }}</td>
                  <td class="mono">{{ fmt.formatCount(w.totalRejected) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <app-empty [loading]="workerShares.isLoading()" message="No share totals" />
      }
    </section>
  `,
  styles: `.range-row { display: flex; justify-content: flex-end; margin-bottom: 16px; }`,
})
export class AddressStatsComponent {
  readonly address = input.required<string>();
  protected readonly range = signal<RangeParam>('1d');
  protected readonly fmt = { formatCount };

  private readonly clientApi = inject(ClientApi);

  private readonly params = () => ({ address: this.address(), range: this.range() });

  protected readonly accepted = poll({
    params: this.params,
    stream: (p) => this.clientApi.accepted(p.address, p.range),
  });
  protected readonly rejected = poll({
    params: this.params,
    stream: (p) => this.clientApi.rejected(p.address, p.range),
  });
  protected readonly diffScores = poll({
    params: this.params,
    stream: (p) => this.clientApi.diffScores(p.address, p.range),
  });
  protected readonly workers = poll({
    params: this.params,
    stream: (p) => this.clientApi.workers(p.address, p.range),
  });
  protected readonly workerShares = poll({
    params: () => ({ address: this.address() }),
    stream: (p) => this.clientApi.workerShares(p.address),
  });

  protected readonly acceptedConfig = computed<ChartConfiguration | null>(() => {
    const slots = this.accepted.value()?.slotData;
    if (!slots) return null;
    return {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Accepted',
            data: slots.map((s: SlotCounts) => ({ x: Date.parse(s.time), y: s.counts['accepted'] ?? 0 })),
            borderColor: '#4caf50',
            backgroundColor: 'rgba(76,175,80,0.15)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: baseOptions(formatCount),
    };
  });

  protected readonly rejectedConfig = computed<ChartConfiguration | null>(() => {
    const slots = this.rejected.value()?.slotData;
    if (!slots) return null;
    const reasons = new Set<string>();
    for (const s of slots) for (const k of Object.keys(s.counts)) reasons.add(k);
    const datasets = [...reasons].map((reason) => ({
      label: reason,
      data: slots.map((s: RejectedSlot) => ({ x: Date.parse(s.time), y: s.counts[reason]?.count ?? 0 })),
      borderColor: REASON_COLORS[reason] ?? '#78716c',
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 1.5,
    }));
    return { type: 'line', data: { datasets }, options: baseOptions(formatCount) };
  });

  protected readonly diffConfig = computed<ChartConfiguration | null>(() => {
    const slots = this.diffScores.value()?.slotData;
    if (!slots) return null;
    return {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Difficulty',
            data: slots.map((s) => ({ x: Date.parse(s.time), y: s.difficulty })),
            borderColor: '#22d3ee',
            backgroundColor: 'rgba(34,211,238,0.12)',
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: baseOptions(formatDifficulty),
    };
  });

  protected readonly workersConfig = computed<ChartConfiguration | null>(() => {
    const slots = this.workers.value()?.slotData;
    if (!slots) return null;
    const series = (key: string, label: string, color: string) => ({
      label,
      data: slots.map((s: SlotCounts) => ({ x: Date.parse(s.time), y: s.counts[key] ?? 0 })),
      borderColor: color,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      borderWidth: 2,
    });
    return {
      type: 'line',
      data: {
        datasets: [
          series('workers', 'Workers', '#f7931a'),
          series('addresses', 'Addresses', '#22d3ee'),
        ],
      },
      options: baseOptions((v) => String(v)),
    };
  });
}
