import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import {
  ChartMode,
  ChartPoint,
  ClientBlockTemplateResponse,
  CoreInfoResponse,
  DifficultyResponse,
  HealthResponse,
  InfoResponse,
  NetworkInfoResponse,
  NextBlockReward,
  PeerEntry,
  PoolResponse,
  RangeParam,
  SharesResponse,
  SlotDataResponse,
  VersionResponse,
} from './models';

/** `/api/info*`, `/api/pool`, `/api/network`, `/api/health`. */
@Injectable({ providedIn: 'root' })
export class PoolApi extends ApiService {
  info(): Observable<InfoResponse> {
    return this.get('/api/info');
  }

  chart(range: RangeParam = '1d'): Observable<ChartPoint[]> {
    return this.get('/api/info/chart', { range });
  }

  chartByMode(mode: ChartMode, range: '1d' | '3d' | '7d' = '7d'): Observable<ChartPoint[]> {
    return this.get(`/api/info/chart/mode/${mode}`, { range });
  }

  version(): Observable<VersionResponse> {
    return this.get('/api/info/version');
  }

  core(): Observable<CoreInfoResponse> {
    return this.get('/api/info/core');
  }

  peers(): Observable<PeerEntry[]> {
    return this.get('/api/info/peers');
  }

  difficulty(): Observable<DifficultyResponse> {
    return this.get('/api/info/difficulty');
  }

  blockTemplate(): Observable<Record<string, unknown>> {
    return this.get('/api/info/block-template');
  }

  nextBlockReward(): Observable<NextBlockReward> {
    return this.get('/api/info/next-block-reward');
  }

  clientBlockTemplate(address: string): Observable<ClientBlockTemplateResponse> {
    return this.get(`/api/client/${encodeURIComponent(address)}/block-template`);
  }

  accepted(range: RangeParam = '1d'): Observable<SlotDataResponse> {
    return this.get('/api/info/accepted', { range });
  }

  workers(range: RangeParam = '1d'): Observable<SlotDataResponse> {
    return this.get('/api/info/workers', { range });
  }

  rejected(range: RangeParam = '1d'): Observable<SlotDataResponse> {
    return this.get('/api/info/rejected', { range });
  }

  shares(): Observable<SharesResponse> {
    return this.get('/api/info/shares');
  }

  pool(): Observable<PoolResponse> {
    return this.get('/api/pool');
  }

  network(): Observable<NetworkInfoResponse> {
    return this.get('/api/network');
  }

  health(): Observable<HealthResponse> {
    return this.get('/api/health');
  }
}
