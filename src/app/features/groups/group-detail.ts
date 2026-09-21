import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { ChartConfiguration } from 'chart.js';
import { firstValueFrom, of } from 'rxjs';
import { validate } from 'bitcoin-address-validation';

import { GroupsApi } from '../../core/api/groups.service';
import { LocalStore } from '../../core/state/local.store';
import { JoinRequestEntry, OpenInviteStatus, RangeParam } from '../../core/api/models';
import { poll } from '../../shared/poll';
import { ChartComponent, TIME_SCALE_24H } from '../../shared/chart.component';
import { RangeSelectComponent } from '../../shared/range-select.component';
import { EmptyComponent } from '../../shared/empty.component';
import { formatCount, formatDifficulty, formatHashrate, formatSats, timeAgo } from '../../shared/format';
import { SatsPipe, TimeAgoPipe } from '../../shared/pipes';

const PALETTE = ['#f7931a', '#22d3ee', '#a78bfa', '#4caf50', '#fbbf24', '#f87171', '#38bdf8', '#e879f9'];

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    ChartComponent,
    RangeSelectComponent,
    EmptyComponent,
    SatsPipe,
    TimeAgoPipe,
  ],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.scss',
})
export class GroupDetailComponent {
  readonly id = input.required<string>();

  protected readonly store = inject(LocalStore);
  protected readonly fmt = { formatHashrate, formatCount, formatDifficulty, formatSats, timeAgo };
  protected readonly timeAgoPipe = new TimeAgoPipe();

  private readonly api = inject(GroupsApi);
  private readonly snack = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);
  private readonly fb = inject(FormBuilder);

  protected readonly viewer = signal<string>('');
  protected readonly adminTokenInput = signal<string>('');
  protected readonly adminToken = computed(
    () => this.adminTokenInput() || this.store.adminToken(this.id()),
  );
  protected readonly isAdmin = signal(false);
  protected readonly range = signal<RangeParam>('1d');
  protected readonly busy = signal(false);

  protected readonly detail = poll({
    intervalMs: 45_000,
    params: () => ({ id: this.id(), viewer: this.viewer(), token: this.adminToken() }),
    stream: (p) => this.api.detail(p.id, p.viewer || undefined, p.token || undefined),
  });

  protected readonly publicDetail = poll({
    intervalMs: 60_000,
    params: () => ({ id: this.id() }),
    stream: (p) => this.api.publicDetail(p.id),
  });

  private readonly chart = poll({
    intervalMs: 60_000,
    params: () => ({ id: this.id(), range: this.range() }),
    stream: (p) => this.api.chart(p.id, p.range),
  });

  protected readonly hashrate = poll({
    intervalMs: 45_000,
    params: () => ({ id: this.id() }),
    stream: (p) => this.api.hashrate(p.id),
  });

  protected readonly distribution = poll({
    intervalMs: 60_000,
    params: () => ({ id: this.id() }),
    stream: (p) => this.api.distribution(p.id),
  });

  protected readonly timeline = poll({
    intervalMs: 120_000,
    params: () => ({ id: this.id() }),
    stream: (p) => this.api.windowTimeline(p.id),
  });

  protected readonly bestDiff = poll({
    intervalMs: 60_000,
    params: () => ({ id: this.id() }),
    stream: (p) => this.api.bestDifficulty(p.id),
  });

  protected readonly history = poll({
    intervalMs: 120_000,
    params: () => ({ id: this.id() }),
    stream: (p) => this.api.history(p.id, 100),
  });

  protected readonly joinRequests = poll({
    intervalMs: 45_000,
    params: () => ({ id: this.id(), token: this.adminToken() }),
    stream: (p) =>
      p.token ? this.api.listJoinRequests(p.id, true, p.token) : of<JoinRequestEntry[]>([]),
  });

  protected readonly inviteStatus = poll({
    intervalMs: 60_000,
    params: () => ({ id: this.id(), token: this.adminToken() }),
    stream: (p) =>
      p.token
        ? this.api.openInviteStatus(p.id, p.token)
        : of<OpenInviteStatus>({
            active: false,
            token: null,
            expiresAt: null,
            createdAt: null,
            approvalRequired: null,
            link: null,
          }),
  });

  protected readonly group = computed(() => this.detail.value() ?? this.publicDetail.value() ?? null);

  protected readonly chartConfig = computed<ChartConfiguration | null>(() => {
    const data = this.chart.value();
    if (!data) return null;
    return {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Group hashrate',
            data: data.map((p) => ({ x: Date.parse(p.label), y: p.data })),
            borderColor: '#f7931a',
            backgroundColor: 'rgba(247,147,26,0.15)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { type: 'time', time: TIME_SCALE_24H, ticks: { color: '#a8a29e', maxTicksLimit: 8 }, grid: { color: 'rgba(128,128,128,0.12)' } },
          y: { beginAtZero: true, ticks: { color: '#a8a29e', callback: (v) => formatHashrate(Number(v)) }, grid: { color: 'rgba(128,128,128,0.12)' } },
        },
      },
    };
  });

  protected readonly timelineConfig = computed<ChartConfiguration | null>(() => {
    const t = this.timeline.value();
    if (!t || !t.days.length) return null;
    return {
      type: 'bar',
      data: {
        labels: t.days.map((d) => d.date.slice(0, 10)),
        datasets: t.contributors.map((c, i) => ({
          label: c.addressLabel,
          data: t.days.map((d) => d.values[i] ?? 0),
          backgroundColor: PALETTE[i % PALETTE.length],
          stack: 'shares',
        })),
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#a8a29e', boxWidth: 12 } } },
        scales: {
          x: { stacked: true, ticks: { color: '#a8a29e' }, grid: { display: false } },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { color: '#a8a29e', callback: (v) => formatCount(Number(v)) },
            grid: { color: 'rgba(128,128,128,0.12)' },
          },
        },
      },
    };
  });

  // ── Forms ────────────────────────────────────────────────────────

  protected readonly joinForm = this.fb.group({
    address: ['', [Validators.required, (c) => this.validAddress(c.value)]],
    message: [''],
  });
  protected readonly tokenForm = this.fb.group({ token: [''] });
  protected readonly inviteForm = this.fb.group({
    ttl: ['24h'],
    approvalRequired: [false],
  });
  protected readonly settingsForm = this.fb.group({
    preset: [''],
    intervalDays: [null as number | null],
    timezone: [''],
    finderBonusPpm: [null as number | null],
    isPublic: [false],
    resetRoundOnBlock: [false],
    maxMembers: [null as number | null],
  });
  protected readonly transferForm = this.fb.group({
    toAddress: ['', [Validators.required, (c) => this.validAddress(c.value)]],
  });

  private validAddress(v: string | null | undefined) {
    try {
      return validate(v ?? '') ? null : { address: true };
    } catch {
      return { address: true };
    }
  }

  protected toast(msg: string): void {
    this.snack.open(msg, 'OK');
  }

  protected applyToken(): void {
    const t = this.tokenForm.value.token?.trim();
    if (!t) return;
    this.adminTokenInput.set(t);
    this.store.setAdminToken(this.id(), t);
    this.isAdmin.set(true);
    this.detail.reload();
    this.joinRequests.reload();
    this.inviteStatus.reload();
  }

  protected async requestJoin(): Promise<void> {
    const { address, message } = this.joinForm.value;
    if (!address) return;
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.api.createJoinRequest(this.id(), address.trim(), message?.trim() || undefined),
      );
      this.store.rememberAddress(address.trim());
      this.toast('Join request sent');
      this.joinForm.reset();
    } catch {
      this.toast('Join request failed');
    } finally {
      this.busy.set(false);
    }
  }

  protected async decide(requestId: string, approve: boolean): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      if (approve) await firstValueFrom(this.api.approveJoinRequest(this.id(), requestId, token));
      else await firstValueFrom(this.api.rejectJoinRequest(this.id(), requestId, token));
      this.joinRequests.reload();
      this.detail.reload();
    } catch {
      this.toast('Action failed');
    }
  }

  protected async createInvite(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    const { ttl, approvalRequired } = this.inviteForm.value;
    try {
      const inv = await firstValueFrom(
        this.api.createOpenInvite(this.id(), ttl ?? '24h', !!approvalRequired, token),
      );
      this.clipboard.copy(inv.link);
      this.toast('Invite link copied');
      this.inviteStatus.reload();
    } catch {
      this.toast('Failed to create invite');
    }
  }

  protected async revokeInvite(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      await firstValueFrom(this.api.revokeOpenInvite(this.id(), token));
      this.inviteStatus.reload();
    } catch {
      this.toast('Revoke failed');
    }
  }

  protected copyInvite(): void {
    const link = this.inviteStatus.value()?.link;
    if (link) {
      this.clipboard.copy(link);
      this.toast('Invite link copied');
    }
  }

  protected async saveSettings(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    const v = this.settingsForm.value;
    try {
      await firstValueFrom(
        this.api.updateSettings(
          this.id(),
          {
            preset: v.preset || null,
            intervalDays: v.intervalDays ?? null,
            timezone: v.timezone || null,
            finderBonusPpm: v.finderBonusPpm ?? null,
            isPublic: v.isPublic ?? undefined,
            resetRoundOnBlock: v.resetRoundOnBlock ?? undefined,
            maxMembers: v.maxMembers ?? null,
          },
          token,
        ),
      );
      this.toast('Settings saved');
      this.detail.reload();
    } catch {
      this.toast('Save failed');
    }
  }

  protected async removeMember(address: string | undefined): Promise<void> {
    const token = this.adminToken();
    if (!token || !address) return;
    try {
      await firstValueFrom(this.api.removeMember(this.id(), address, token));
      this.detail.reload();
      this.hashrate.reload();
    } catch {
      this.toast('Remove failed');
    }
  }

  protected async transferOwnership(): Promise<void> {
    const token = this.adminToken();
    const to = this.transferForm.value.toAddress?.trim();
    if (!token || !to) return;
    try {
      const res = await firstValueFrom(this.api.transfer(this.id(), to, token));
      this.store.setAdminToken(this.id(), res.adminToken);
      this.adminTokenInput.set(res.adminToken);
      this.toast('Ownership transferred — new admin token stored');
      this.detail.reload();
    } catch {
      this.toast('Transfer failed');
    }
  }

  protected async dissolve(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      await firstValueFrom(this.api.dissolve(this.id(), token));
      this.store.clearAdminToken(this.id());
      this.toast('Group dissolved');
      this.detail.reload();
    } catch {
      this.toast('Dissolve failed');
    }
  }
}
