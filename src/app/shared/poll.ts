import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * rxResource treats `params() === undefined` as "idle" and never
 * fetches, so parameterless polls need a stable non-undefined value.
 */
const NO_PARAMS = {} as never;

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
  return rxResource<T, P>({
    params: opts.params ?? (() => NO_PARAMS as P),
    stream: ({ params }) => timer(0, intervalMs).pipe(switchMap(() => opts.stream(params))),
  });
}
