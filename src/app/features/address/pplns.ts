import { Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { PplnsApi } from '../../core/api/pplns.service';
import { poll } from '../../shared/poll';
import { EmptyComponent } from '../../shared/empty.component';
import { formatCount, formatDifficulty, formatSats } from '../../shared/format';
import { BtcPipe, SatsPipe, TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-address-pplns',
  standalone: true,
  imports: [DatePipe, MatIconModule, EmptyComponent, BtcPipe, SatsPipe, TimeAgoPipe],
  template: `
    @if (summary.error()) {
      <app-empty [error]="'PPLNS is not enabled on this pool.'" />
    } @else {
      <section class="card-grid">
        <div class="stat-card">
          <div class="stat-label">Window shares</div>
          <div class="stat-value">{{ fmt.formatCount(summary.value()?.currentWindowShares ?? 0) }}</div>
          <div class="stat-sub">{{ (summary.value()?.currentWindowPercent ?? 0).toFixed(4) }}% of window</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending balance</div>
          <div class="stat-value">
            {{ summary.value()?.balanceSats | sats }}
            @if (summary.value()?.balanceLabel === 'credit') { <span class="badge badge-ok">credit</span> }
            @if (summary.value()?.balanceLabel === 'debit') { <span class="badge badge-warn">debit</span> }
          </div>
          <div class="stat-sub">carried toward the next payout</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Lifetime paid</div>
          <div class="stat-value">{{ summary.value()?.totalPaidSats | btc }}</div>
          <div class="stat-sub">{{ summary.value()?.totalPaidSats | sats }}</div>
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Payout history</h2>
        @if (history.value()?.length) {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>Block</th><th>Paid</th><th>Share</th><th>Type</th><th>When</th></tr>
              </thead>
              <tbody>
                @for (h of history.value()!; track h.id) {
                  <tr>
                    <td class="mono">#{{ h.blockHeight }}</td>
                    <td class="mono">{{ h.paidSats | sats }}</td>
                    <td>{{ h.percent.toFixed(2) }}%</td>
                    <td><span class="badge">{{ h.rowType }}</span></td>
                    <td class="muted" [title]="h.createdAt | date: 'MMM d, y, HH:mm:ss'">{{ h.createdAt | timeAgo }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty [loading]="history.isLoading()" message="No payouts yet" />
        }
      </section>
    }
  `,
})
export class AddressPplnsComponent {
  readonly address = input.required<string>();
  protected readonly fmt = { formatCount, formatDifficulty, formatSats };

  private readonly pplnsApi = inject(PplnsApi);

  protected readonly summary = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.pplnsApi.addressSummary(p.address),
  });

  protected readonly history = poll({
    intervalMs: 120_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.pplnsApi.addressHistory(p.address, 100),
  });
}
