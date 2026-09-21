import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { GroupsApi } from '../../core/api/groups.service';
import { BlockpartyApi } from '../../core/api/blockparty.service';
import { LocalStore } from '../../core/state/local.store';
import { poll } from '../../shared/poll';
import { EmptyComponent } from '../../shared/empty.component';
import { formatHashrate } from '../../shared/format';
import { TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-address-groups',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule, EmptyComponent, TimeAgoPipe],
  template: `
    <section class="panel">
      <h2 class="panel-title">Group-Solo membership</h2>
      @if (group.value(); as g) {
        <div class="row">
          <a [routerLink]="['/groups', g.id]" class="group-link">{{ g.name }}</a>
          <span class="badge" [class.badge-primary]="g.active">{{ g.active ? 'active' : 'inactive' }}</span>
          <span class="badge">{{ g.mode }}</span>
        </div>
        <div class="muted">{{ g.members.length }} members · {{ fmt.formatHashrate(g.totalHashrate) }}</div>
      } @else {
        <app-empty [loading]="group.isLoading()" message="Not a member of any group" />
      }
    </section>

    <section class="panel">
      <h2 class="panel-title">Blockparty</h2>
      @if (party.value(); as p) {
        @if (p.groupId) {
          <div class="row">
            <a [routerLink]="['/blockparty', p.groupId]" class="group-link">{{ p.groupName }}</a>
            <span class="badge badge-primary">{{ p.status }}</span>
            @if (p.role) { <span class="badge">{{ p.role }}</span> }
          </div>
        } @else {
          <app-empty message="Not in a blockparty" />
        }
      } @else {
        <app-empty [loading]="party.isLoading()" />
      }
    </section>

    <section class="panel">
      <h2 class="panel-title">Join requests</h2>
      @if (requests.value()?.length) {
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Group</th><th>Status</th><th>Requested</th></tr></thead>
            <tbody>
              @for (r of requests.value()!; track r.groupId) {
                <tr class="clickable" [routerLink]="['/groups', r.groupId]">
                  <td>{{ r.groupName }}</td>
                  <td><span class="badge" [class.badge-primary]="r.status === 'approved'">{{ r.status }}</span></td>
                  <td class="muted">{{ r.createdAt | timeAgo }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <app-empty [loading]="requests.isLoading()" message="No pending join requests" />
      }
    </section>
  `,
  styles: `
    .row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .group-link { font-weight: 600; font-size: 1.05rem; }
  `,
})
export class AddressGroupsComponent {
  readonly address = input.required<string>();
  protected readonly fmt = { formatHashrate };
  private readonly store = inject(LocalStore);

  private readonly groupsApi = inject(GroupsApi);
  private readonly blockpartyApi = inject(BlockpartyApi);

  // First fetch resolves the group id; if we hold its admin token,
  // follow up with an authenticated read for the full member roster.
  protected readonly group = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) =>
      this.groupsApi.byAddress(p.address).pipe(
        switchMap((g) => {
          const token = g?.id ? this.store.adminToken(g.id) : undefined;
          return token ? this.groupsApi.detail(g.id, p.address, token) : of(g);
        }),
      ),
  });

  protected readonly party = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.blockpartyApi.byAddress(p.address),
  });

  protected readonly requests = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.groupsApi.joinRequestsByAddress(p.address),
  });
}
