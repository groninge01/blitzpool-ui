import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChartConfiguration } from 'chart.js';

import { PoolApi } from '../../core/api/pool.service';
import { AccountApi } from '../../core/api/account.service';
import { PplnsApi } from '../../core/api/pplns.service';
import { ConfigService } from '../../core/config.service';
import { RangeParam } from '../../core/api/models';
import { poll } from '../../shared/poll';
import { ChartComponent, TIME_SCALE_24H } from '../../shared/chart.component';
import { RangeSelectComponent } from '../../shared/range-select.component';
import { EmptyComponent } from '../../shared/empty.component';
import {
  formatCount,
  formatDifficulty,
  formatHashrate,
  formatSats,
  timeAgo,
} from '../../shared/format';
import { AvgTimeToBlockPipe, TimeAgoPipe, MaskAddressPipe } from '../../shared/pipes';

const PRIMARY = '#f7931a';
const CYAN = '#22d3ee';
const GREEN = '#4caf50';
const AMBER = '#fbbf24';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ChartComponent,
    RangeSelectComponent,
    EmptyComponent,
    AvgTimeToBlockPipe,
    TimeAgoPipe,
    MaskAddressPipe,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  private readonly poolApi = inject(PoolApi);
  private readonly pplnsApi = inject(PplnsApi);
  private readonly accountApi = inject(AccountApi);
  protected readonly config = inject(ConfigService);

  protected readonly fmt = { formatHashrate, formatCount, formatDifficulty, formatSats, timeAgo };

  protected readonly pool = poll({ intervalMs: 30_000, stream: () => this.poolApi.pool() });
  protected readonly info = poll({ intervalMs: 60_000, stream: () => this.poolApi.info() });
  protected readonly network = poll({ intervalMs: 60_000, stream: () => this.poolApi.network() });
  protected readonly difficulty = poll({ intervalMs: 60_000, stream: () => this.poolApi.difficulty() });
  protected readonly reward = poll({ intervalMs: 60_000, stream: () => this.poolApi.nextBlockReward() });
  protected readonly health = poll({ intervalMs: 30_000, stream: () => this.poolApi.health() });
  protected readonly pplns = poll({ intervalMs: 60_000, stream: () => this.pplnsApi.status() });
  protected readonly shares = poll({ intervalMs: 60_000, stream: () => this.poolApi.shares() });

  protected readonly chartRange = signal<RangeParam>('1d');
  protected readonly chartData = poll({
    intervalMs: 60_000,
    params: () => ({ range: this.chartRange() }),
    stream: (p) => this.poolApi.chart(p.range),
  });

  private readonly soloChart = poll({
    intervalMs: 60_000,
    stream: () => this.poolApi.chartByMode('solo', '7d'),
  });
  private readonly pplnsChart = poll({
    intervalMs: 60_000,
    stream: () => this.poolApi.chartByMode('pplns', '7d'),
  });

  protected readonly networkDifficulty = computed(() => {
    const d = this.difficulty.value()?.current ?? this.network.value()?.difficulty;
    return typeof d === 'number' ? d : 0;
  });

  protected readonly diffDelta = computed(() => {
    const d = this.difficulty.value();
    if (!d || d.previous == null || d.previous === 0) return null;
    return ((d.current - d.previous) / d.previous) * 100;
  });

  protected readonly chartConfig = computed<ChartConfiguration | null>(() => {
    const data = this.chartData.value();
    if (!data) return null;
    return {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Pool hashrate',
            data: data.map((p) => ({ x: Date.parse(p.label), y: p.data })),
            borderColor: PRIMARY,
            backgroundColor: 'rgba(247, 147, 26, 0.15)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: this.chartOptions('Hashrate'),
    };
  });

  protected readonly modeChartConfig = computed<ChartConfiguration | null>(() => {
    const solo = this.soloChart.value();
    const pplns = this.pplnsChart.value();
    if (!solo && !pplns) return null;
    const toDs = (rows: typeof solo, label: string, color: string) => ({
      label,
      data: (rows ?? []).map((p) => ({ x: Date.parse(p.label), y: p.data })),
      borderColor: color,
      backgroundColor: color + '22',
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 2,
    });
    return {
      type: 'line',
      data: {
        datasets: [
          toDs(solo, 'Solo', AMBER),
          toDs(pplns, 'PPLNS', CYAN),
        ],
      },
      options: this.chartOptions('7d by mode'),
    };
  });

  private chartOptions(_title: string): ChartConfiguration['options'] {
    return {
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { labels: { color: '#a8a29e' } },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: ${formatHashrate(ctx.parsed.y ?? 0)}`,
          },
        },
      },
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
    };
  }
}
