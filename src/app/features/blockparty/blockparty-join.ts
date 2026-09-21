import { Component, inject, input, signal } from '@angular/core';
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
import { poll } from '../../shared/poll';
import { EmptyComponent } from '../../shared/empty.component';
import { TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-blockparty-join',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    EmptyComponent,
    TimeAgoPipe,
  ],
  template: `
    <div class="page narrow">
      @if (joined(); as j) {
        <section class="panel done">
          <mat-icon class="big-ok">check_circle</mat-icon>
          <h1>You're in!</h1>
          <p class="muted">
            Save this member token — it confirms your share if the admin requests confirmation.
            Stored in this browser.
          </p>
          <code class="mono token">{{ j.memberToken }}</code>
          <a mat-flat-button color="primary" [routerLink]="['/blockparty', j.groupId]">Open party</a>
        </section>
      } @else {
        @if (ctx.value(); as c) {
          <section class="panel">
            <h1 class="page-title"><mat-icon>celebration</mat-icon> Join {{ c.groupName }}</h1>
            <p class="muted">Link expires {{ c.expiresAt | timeAgo }}.</p>
            <form [formGroup]="form" (ngSubmit)="join()" class="join-form">
              <mat-form-field>
                <mat-label>Your payout address</mat-label>
                <input matInput formControlName="address" class="mono" />
                @if (form.controls.address.hasError('address')) {
                  <mat-error>Invalid Bitcoin address</mat-error>
                }
              </mat-form-field>
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">
                Join
              </button>
            </form>
          </section>
        } @else {
          <app-empty
            [loading]="ctx.isLoading()"
            [error]="ctx.error() ? 'Join link is invalid or expired.' : null"
          />
        }
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 560px; margin-top: 40px; }
    .page-title { display: flex; align-items: center; gap: 10px; font-weight: 700;
      mat-icon { color: var(--mat-sys-primary); } }
    .join-form { display: flex; flex-direction: column; gap: 8px; margin-top: 16px;
      button { align-self: flex-start; } }
    .done { text-align: center; padding: 40px; }
    .big-ok { font-size: 56px; width: 56px; height: 56px; color: #4caf50; }
    .token { display: block; padding: 14px; border-radius: 8px; word-break: break-all;
      background: var(--mat-sys-surface-container-highest); color: var(--mat-sys-primary);
      margin: 16px 0; }
  `,
})
export class BlockpartyJoinComponent {
  readonly token = input.required<string>();

  private readonly api = inject(BlockpartyApi);
  private readonly store = inject(LocalStore);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly busy = signal(false);
  protected readonly joined = signal<{ memberToken: string; groupId: string } | null>(null);

  protected readonly ctx = poll({
    params: () => ({ token: this.token() }),
    stream: (p) => this.api.joinContext(p.token),
  });

  protected readonly form = this.fb.group({
    address: ['', [Validators.required, (c) => this.validAddress(c.value)]],
  });

  private validAddress(v: string | null | undefined) {
    try {
      return validate(v ?? '') ? null : { address: true };
    } catch {
      return { address: true };
    }
  }

  protected async join(): Promise<void> {
    const address = this.form.value.address?.trim();
    if (!address) return;
    this.busy.set(true);
    try {
      const res = await firstValueFrom(this.api.join(this.token(), address));
      this.store.setMemberToken(`${res.groupId}:${address}`, res.memberToken);
      this.store.rememberAddress(address);
      this.joined.set(res);
    } catch {
      this.snack.open('Could not join — link may be expired', 'OK');
    } finally {
      this.busy.set(false);
    }
  }
}
