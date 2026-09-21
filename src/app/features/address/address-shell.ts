import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-address-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule, MatIconModule, MatButtonModule],
  template: `
    <div class="page">
      <header class="addr-head">
        <div class="addr-line">
          <mat-icon>person</mat-icon>
          <code class="mono">{{ address() }}</code>
          <button mat-icon-button (click)="copy()" aria-label="Copy address">
            <mat-icon>content_copy</mat-icon>
          </button>
        </div>
      </header>

      <nav mat-tab-nav-bar [tabPanel]="panel" aria-label="Miner sections">
        @for (tab of tabs; track tab.link) {
          <a
            mat-tab-link
            [routerLink]="tab.link"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: tab.exact }"
          >
            {{ tab.label }}
          </a>
        }
      </nav>

      <mat-tab-nav-panel #panel class="tab-body">
        <router-outlet />
      </mat-tab-nav-panel>
    </div>
  `,
  styles: `
    .addr-head { margin-bottom: 8px; }
    .addr-line {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      word-break: break-all;
      mat-icon { color: var(--mat-sys-primary); }
    }
    .tab-body { padding-top: 20px; }
  `,
})
export class AddressShellComponent {
  readonly address = input.required<string>();

  private readonly clipboard = inject(Clipboard);
  private readonly snack = inject(MatSnackBar);

  protected readonly tabs = [
    { label: 'Overview', link: 'overview', exact: false },
    { label: 'Stats', link: 'stats', exact: false },
    { label: 'PPLNS', link: 'pplns', exact: false },
    { label: 'Groups & parties', link: 'groups', exact: false },
    { label: 'Settings', link: 'settings', exact: false },
  ];

  protected copy(): void {
    this.clipboard.copy(this.address());
    this.snack.open('Address copied', 'OK');
  }
}
