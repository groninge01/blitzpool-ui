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

import { GroupsApi } from '../../core/api/groups.service';
import { LocalStore } from '../../core/state/local.store';
import { poll } from '../../shared/poll';
import { EmptyComponent } from '../../shared/empty.component';
import { TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-invite',
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
      @if (accepted(); as a) {
        <section class="panel done">
          <mat-icon class="big-ok">check_circle</mat-icon>
          <h1>You joined {{ groupName() }}</h1>
          <p class="muted">Role: {{ a.role }} · joined {{ a.joinedAt | timeAgo }}</p>
          <div class="row">
            <a mat-flat-button color="primary" [routerLink]="['/groups', a.groupId]">Open group</a>
            <a mat-stroked-button [routerLink]="['/address', a.address]">Your dashboard</a>
          </div>
        </section>
      } @else {
        @if (invite.value(); as inv) {
          <section class="panel">
            <h1 class="page-title"><mat-icon>mail</mat-icon> Group invite</h1>
            <p>
              You've been invited to join <strong>{{ inv.groupName }}</strong>.
              Link expires {{ inv.expiresAt | timeAgo }}.
            </p>
            @if (inv.approvalRequired) {
              <p class="muted">This invite requires admin approval — you'll join once approved.</p>
            }
            <form [formGroup]="form" (ngSubmit)="accept()" class="join-form">
              <mat-form-field>
                <mat-label>Your payout address</mat-label>
                <input matInput formControlName="address" class="mono" />
                @if (form.controls.address.hasError('address')) {
                  <mat-error>Invalid Bitcoin address</mat-error>
                }
              </mat-form-field>
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">
                Join group
              </button>
            </form>
          </section>
        } @else {
          <app-empty
            [loading]="invite.isLoading()"
            [error]="invite.error() ? 'Invite link is invalid or expired.' : null"
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
    .row { display: flex; gap: 12px; justify-content: center; margin-top: 16px; }
  `,
})
export class InviteComponent {
  readonly token = input.required<string>();

  private readonly api = inject(GroupsApi);
  private readonly store = inject(LocalStore);
  private readonly snack = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly busy = signal(false);
  protected readonly accepted = signal<{ address: string; role: string; joinedAt: string; groupId: string } | null>(null);
  protected readonly groupName = signal('');

  protected readonly invite = poll({
    params: () => ({ token: this.token() }),
    stream: (p) => this.api.openInvite(p.token),
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

  protected async accept(): Promise<void> {
    const address = this.form.value.address?.trim();
    if (!address) return;
    this.busy.set(true);
    try {
      const res = await firstValueFrom(this.api.acceptOpenInvite(this.token(), address));
      this.store.rememberAddress(address);
      this.groupName.set(this.invite.value()?.groupName ?? 'the group');
      this.accepted.set(res);
    } catch {
      this.snack.open('Could not join — invite may require approval or has expired', 'OK');
    } finally {
      this.busy.set(false);
    }
  }
}
