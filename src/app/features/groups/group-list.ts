import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { GroupsApi } from '../../core/api/groups.service';
import { poll } from '../../shared/poll';
import { EmptyComponent } from '../../shared/empty.component';
import { formatCount, formatHashrate } from '../../shared/format';
import { TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatPaginatorModule, EmptyComponent, TimeAgoPipe],
  template: `
    <div class="page">
      <header class="page-head">
        <h1 class="page-title"><mat-icon>groups</mat-icon> Groups</h1>
        <a mat-flat-button color="primary" routerLink="/groups/new">
          <mat-icon>add</mat-icon> New group
        </a>
      </header>
      <p class="muted intro">
        Public Group-Solo parties: solo-miner payout distribution, shared across members.
        Coinbase fits up to {{ capacity.value()?.maxMembers ?? '—' }} members per group.
      </p>

      @if (list.value(); as l) {
        <div class="group-grid">
          @for (g of l.items; track g.id) {
            <a class="group-card" [routerLink]="['/groups', g.id]">
              <div class="group-name">{{ g.name }}</div>
              <div class="group-meta">
                <span class="badge" [class.badge-primary]="g.active">{{ g.active ? 'active' : 'inactive' }}</span>
                <span class="badge">{{ g.mode }}</span>
                <span class="muted">{{ g.memberCount }}{{ g.maxMembers ? '/' + g.maxMembers : '' }} members</span>
              </div>
              <div class="group-hash mono">{{ fmt.formatHashrate(g.totalHashrate) }}</div>
              <div class="muted group-sub">
                created {{ g.createdAt | timeAgo }}
                @if (g.finderBonusPpm) { · finder bonus {{ (g.finderBonusPpm / 10000).toFixed(1) }}% }
              </div>
            </a>
          }
        </div>
        <mat-paginator
          [length]="l.total"
          [pageSize]="pageSize()"
          [pageIndex]="page() - 1"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)"
        />
      } @else {
        <app-empty
          [loading]="list.isLoading()"
          [error]="list.error() ? 'Failed to load groups' : null"
          message="No public groups yet"
        />
      }
    </div>
  `,
  styles: `
    .page-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .page-title { display: flex; align-items: center; gap: 10px; font-weight: 700; margin: 0;
      mat-icon { color: var(--mat-sys-primary); } }
    .intro { margin: 0 0 24px; }
    .group-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 8px;
    }
    .group-card {
      display: block;
      padding: 18px 20px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      color: var(--mat-sys-on-surface);
      transition: border-color 0.15s;
      &:hover { border-color: var(--mat-sys-primary); text-decoration: none; }
    }
    .group-name { font-weight: 600; font-size: 1.05rem; margin-bottom: 8px; }
    .group-meta { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; font-size: 0.8rem; }
    .group-hash { font-size: 1.2rem; color: var(--mat-sys-primary); font-weight: 600; }
    .group-sub { font-size: 0.78rem; margin-top: 8px; }
  `,
})
export class GroupListComponent {
  protected readonly fmt = { formatHashrate, formatCount };
  private readonly api = inject(GroupsApi);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);

  protected readonly list = poll({
    intervalMs: 60_000,
    params: () => ({ page: this.page(), pageSize: this.pageSize() }),
    stream: (p) => this.api.listPublic(p.page, p.pageSize),
  });

  protected readonly capacity = poll({
    intervalMs: 300_000,
    stream: () => this.api.coinbaseCapacity(),
  });

  protected onPage(e: PageEvent): void {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
  }
}
