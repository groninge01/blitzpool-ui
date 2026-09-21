import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { validate } from 'bitcoin-address-validation';

import { BlockpartyApi } from '../../core/api/blockparty.service';
import { LocalStore } from '../../core/state/local.store';

@Component({
  selector: 'app-blockparty-create',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="page narrow">
      <h1 class="page-title"><mat-icon>celebration</mat-icon> Create a blockparty</h1>
      <p class="muted">
        A blockparty is a fixed-split party: when a member's miner finds a block, the coinbase
        pays everyone by the configured shares.
      </p>

      @if (result(); as r) {
        <section class="panel token-panel">
          <h2 class="panel-title">Party "{{ r.group.name }}" created</h2>
          <p class="muted">
            Admin token (shown once, stored in this browser) — required for splits, join links,
            member management:
          </p>
          <code class="mono token">{{ r.adminToken }}</code>
          <p class="muted">Pool fee: {{ r.poolFeePercent }}%</p>
          <a mat-flat-button color="primary" [routerLink]="['/blockparty', r.group.id]">Open party</a>
        </section>
      } @else {
        <section class="panel">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field>
              <mat-label>Party name</mat-label>
              <input matInput formControlName="name" maxlength="64" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Your payout address (admin)</mat-label>
              <input matInput formControlName="adminAddress" class="mono" />
              @if (form.controls.adminAddress.hasError('address')) {
                <mat-error>Invalid Bitcoin address</mat-error>
              }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Admin share (basis points — 2500 = 25%)</mat-label>
              <input matInput type="number" formControlName="adminPercentBp" />
              <mat-hint>Remaining share is assigned later via the splits editor</mat-hint>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">
              Create party
            </button>
          </form>
        </section>
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 560px; }
    .page-title { display: flex; align-items: center; gap: 10px; font-weight: 700;
      mat-icon { color: var(--mat-sys-primary); } }
    form { display: flex; flex-direction: column; gap: 8px; }
    .token-panel { border-color: var(--mat-sys-primary); }
    .token { display: block; padding: 14px; border-radius: 8px; word-break: break-all;
      background: var(--mat-sys-surface-container-highest); color: var(--mat-sys-primary);
      margin-bottom: 16px; }
  `,
})
export class BlockpartyCreateComponent {
  private readonly api = inject(BlockpartyApi);
  private readonly store = inject(LocalStore);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly busy = signal(false);
  protected readonly result = signal<{
    group: { id: string; name: string };
    adminToken: string;
    poolFeePercent: number;
  } | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
    adminAddress: ['', [Validators.required, (c) => this.validAddress(c.value)]],
    adminPercentBp: [2500, [Validators.required, Validators.min(1), Validators.max(10000)]],
  });

  private validAddress(v: string | null | undefined) {
    try {
      return validate(v ?? '') ? null : { address: true };
    } catch {
      return { address: true };
    }
  }

  protected async submit(): Promise<void> {
    const { name, adminAddress, adminPercentBp } = this.form.value;
    if (!name || !adminAddress || adminPercentBp == null) return;
    this.busy.set(true);
    try {
      const res = await firstValueFrom(
        this.api.create(name.trim(), adminAddress.trim(), adminPercentBp),
      );
      this.store.setAdminToken(`bp:${res.group.id}`, res.adminToken);
      this.store.rememberAddress(adminAddress.trim());
      this.result.set(res);
    } catch {
      this.snack.open('Failed to create party', 'OK');
    } finally {
      this.busy.set(false);
    }
  }
}
