import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { delay, of } from 'rxjs';

import { poll } from './poll';

describe('poll', () => {
  it('resolves a parameterless poll', async () => {
    const res = TestBed.runInInjectionContext(() =>
      poll({ intervalMs: 60_000, stream: () => of(42).pipe(delay(5)) }),
    );
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 100));
    TestBed.tick();
    expect(res.value()).toBe(42);
  });
});
