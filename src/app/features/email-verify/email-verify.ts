import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AccountApi } from '../../core/api/account.service';
import { poll } from '../../shared/poll';
import { EmptyComponent } from '../../shared/empty.component';
import { TimeAgoPipe } from '../../shared/pipes';

@Component({
  selector: 'app-email-verify',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, EmptyComponent, TimeAgoPipe],
  template: `
    <div class="page narrow">
      @if (result.value(); as r) {
        <section class="panel done">
          <mat-icon class="big-ok">mark_email_read</mat-icon>
          <h1>Email verified</h1>
          <p class="muted">
            <strong>{{ r.email }}</strong> is now linked to
            <span class="mono">{{ r.address }}</span> ({{ r.verifiedAt | timeAgo }}).
          </p>
          <a mat-flat-button color="primary" [routerLink]="['/address', r.address]">
            Open dashboard
          </a>
        </section>
      } @else {
        <app-empty
          [loading]="result.isLoading()"
          [error]="result.error() ? 'Verification link is invalid or expired.' : null"
        />
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 560px; margin-top: 40px; }
    .done { text-align: center; padding: 40px; }
    .big-ok { font-size: 56px; width: 56px; height: 56px; color: #4caf50; }
    .mono { word-break: break-all; }
  `,
})
export class EmailVerifyComponent {
  readonly token = input.required<string>();
  private readonly api = inject(AccountApi);

  protected readonly result = poll({
    params: () => ({ token: this.token() }),
    stream: (p) => this.api.verifyEmail(p.token),
  });
}
