import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import {
  ChartPoint,
  ClientResponse,
  DiffScoresResponse,
  RangeParam,
  RejectedResponse,
  SessionResponse,
  SlotDataResponse,
  StatusResponse,
  WorkerResponse,
  WorkerShareEntry,
} from './models';

/** `/api/client/:address*` — miner/worker read + maintenance endpoints. */
@Injectable({ providedIn: 'root' })
export class ClientApi extends ApiService {
  info(address: string): Observable<ClientResponse> {
    return this.get(`/api/client/${encodeURIComponent(address)}`);
  }

  chart(address: string, range: RangeParam = '1d'): Observable<ChartPoint[]> {
    return this.get(`/api/client/${encodeURIComponent(address)}/chart`, { range });
  }

  accepted(address: string, range: RangeParam = '1d'): Observable<SlotDataResponse> {
    return this.get(`/api/client/${encodeURIComponent(address)}/accepted`, { range });
  }

  workers(address: string, range: RangeParam = '1d'): Observable<SlotDataResponse> {
    return this.get(`/api/client/${encodeURIComponent(address)}/workers`, { range });
  }

  rejected(address: string, range: RangeParam = '1d'): Observable<RejectedResponse> {
    return this.get(`/api/client/${encodeURIComponent(address)}/rejected`, { range });
  }

  diffScores(address: string, range: RangeParam = '1d'): Observable<DiffScoresResponse> {
    return this.get(`/api/client/${encodeURIComponent(address)}/diff-scores`, { range });
  }

  workerShares(address: string): Observable<WorkerShareEntry[]> {
    return this.get(`/api/client/${encodeURIComponent(address)}/worker-shares`);
  }

  worker(address: string, worker: string): Observable<WorkerResponse> {
    return this.get(
      `/api/client/${encodeURIComponent(address)}/${encodeURIComponent(worker)}`,
    );
  }

  session(address: string, worker: string, session: string): Observable<SessionResponse> {
    return this.get(
      `/api/client/${encodeURIComponent(address)}/${encodeURIComponent(worker)}/${encodeURIComponent(session)}`,
    );
  }

  reset(address: string): Observable<StatusResponse> {
    return this.http.post<StatusResponse>(
      this.url(`/api/client/${encodeURIComponent(address)}/reset`),
      {},
    );
  }

  deleteStats(address: string): Observable<StatusResponse> {
    return this.http.post<StatusResponse>(
      this.url(`/api/client/${encodeURIComponent(address)}/delete-stats`),
      {},
    );
  }

  deleteAll(address: string): Observable<StatusResponse> {
    return this.http.post<StatusResponse>(
      this.url(`/api/client/${encodeURIComponent(address)}/delete-all`),
      {},
    );
  }
}
