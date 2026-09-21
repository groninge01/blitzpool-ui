import { Component, input, output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { RangeParam } from '../core/api/models';

const RANGES: { value: RangeParam; label: string }[] = [
  { value: '1d', label: '24h' },
  { value: '3d', label: '3d' },
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
  { value: '1m', label: '1m' },
];

@Component({
  selector: 'app-range-select',
  standalone: true,
  imports: [MatButtonToggleModule],
  template: `
    <mat-button-toggle-group
      [value]="value()"
      (change)="valueChange.emit($event.value)"
      aria-label="Time range"
    >
      @for (r of ranges; track r.value) {
        <mat-button-toggle [value]="r.value">{{ r.label }}</mat-button-toggle>
      }
    </mat-button-toggle-group>
  `,
})
export class RangeSelectComponent {
  readonly value = input.required<RangeParam>();
  readonly valueChange = output<RangeParam>();
  protected readonly ranges = RANGES;
}
