import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PoolApi } from '../../core/api/pool.service';
import { poll } from '../../shared/poll';
import { EmptyComponent } from '../../shared/empty.component';
import { formatCount, formatDifficulty, formatHashrate, formatSats, timeAgo } from '../../shared/format';
import { BytesPipe, TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-network',
  standalone: true,
  imports: [MatIconModule, EmptyComponent, BytesPipe, TimeAgoPipe],
  template: `
    <div class="page">
      <h1 class="page-title"><mat-icon>public</mat-icon> Network</h1>

      <section class="card-grid">
        <div class="stat-card">
          <div class="stat-label">Node health</div>
          <div class="stat-value">
            @if (health.value(); as h) {
              <span class="badge" [class.badge-ok]="h.status === 'healthy'" [class.badge-warn]="h.status !== 'healthy'">
                {{ h.status }}
              </span>
            } @else { — }
          </div>
          <div class="stat-sub">
            db {{ health.value()?.checks?.database ?? '?' }} ·
            bitcoin {{ health.value()?.checks?.bitcoin ?? '?' }} ·
            tdp {{ health.value()?.checks?.tdp ?? '?' }}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pool version</div>
          <div class="stat-value mono">{{ version.value()?.version ?? '—' }}</div>
          <div class="stat-sub">uptime {{ health.value()?.uptimeReadable ?? '—' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Network difficulty</div>
          <div class="stat-value">{{ fmt.formatDifficulty(difficulty.value()?.current) }}</div>
          @if (difficulty.value(); as d) {
            <div class="stat-sub">updated {{ d.updatedAt | timeAgo }}</div>
          }
        </div>
        <div class="stat-card">
          <div class="stat-label">Network hashrate</div>
          <div class="stat-value">{{ fmt.formatHashrate(netHashps()) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Block height</div>
          <div class="stat-value mono">{{ network.value()?.['blocks'] ?? '—' }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Next block reward</div>
          <div class="stat-value">{{ fmt.formatSats(reward.value()?.rewardSats) }}</div>
          <div class="stat-sub">subsidy {{ fmt.formatSats(reward.value()?.subsidySats) }}</div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Node info</h2>
        @if (core.value(); as c) {
          <div class="kv-grid">
            @for (kv of coreKv(); track kv[0]) {
              <span class="muted">{{ kv[0] }}</span>
              <span class="mono">{{ kv[1] }}</span>
            }
          </div>
        } @else {
          <app-empty [loading]="core.isLoading()" [error]="core.error() ? 'bitcoin-rpc unavailable' : null" />
        }
      </section>

      <section class="panel">
        <h2 class="panel-title">Peers ({{ peers.value()?.length ?? 0 }})</h2>
        @if (peers.value()?.length) {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Client</th><th>Direction</th><th>Network</th><th>Location</th><th>Ping</th><th>Recv</th><th>Sent</th></tr>
              </thead>
              <tbody>
                @for (p of peers.value()!; track $index) {
                  <tr>
                    <td class="mono">{{ p.version || '—' }}</td>
                    <td><span class="badge" [class.badge-primary]="p.direction === 'outbound'">{{ p.direction }}</span></td>
                    <td>{{ p.network ?? '—' }}</td>
                    <td>{{ p.location ?? '—' }}</td>
                    <td class="mono">{{ p.pingtime != null ? (p.pingtime * 1000).toFixed(0) + ' ms' : '—' }}</td>
                    <td class="mono">{{ p.bytesrecv | bytes }}</td>
                    <td class="mono">{{ p.bytessent | bytes }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty [loading]="peers.isLoading()" [error]="peers.error() ? 'Peer list unavailable' : null" />
        }
      </section>
    </div>
  `,
  styles: `
    .page-title {
      display: flex; align-items: center; gap: 10px; font-weight: 700; margin: 0 0 24px;
      mat-icon { color: var(--mat-sys-primary); }
    }
    .kv-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 8px 16px;
      font-size: 0.875rem;
    }
  `,
})
export class NetworkComponent {
  protected readonly fmt = { formatDifficulty, formatHashrate, formatSats, formatCount, timeAgo };
  private readonly api = inject(PoolApi);

  protected readonly health = poll({ intervalMs: 30_000, stream: () => this.api.health() });
  protected readonly version = poll({ intervalMs: 300_000, stream: () => this.api.version() });
  protected readonly difficulty = poll({ intervalMs: 60_000, stream: () => this.api.difficulty() });
  protected readonly network = poll({ intervalMs: 60_000, stream: () => this.api.network() });
  protected readonly core = poll({ intervalMs: 120_000, stream: () => this.api.core() });
  protected readonly peers = poll({ intervalMs: 120_000, stream: () => this.api.peers() });
  protected readonly reward = poll({ intervalMs: 60_000, stream: () => this.api.nextBlockReward() });

  protected readonly netHashps = computed(() => {
    const v = this.network.value()?.['networkhashps'];
    return typeof v === 'number' ? v : 0;
  });

  protected readonly coreKv = computed<[string, string][]>(() => {
    const c = this.core.value();
    if (!c) return [];
    const pick = ['version', 'subversion', 'protocolversion', 'localservicesnames', 'connections', 'connections_in', 'connections_out', 'networkactive', 'relayfee', 'incrementalfee'];
    return pick
      .filter((k) => c[k] !== undefined)
      .map((k) => [k, Array.isArray(c[k]) ? (c[k] as unknown[]).join(', ') : String(c[k])]);
  });
}
