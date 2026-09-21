import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import {
  AddressJoinRequest,
  BestDifficultyResponse,
  ChartPoint,
  CoinbaseCapacity,
  CreateGroupResponse,
  CreateJoinRequestResponse,
  GroupDetailResponse,
  GroupDistributionResponse,
  GroupHashrateResponse,
  GroupHistoryEntry,
  GroupSummary,
  InviteAcceptResponse,
  JoinRequestEntry,
  OpenInvite,
  OpenInviteDetails,
  OpenInviteStatus,
  PublicGroupDetail,
  PublicGroupListResponse,
  RangeParam,
  SlotDataResponse,
  RejectedResponse,
  UpdateGroupSettingsBody,
  WindowTimelineResponse,
} from './models';

/**
 * `/api/pplns/groups*` + `/api/pplns/invitations*`.
 * Admin-gated calls take the group's `x-admin-token`; the caller pulls it
 * from TokenStore (minted once at group creation / transfer).
 */
@Injectable({ providedIn: 'root' })
export class GroupsApi extends ApiService {
  // ── Public directory ──────────────────────────────────────────────

  listPublic(page = 1, pageSize = 20): Observable<PublicGroupListResponse> {
    return this.get('/api/pplns/groups/public', {
      page: String(page),
      pageSize: String(pageSize),
    });
  }

  publicDetail(id: string): Observable<PublicGroupDetail> {
    return this.get(`/api/pplns/groups/public/${id}`);
  }

  createJoinRequest(
    id: string,
    address: string,
    message?: string,
  ): Observable<CreateJoinRequestResponse> {
    return this.http.post<CreateJoinRequestResponse>(
      this.url(`/api/pplns/groups/public/${id}/join-request`),
      { address, message },
    );
  }

  // ── Address-scoped reads ──────────────────────────────────────────

  byAddress(address: string, adminToken?: string): Observable<GroupDetailResponse> {
    return this.http.get<GroupDetailResponse>(
      this.url(`/api/pplns/groups/by-address/${encodeURIComponent(address)}`),
      adminToken ? this.adminHeaders(adminToken) : {},
    );
  }

  joinRequestsByAddress(address: string): Observable<AddressJoinRequest[]> {
    return this.get(`/api/pplns/groups/join-requests/by-address/${encodeURIComponent(address)}`);
  }

  coinbaseCapacity(): Observable<CoinbaseCapacity> {
    return this.get('/api/pplns/groups/coinbase-capacity');
  }

  // ── Group detail reads ────────────────────────────────────────────

  detail(id: string, viewer?: string, adminToken?: string): Observable<GroupDetailResponse> {
    return this.http.get<GroupDetailResponse>(this.url(`/api/pplns/groups/${id}`), {
      params: viewer ? { viewer } : {},
      ...(adminToken ? this.adminHeaders(adminToken) : {}),
    });
  }

  hashrate(id: string): Observable<GroupHashrateResponse> {
    return this.get(`/api/pplns/groups/${id}/hashrate`);
  }

  chart(id: string, range: RangeParam = '1d'): Observable<ChartPoint[]> {
    return this.get(`/api/pplns/groups/${id}/chart`, { range });
  }

  accepted(id: string, range: RangeParam = '1d'): Observable<SlotDataResponse> {
    return this.get(`/api/pplns/groups/${id}/accepted`, { range });
  }

  rejected(id: string, range: RangeParam = '1d'): Observable<RejectedResponse> {
    return this.get(`/api/pplns/groups/${id}/rejected`, { range });
  }

  distribution(id: string): Observable<GroupDistributionResponse> {
    return this.get(`/api/pplns/groups/${id}/distribution`);
  }

  windowTimeline(id: string): Observable<WindowTimelineResponse> {
    return this.get(`/api/pplns/groups/${id}/window-timeline`);
  }

  bestDifficulty(id: string): Observable<BestDifficultyResponse> {
    return this.get(`/api/pplns/groups/${id}/best-difficulty`);
  }

  history(id: string, limit = 50): Observable<GroupHistoryEntry[]> {
    return this.get(`/api/pplns/groups/${id}/history`, { limit: String(limit) });
  }

  // ── Admin lifecycle (x-admin-token) ───────────────────────────────

  create(name: string, creatorAddress: string, mode?: string): Observable<CreateGroupResponse> {
    return this.http.post<CreateGroupResponse>(this.url('/api/pplns/groups'), {
      name,
      creatorAddress,
      ...(mode ? { mode } : {}),
    });
  }

  transfer(id: string, toAddress: string, token: string): Observable<GroupSummary & { adminToken: string }> {
    return this.http.post<GroupSummary & { adminToken: string }>(
      this.url(`/api/pplns/groups/${id}/transfer`),
      { toAddress },
      this.adminHeaders(token),
    );
  }

  updateSettings(
    id: string,
    body: UpdateGroupSettingsBody,
    token: string,
  ): Observable<GroupSummary> {
    return this.http.patch<GroupSummary>(
      this.url(`/api/pplns/groups/${id}/settings`),
      body,
      this.adminHeaders(token),
    );
  }

  dissolve(id: string, token: string): Observable<{ dissolved: boolean }> {
    return this.http.delete<{ dissolved: boolean }>(
      this.url(`/api/pplns/groups/${id}`),
      this.adminHeaders(token),
    );
  }

  removeMember(id: string, address: string, token: string): Observable<{ removed: boolean }> {
    return this.http.delete<{ removed: boolean }>(
      this.url(`/api/pplns/groups/${id}/members/${encodeURIComponent(address)}`),
      this.adminHeaders(token),
    );
  }

  // ── Join requests (admin) ─────────────────────────────────────────

  listJoinRequests(id: string, includeDecided = false, token?: string): Observable<JoinRequestEntry[]> {
    return this.http.get<JoinRequestEntry[]>(
      this.url(`/api/pplns/groups/${id}/join-requests`),
      {
        params: includeDecided ? { includeDecided: 'true' } : {},
        ...(token ? this.adminHeaders(token) : {}),
      },
    );
  }

  approveJoinRequest(id: string, requestId: string, token: string): Observable<{ approved: boolean }> {
    return this.http.post<{ approved: boolean }>(
      this.url(`/api/pplns/groups/${id}/join-requests/${requestId}/approve`),
      {},
      this.adminHeaders(token),
    );
  }

  rejectJoinRequest(id: string, requestId: string, token: string): Observable<{ rejected: boolean }> {
    return this.http.post<{ rejected: boolean }>(
      this.url(`/api/pplns/groups/${id}/join-requests/${requestId}/reject`),
      {},
      this.adminHeaders(token),
    );
  }

  // ── Open invitations (admin) ──────────────────────────────────────

  createOpenInvite(
    id: string,
    ttl: string,
    approvalRequired: boolean,
    token: string,
  ): Observable<OpenInvite> {
    return this.http.post<OpenInvite>(
      this.url(`/api/pplns/groups/${id}/invitations/open`),
      { ttl, approvalRequired },
      this.adminHeaders(token),
    );
  }

  revokeOpenInvite(id: string, token: string): Observable<{ revoked: boolean }> {
    return this.http.delete<{ revoked: boolean }>(
      this.url(`/api/pplns/groups/${id}/invitations/open`),
      this.adminHeaders(token),
    );
  }

  openInviteStatus(id: string, token: string): Observable<OpenInviteStatus> {
    return this.http.get<OpenInviteStatus>(
      this.url(`/api/pplns/groups/${id}/invitations/open/active`),
      this.adminHeaders(token),
    );
  }

  // ── Public invitation acceptance ──────────────────────────────────

  openInvite(token: string): Observable<OpenInviteDetails> {
    return this.get(`/api/pplns/invitations/open/${encodeURIComponent(token)}`);
  }

  acceptOpenInvite(token: string, address: string): Observable<InviteAcceptResponse> {
    return this.http.post<InviteAcceptResponse>(
      this.url(`/api/pplns/invitations/open/${encodeURIComponent(token)}/accept`),
      { address },
    );
  }
}
