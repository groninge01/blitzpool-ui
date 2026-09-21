import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, timer } from 'rxjs';
import { retry, switchMap, timeout } from 'rxjs/operators';

/**
 * rxResource treats `params() === undefined` as "idle" and never
 * fetches, so parameterless polls need a stable non-undefined value.
 */
const NO_PARAMS = {} as never;

/**
 * Stagger first emissions so a page full of polls doesn't fire every
 * request in the same tick against the browser's per-host connection
 * limit (stalled fetches were leaving resources stuck in "loading").
 */
let pollOffset = 0;
const STAGGER_MS = 150;

/**
 * rxResource that re-emits on an interval — the app's standard
 * "live stats" pattern. `params` drives both the request and the
 * polling loop; each tick re-subscribes to `stream`.
 */
export function poll<P, T>(opts: {
  intervalMs?: number;
  params?: () => P;
  stream: (params: P) => Observable<T>;
}) {
  const intervalMs = opts.intervalMs ?? 60_000;
  const offset = (pollOffset++ % 8) * STAGGER_MS;
  return rxResource<T, P>({
    params: opts.params ?? (() => NO_PARAMS as P),
    stream: ({ params }) =>
      timer(offset, intervalMs).pipe(
        switchMap(() => opts.stream(params).pipe(timeout(15_000), retry({ count: 2, delay: 1_000 }))),
      ),
  });
}
