import { Component, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { firstValueFrom } from 'rxjs';

import { AccountApi } from '../../core/api/account.service';
import { ClientApi } from '../../core/api/client.service';
import { LocalStore } from '../../core/state/local.store';
import { poll } from '../../shared/poll';
import { TimeAgoPipe } from '../../shared/pipes';
import { timeAgo } from '../../shared/format';

@Component({
  selector: 'app-address-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TimeAgoPipe,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class AddressSettingsComponent {
  readonly address = input.required<string>();

  protected readonly store = inject(LocalStore);
  protected readonly fmt = { timeAgo };
  private readonly accountApi = inject(AccountApi);
  private readonly clientApi = inject(ClientApi);
  private readonly snack = inject(MatSnackBar);
  private readonly clipboard = inject(Clipboard);
  private readonly fb = inject(FormBuilder);

  // ── Ownership proof ──────────────────────────────────────────────
  protected readonly ownership = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.accountApi.ownership(p.address),
  });
  protected readonly verified = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.accountApi.verifiedStatus(p.address),
  });
  protected readonly challenge = signal<{ message: string; expiresAt: number } | null>(null);
  protected readonly signatureForm = this.fb.group({
    signature: ['', Validators.required],
  });
  protected readonly proving = signal(false);

  // ── Custom extranonce ────────────────────────────────────────────
  protected readonly enChallenge = signal<{ message: string; expiresAt: number } | null>(null);
  protected readonly enTokenForm = this.fb.group({ signature: ['', Validators.required] });
  protected readonly enSetForm = this.fb.group({
    worker: ['', Validators.required],
    extranonce: ['', [Validators.required, Validators.pattern(/^[0-9a-fA-F]{8}$/)]],
  });
  protected readonly enBusy = signal(false);

  // ── Email ────────────────────────────────────────────────────────
  protected readonly email = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.accountApi.emailByAddress(p.address),
  });
  protected readonly emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  protected readonly emailBusy = signal(false);

  // ── Push ─────────────────────────────────────────────────────────
  protected readonly push = poll({
    intervalMs: 60_000,
    params: () => ({ address: this.address() }),
    stream: (p) => this.accountApi.pushStatus(p.address),
  });
  protected readonly pushForm = this.fb.group({
    endpoint: ['', Validators.required],
    platform: ['unifiedpush', Validators.required],
  });
  protected readonly pushFlags = this.fb.group({
    bestDiffNotifications: [true],
    deviceNotifications: [true],
    blockNotifications: [true],
    networkDiffNotifications: [true],
  });

  protected readonly extranonceToken = computed(() => this.store.extranonceToken(this.address()));

  protected toast(msg: string): void {
    this.snack.open(msg, 'OK');
  }

  protected async startOwnershipChallenge(): Promise<void> {
    try {
      this.challenge.set(await firstValueFrom(this.accountApi.ownershipChallenge(this.address())));
    } catch {
      this.toast('Challenge request failed (rate limited?)');
    }
  }

  protected copyChallenge(): void {
    const c = this.challenge();
    if (c) {
      this.clipboard.copy(c.message);
      this.toast('Challenge message copied — sign it with your wallet');
    }
  }

  protected async submitOwnershipProof(): Promise<void> {
    const signature = this.signatureForm.value.signature?.trim();
    if (!signature) return;
    this.proving.set(true);
    try {
      await firstValueFrom(this.accountApi.ownershipVerify(this.address(), signature));
      this.toast('Address ownership verified');
      this.challenge.set(null);
      this.signatureForm.reset();
      this.ownership.reload();
      this.verified.reload();
    } catch {
      this.toast('Verification failed — bad signature?');
    } finally {
      this.proving.set(false);
    }
  }

  protected async startExtranonceChallenge(): Promise<void> {
    try {
      this.enChallenge.set(await firstValueFrom(this.accountApi.extranonceChallenge(this.address())));
    } catch {
      this.toast('Challenge request failed (rate limited?)');
    }
  }

  protected copyEnChallenge(): void {
    const c = this.enChallenge();
    if (c) {
      this.clipboard.copy(c.message);
      this.toast('Challenge message copied');
    }
  }

  protected async mintExtranonceToken(): Promise<void> {
    const signature = this.enTokenForm.value.signature?.trim();
    if (!signature) return;
    this.enBusy.set(true);
    try {
      const res = await firstValueFrom(
        this.accountApi.extranonceToken(this.address(), signature),
      );
      this.store.setExtranonceToken(this.address(), res.token);
      this.enChallenge.set(null);
      this.enTokenForm.reset();
      this.toast('Extranonce token minted and stored locally');
    } catch {
      this.toast('Token mint failed — bad signature?');
    } finally {
      this.enBusy.set(false);
    }
  }

  protected async setExtranonce(): Promise<void> {
    const token = this.extranonceToken();
    const worker = this.enSetForm.value.worker?.trim();
    const extranonce = this.enSetForm.value.extranonce?.trim();
    if (!token || !worker || !extranonce) return;
    this.enBusy.set(true);
    try {
      await firstValueFrom(
        this.accountApi.extranonceSet(this.address(), [{ worker, extranonce }], token),
      );
      this.enSetForm.reset();
      this.toast(`Extranonce set for ${worker}`);
    } catch {
      this.toast('Failed to set extranonce');
    } finally {
      this.enBusy.set(false);
    }
  }

  // ── Email / push ──────────────────────────────────────────────────

  protected async registerEmail(): Promise<void> {
    const email = this.emailForm.value.email?.trim();
    if (!email) return;
    this.emailBusy.set(true);
    try {
      const res = await firstValueFrom(this.accountApi.registerEmail(this.address(), email));
      this.toast(res.verificationSent ? 'Verification email sent' : 'Registered');
      this.email.reload();
    } catch {
      this.toast('Registration failed (rate limited?)');
    } finally {
      this.emailBusy.set(false);
    }
  }

  protected async registerPush(): Promise<void> {
    const { endpoint, platform } = this.pushForm.value;
    if (!endpoint?.trim() || !platform) return;
    try {
      await firstValueFrom(
        this.accountApi.pushRegister(this.address(), endpoint.trim(), platform),
      );
      this.toast('Push subscription registered');
      this.push.reload();
    } catch {
      this.toast('Push registration failed');
    }
  }

  protected async unregisterPush(endpoint: string): Promise<void> {
    try {
      await firstValueFrom(this.accountApi.pushUnregister(this.address(), endpoint));
      this.push.reload();
    } catch {
      this.toast('Unregister failed');
    }
  }

  protected async configurePush(endpoint: string): Promise<void> {
    const f = this.pushFlags.value;
    try {
      await firstValueFrom(
        this.accountApi.pushConfigure(this.address(), endpoint, {
          bestDiffNotifications: f.bestDiffNotifications ?? undefined,
          deviceNotifications: f.deviceNotifications ?? undefined,
          blockNotifications: f.blockNotifications ?? undefined,
          networkDiffNotifications: f.networkDiffNotifications ?? undefined,
        }),
      );
      this.toast('Notification preferences saved');
      this.push.reload();
    } catch {
      this.toast('Configure failed');
    }
  }

  // ── Danger zone ───────────────────────────────────────────────────

  protected async resetStats(): Promise<void> {
    try {
      await firstValueFrom(this.clientApi.reset(this.address()));
      this.toast('Best-difficulty counter reset');
    } catch {
      this.toast('Reset failed');
    }
  }

  protected async deleteStats(): Promise<void> {
    try {
      await firstValueFrom(this.clientApi.deleteStats(this.address()));
      this.toast('Statistics deleted');
    } catch {
      this.toast('Delete failed');
    }
  }

  protected async deleteAll(): Promise<void> {
    try {
      await firstValueFrom(this.clientApi.deleteAll(this.address()));
      this.toast('All address data deleted');
    } catch {
      this.toast('Delete failed');
    }
  }
}
