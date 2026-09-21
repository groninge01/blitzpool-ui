import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Shared loading / error / empty row for panels and tables. */
@Component({
  selector: 'app-empty',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    @if (loading()) {
      <div class="loading-row"><mat-spinner diameter="28" /> <span>Loading…</span></div>
    } @else if (error()) {
      <div class="error-banner">{{ error() }}</div>
    } @else {
      <div class="loading-row">
        <mat-icon>inbox</mat-icon> <span>{{ message() }}</span>
      </div>
    }
  `,
})
export class EmptyComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly message = input('Nothing here yet');
}
