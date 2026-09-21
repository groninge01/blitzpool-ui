import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { AccountApi } from '../../core/api/account.service';
import { PoolApi } from '../../core/api/pool.service';
import { poll } from '../../shared/poll';
import { EmptyComponent } from '../../shared/empty.component';
import { formatDifficulty } from '../../shared/format';
import { TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [DatePipe, MatIconModule, EmptyComponent, TimeAgoPipe],
  template: `
    <div class="page">
      <h1 class="page-title"><mat-icon>emoji_events</mat-icon> Leaderboard</h1>

      <section class="panel">
        <h2 class="panel-title">Pool best difficulties</h2>
        @if (info.value()?.highScores?.length) {
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>#</th><th>Difficulty</th><th>Agent</th><th>When</th></tr></thead>
              <tbody>
                @for (h of info.value()!.highScores; track $index) {
                  <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="mono">{{ fmt.formatDifficulty(h.bestDifficulty) }}</td>
                    <td>{{ h.bestDifficultyUserAgent || '—' }}</td>
                    <td class="muted" [title]="h.updatedAt ?? ''">{{ h.updatedAt | timeAgo }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty [loading]="info.isLoading()" message="No scores yet" />
        }
      </section>

      <section class="panel">
        <h2 class="panel-title">Closest external shares</h2>
        <p class="muted">Shares reported by external pools that came closest to a block.</p>
        @if (top.value()?.length) {
          <div class="table-wrap">
            <table class="data-table">
              <thead><tr><th>#</th><th>Difficulty</th><th>Agent</th><th>Pool</th><th>When</th></tr></thead>
              <tbody>
                @for (t of top.value()!; track $index) {
                  <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="mono">{{ fmt.formatDifficulty(t.difficulty) }}</td>
                    <td>{{ t.userAgent || '—' }}</td>
                    <td>{{ t.externalPoolName || '—' }}</td>
                    <td class="muted" [title]="t.time | date: 'medium'">{{ t.time | timeAgo }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <app-empty [loading]="top.isLoading()" message="No external shares reported" />
        }
      </section>
    </div>
  `,
  styles: `
    .page-title {
      display: flex; align-items: center; gap: 10px; font-weight: 700; margin: 0 0 24px;
      mat-icon { color: var(--mat-sys-primary); }
    }
  `,
})
export class LeaderboardComponent {
  protected readonly fmt = { formatDifficulty };
  private readonly accountApi = inject(AccountApi);
  private readonly poolApi = inject(PoolApi);

  protected readonly info = poll({ intervalMs: 60_000, stream: () => this.poolApi.info() });
  protected readonly top = poll({
    intervalMs: 60_000,
    stream: () => this.accountApi.topDifficulties(),
  });
}
