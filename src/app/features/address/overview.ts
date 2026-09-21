import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration } from 'chart.js';

import { ClientApi } from '../../core/api/client.service';
import { PoolApi } from '../../core/api/pool.service';
import { PplnsApi } from '../../core/api/pplns.service';
import { RangeParam, WorkerEntry } from '../../core/api/models';
import { poll } from '../../shared/poll';
import { ChartComponent } from '../../shared/chart.component';
import { RangeSelectComponent } from '../../shared/range-select.component';
import { EmptyComponent } from '../../shared/empty.component';
import {
  formatCount,
  formatDifficulty,
  formatHashrate,
  formatSats,
  timeAgo,
} from '../../shared/format';
import { AvgTimeToBlockPipe, MaskAddressPipe, TimeAgoPipe } from '../../shared/pipes';
import { input } from '@angular/core';

interface WorkerGroup {
  name: string;
  sessions: WorkerEntry[];
  totalHashrate: number;
  bestDifficulty: number;
  lastSeen: string | null;
}

@Component({
  selector: 'app-address-overview',
  standalone: true,
  imports: [
    RouterLink,
    SlicePipe,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ChartComponent,
    RangeSelectComponent,
    EmptyComponent,
    AvgTimeToBlockPipe,
    MaskAddressPipe,
    TimeAgoPipe,
  ],
  templateUrl: './overview.html',
})
export class AddressOverviewComponent {
  readonly address = input.required<string>();

  private readonly clientApi = inject(ClientApi);
  private readonly poolApi = inject(PoolApi);
  private readonly pplnsApi = inject(PplnsApi);

  protected readonly fmt = { formatHashrate, formatCount, formatDifficulty, formatSats, timeAgo };
  protected readonly toNum = (v: string | number): number => Number(v) || 0;

  protected readonly coinbaseValue = computed(() => {
    const bt = this.blockTemplate.value();
    const v = bt?.blockTemplate?.['coinbasevalue'];
    return typeof v === 'number' ? v : 0;
  });

  protected readonly client = poll({
    intervalMs: 30_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.clientApi.info(p.address),
  });

  protected readonly mode = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.pplnsApi.mode(p.address),
  });

  protected readonly network = poll({ intervalMs: 120_000, stream: () => this.poolApi.network() });
  protected readonly blockTemplate = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.poolApi.clientBlockTemplate(p.address),
  });

  protected readonly range = signal<RangeParam>('1d');
  private readonly chart = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address(), range: this.range() }),
    stream: (p) => this.clientApi.chart(p.address, p.range),
  });

  protected readonly networkDifficulty = computed(() => {
    const d = this.network.value()?.difficulty;
    return typeof d === 'number' ? d : 0;
  });

  protected readonly workerGroups = computed<WorkerGroup[]>(() => {
    const workers = this.client.value()?.workers ?? [];
    const byName = new Map<string, WorkerEntry[]>();
    for (const w of workers) {
      const key = w.name || '(unnamed)';
      const list = byName.get(key);
      if (list) list.push(w);
      else byName.set(key, [w]);
    }
    return [...byName.entries()]
      .map(([name, sessions]) => ({
        name,
        sessions,
        totalHashrate: sessions.reduce((s, w) => s + (w.hashRate || 0), 0),
        bestDifficulty: Math.max(...sessions.map((w) => Number(w.bestDifficulty) || 0)),
        lastSeen:
          sessions
            .map((w) => w.lastSeen)
            .filter(Boolean)
            .sort()
            .pop() ?? null,
      }))
      .sort((a, b) => b.totalHashrate - a.totalHashrate);
  });

  protected readonly chartConfig = computed<ChartConfiguration | null>(() => {
    const data = this.chart.value();
    if (!data) return null;
    return {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Hashrate',
            data: data.map((p) => ({ x: Date.parse(p.label), y: p.data })),
            borderColor: '#f7931a',
            backgroundColor: 'rgba(247, 147, 26, 0.15)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatHashrate(ctx.parsed.y ?? 0)}`,
              afterLabel: (ctx) => {
                const diff = this.networkDifficulty();
                const v = ctx.parsed.y ?? 0;
                if (!diff || v <= 0) return '';
                const sec = (diff * 2 ** 32) / v;
                return ` ~${(sec / 86400).toFixed(1)} days avg to block`;
              },
            },
          },
        },
        scales: {
          x: {
            type: 'time',
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
