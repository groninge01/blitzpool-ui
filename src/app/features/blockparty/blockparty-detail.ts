import { Component, computed, inject, input, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { firstValueFrom, of } from 'rxjs';
import { validate } from 'bitcoin-address-validation';

import { BlockpartyApi } from '../../core/api/blockparty.service';
import { LocalStore } from '../../core/state/local.store';
import { poll } from '../../shared/poll';
import { EmptyComponent } from '../../shared/empty.component';
import { formatSats, timeAgo } from '../../shared/format';
import { MaskAddressPipe, SatsPipe } from '../../shared/pipes';

@Component({
  selector: 'app-blockparty-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    EmptyComponent,
    MaskAddressPipe,
    SatsPipe,
  ],
  templateUrl: './blockparty-detail.html',
  styleUrl: './blockparty-detail.scss',
})
export class BlockpartyDetailComponent {
  readonly id = input.required<string>();

  protected readonly store = inject(LocalStore);
  protected readonly fmt = { formatSats, timeAgo };

  private readonly api = inject(BlockpartyApi);
  private readonly snack = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);
  private readonly fb = inject(FormBuilder);

  protected readonly adminTokenInput = signal('');
  protected readonly adminToken = computed(
    () => this.adminTokenInput() || this.store.adminToken(`bp:${this.id()}`),
  );
  protected readonly viewerAddress = signal('');
  protected readonly busy = signal(false);

  protected readonly detail = poll({
    intervalMs: 45_000,
    params: () => ({ id: this.id(), viewer: this.viewerAddress() }),
    stream: (p) =>
      p.viewer
        ? this.api.memberView(p.id, p.viewer, this.store.memberToken(`${p.id}:${p.viewer}`) ?? '')
        : this.api.detail(p.id),
  });

  protected readonly history = poll({
    intervalMs: 120_000,
    params: () => ({ id: this.id() }),
    stream: (p) => this.api.history(p.id),
  });

  protected readonly joinLink = poll({
    intervalMs: 60_000,
    params: () => ({ id: this.id(), token: this.adminToken() }),
    stream: (p) =>
      p.token
        ? this.api.joinLinkStatus(p.id, p.token)
        : of({ active: false, token: null, expiresAt: null }),
  });

  // ── Forms ────────────────────────────────────────────────────────

  protected readonly tokenForm = this.fb.group({ token: [''] });
  protected readonly viewerForm = this.fb.group({ address: [''] });
  protected readonly hintForm = this.fb.group({ hint: [''] });
  protected readonly linkForm = this.fb.group({ ttl: ['24h'] });

  private newSplitRow(): FormGroup {
    return this.fb.group({
      address: ['', [Validators.required, (c) => this.validAddress(c.value)]],
      percentBp: [0, [Validators.required, Validators.min(1)]],
    });
  }

  protected readonly splitsForm = this.fb.group({
    rows: this.fb.array<FormGroup>([this.newSplitRow()]),
  });

  get splitsRows(): FormArray<FormGroup> {
    return this.splitsForm.controls.rows;
  }

  protected addSplitRow(): void {
    this.splitsRows.push(this.newSplitRow());
  }

  protected removeSplitRow(i: number): void {
    this.splitsRows.removeAt(i);
  }

  protected totalBp(): number {
    return this.splitsRows.controls.reduce((s, c) => s + (Number(c.value.percentBp) || 0), 0);
  }

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
    this.store.setAdminToken(`bp:${this.id()}`, t);
    this.joinLink.reload();
  }

  protected applyViewer(): void {
    const a = this.viewerForm.value.address?.trim();
    if (a) this.viewerAddress.set(a);
  }

  protected async saveSplits(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    const splits = this.splitsRows.value
      .map((r: { address?: string | null; percentBp?: number | null }) => ({
        address: (r.address ?? '').trim(),
        percentBp: Number(r.percentBp) || 0,
      }))
      .filter((r: { address: string }) => r.address);
    try {
      await firstValueFrom(this.api.updateSplits(this.id(), splits, token));
      this.toast('Splits saved');
      this.detail.reload();
    } catch {
      this.toast('Save failed — splits must total 10000 bp and all addresses must be verified');
    }
  }

  protected async saveHint(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      await firstValueFrom(
        this.api.updateRentalHint(this.id(), this.hintForm.value.hint?.trim() || null, token),
      );
      this.toast('Rental hint saved');
      this.detail.reload();
    } catch {
      this.toast('Save failed');
    }
  }

  protected async requestConfirmation(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      await firstValueFrom(this.api.requestConfirmation(this.id(), token));
      this.toast('Confirmation requested from all members');
      this.detail.reload();
    } catch {
      this.toast('Request failed');
    }
  }

  protected async transitionConfirming(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      await firstValueFrom(this.api.transitionConfirming(this.id(), token));
      this.toast('Moved to confirming');
      this.detail.reload();
    } catch {
      this.toast('Transition failed');
    }
  }

  protected async createLink(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      const res = await firstValueFrom(
        this.api.createJoinLink(this.id(), this.linkForm.value.ttl ?? '24h', token),
      );
      const url = `${location.origin}/blockparty/join/${res.token}`;
      this.clipboard.copy(url);
      this.toast('Join link copied');
      this.joinLink.reload();
    } catch {
      this.toast('Failed to create link');
    }
  }

  protected async revokeLink(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      await firstValueFrom(this.api.revokeJoinLink(this.id(), token));
      this.joinLink.reload();
    } catch {
      this.toast('Revoke failed');
    }
  }

  protected joinLinkUrl(): string {
    const t = this.joinLink.value()?.token;
    return t ? `${location.origin}/blockparty/join/${t}` : '';
  }

  protected copyJoinLink(): void {
    const url = this.joinLinkUrl();
    if (url) {
      this.clipboard.copy(url);
      this.toast('Join link copied');
    }
  }

  protected async removeMember(address: string): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      await firstValueFrom(this.api.removeMember(this.id(), address, token));
      this.detail.reload();
    } catch {
      this.toast('Remove failed');
    }
  }

  protected async reconfirm(address: string): Promise<void> {
    const mt = this.store.memberToken(`${this.id()}:${address}`);
    if (!mt) {
      this.toast('No member token stored for this address in this browser');
      return;
    }
    try {
      await firstValueFrom(this.api.reconfirmMember(this.id(), address, mt));
      this.toast('Confirmed');
      this.detail.reload();
    } catch {
      this.toast('Confirm failed');
    }
  }

  protected async dissolve(): Promise<void> {
    const token = this.adminToken();
    if (!token) return;
    try {
      await firstValueFrom(this.api.dissolve(this.id(), token));
      this.store.clearAdminToken(`bp:${this.id()}`);
      this.toast('Party dissolved');
      this.detail.reload();
    } catch {
      this.toast('Dissolve failed');
    }
  }
}
