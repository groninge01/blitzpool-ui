import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { validate } from 'bitcoin-address-validation';

import { GroupsApi } from '../../core/api/groups.service';
import { LocalStore } from '../../core/state/local.store';

@Component({
  selector: 'app-group-create',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="page narrow">
      <a routerLink="/groups" class="back-link"><mat-icon>arrow_back</mat-icon> Groups</a>
      <h1 class="page-title"><mat-icon>group_add</mat-icon> Create a group</h1>

      @if (result(); as r) {
        <section class="panel token-panel">
          <h2 class="panel-title">Group "{{ r.name }}" created</h2>
          <p class="muted">
            Save this admin token — it's shown <strong>once</strong> and required for every admin action.
            It's been stored in this browser.
          </p>
          <code class="mono token">{{ r.adminToken }}</code>
          <div class="row">
            <a mat-flat-button color="primary" [routerLink]="['/groups', r.id]">Open group</a>
          </div>
        </section>
      } @else {
        <section class="panel">
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field>
              <mat-label>Group name</mat-label>
              <input matInput formControlName="name" maxlength="64" />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Your payout address (becomes group admin)</mat-label>
              <input matInput formControlName="creatorAddress" class="mono" />
              @if (form.controls.creatorAddress.hasError('address')) {
                <mat-error>Invalid Bitcoin address</mat-error>
              }
            </mat-form-field>

            <div class="mode-row">
              <span class="muted">Payout mode</span>
              <mat-button-toggle-group formControlName="mode">
                <mat-button-toggle value="prop">Proportional</mat-button-toggle>
                <mat-button-toggle value="window">Window</mat-button-toggle>
              </mat-button-toggle-group>
            </div>
            <p class="muted small">
              Proportional splits each block by round shares. Window uses a sliding share window.
              The mode is fixed at creation.
            </p>

            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">
              Create group
            </button>
          </form>
        </section>
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 640px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 12px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; } }
    .page-title { display: flex; align-items: center; gap: 10px; font-weight: 700; margin: 0 0 20px;
      mat-icon { color: var(--mat-sys-primary); } }
    form { display: flex; flex-direction: column; gap: 8px; }
    .mode-row { display: flex; align-items: center; gap: 16px; margin: 8px 0; }
    .small { font-size: 0.8rem; }
    .token-panel { border-color: var(--mat-sys-primary); }
    .token {
      display: block; padding: 14px; border-radius: 8px; word-break: break-all;
      background: var(--mat-sys-surface-container-highest); margin-bottom: 16px;
      color: var(--mat-sys-primary); font-size: 0.95rem;
    }
    .row { margin-top: 4px; }
  `,
})
export class GroupCreateComponent {
  private readonly api = inject(GroupsApi);
  private readonly store = inject(LocalStore);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly busy = signal(false);
  protected readonly result = signal<{ id: string; name: string; adminToken: string } | null>(null);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
    creatorAddress: ['', [Validators.required, (c) => this.addressValid(c.value)]],
    mode: ['prop' as 'prop' | 'window'],
  });

  private addressValid(v: string) {
    try {
      return validate(v ?? '') ? null : { address: true };
    } catch {
      return { address: true };
    }
  }

  protected async submit(): Promise<void> {
    const { name, creatorAddress, mode } = this.form.value;
    if (!name || !creatorAddress) return;
    this.busy.set(true);
    try {
      const res = await firstValueFrom(
        this.api.create(name.trim(), creatorAddress.trim(), mode ?? 'prop'),
      );
      this.store.setAdminToken(res.id, res.adminToken);
      this.store.rememberAddress(creatorAddress.trim());
      this.result.set({ id: res.id, name: res.name, adminToken: res.adminToken });
    } catch {
      this.snack.open('Failed to create group', 'OK');
    } finally {
      this.busy.set(false);
    }
  }
}
