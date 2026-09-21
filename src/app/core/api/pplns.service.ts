import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import {
  ChartPoint,
  PplnsAddressSummary,
  PplnsDistributionEntry,
  PplnsFees,
  PplnsHistoryEntry,
  PplnsLedger,
  PplnsModeResponse,
  PplnsRoot,
  PplnsStatus,
  RangeParam,
} from './models';

/** `/api/pplns*` — pool PPLNS lane readers (group endpoints live in GroupsApi). */
@Injectable({ providedIn: 'root' })
export class PplnsApi extends ApiService {
  root(): Observable<PplnsRoot> {
    return this.get('/api/pplns');
  }

  status(): Observable<PplnsStatus> {
    return this.get('/api/pplns/status');
  }

  mode(address: string): Observable<PplnsModeResponse> {
    return this.get(`/api/pplns/mode/${encodeURIComponent(address)}`);
  }

  fees(): Observable<PplnsFees> {
    return this.get('/api/pplns/fees');
  }

  distribution(): Observable<PplnsDistributionEntry[]> {
    return this.get('/api/pplns/distribution');
  }

  ledger(): Observable<PplnsLedger> {
    return this.get('/api/pplns/ledger');
  }

  chart(range: RangeParam = '1d'): Observable<ChartPoint[]> {
    return this.get('/api/pplns/chart', { range });
  }

  addressSummary(address: string): Observable<PplnsAddressSummary> {
    return this.get(`/api/pplns/${encodeURIComponent(address)}`);
  }

  addressHistory(address: string, limit = 50): Observable<PplnsHistoryEntry[]> {
    return this.get(`/api/pplns/${encodeURIComponent(address)}/history`, {
      limit: String(limit),
    });
  }
}
