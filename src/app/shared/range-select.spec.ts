import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { RangeSelectComponent } from './range-select.component';
import { RangeParam } from '../core/api/models';

@Component({
  standalone: true,
  imports: [RangeSelectComponent],
  template: `<app-range-select [value]="v" (valueChange)="on($event)" />`,
})
class Host {
  v: RangeParam = '1d';
  emitted: RangeParam[] = [];
  on(e: RangeParam) {
    this.emitted.push(e);
    this.v = e;
  }
}

describe('RangeSelectComponent', () => {
  it('emits valueChange when a toggle is clicked', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();

    const toggles = fixture.nativeElement.querySelectorAll('mat-button-toggle');
    const target = [...toggles].find((t: any) => t.textContent.trim() === '7d') as HTMLElement;
    expect(target).toBeTruthy();

    const btn = target.querySelector('button') as HTMLElement;
    (btn ?? target).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.emitted).toEqual(['7d']);
  });
});
