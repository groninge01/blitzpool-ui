import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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
    ...(opts.params ? { params: opts.params } : { params: () => undefined as unknown as P }),
    stream: ({ params }) => timer(0, intervalMs).pipe(switchMap(() => opts.stream(params))),
  });
}
