import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { delay, of, throwError } from 'rxjs';

import { poll } from './poll';

describe('poll params', () => {
  it('refetches when the params signal changes', async () => {
    const range = signal('1d');
    const calls: string[] = [];
    const res = TestBed.runInInjectionContext(() =>
      poll<{ range: string }, string>({
        intervalMs: 60_000,
        params: () => ({ range: range() }),
        stream: (p) => {
          calls.push(p.range);
          return of(p.range).pipe(delay(5));
        },
      }),
    );
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 1200));
    TestBed.tick();
    expect(res.value()).toBe('1d');

    range.set('7d');
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 2000));
    TestBed.tick();
    expect(calls).toContain('7d');
    expect(res.value()).toBe('7d');
  });

  it('value() returns undefined instead of throwing when the stream errors', async () => {
    const res = TestBed.runInInjectionContext(() =>
      poll<never, number>({
        intervalMs: 60_000,
        stream: () => throwError(() => new Error('boom')),
      }),
    );
    TestBed.tick();
    await new Promise((r) => setTimeout(r, 4000)); // 2 retries at 1s delay
    TestBed.tick();
    expect(res.status()).toBe('error');
    expect(() => res.value()).not.toThrow();
    expect(res.value()).toBeUndefined();
    expect(res.error()).toBeTruthy();
  }, 15000);
});
