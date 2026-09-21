import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import {
  BlockpartyByAddress,
  BlockpartyCreateResponse,
  BlockpartyDetail,
  BlockpartyHistoryRow,
  BlockpartyJoinContext,
  BlockpartyJoinLinkStatus,
  BlockpartyJoinResponse,
} from './models';

/**
 * `/api/blockparty*` — fixed-split mining parties.
 * Admin calls take `x-admin-token`; member calls take `x-member-token`.
 */
@Injectable({ providedIn: 'root' })
export class BlockpartyApi extends ApiService {
  byAddress(address: string): Observable<BlockpartyByAddress> {
    return this.get(`/api/blockparty/by-address/${encodeURIComponent(address)}`);
  }

  detail(id: string): Observable<BlockpartyDetail> {
    return this.get(`/api/blockparty/${id}`);
  }

  memberView(id: string, address: string, memberToken?: string): Observable<BlockpartyDetail> {
    return this.http.get<BlockpartyDetail>(
      this.url(`/api/blockparty/${id}/member-view/${encodeURIComponent(address)}`),
      memberToken ? this.memberHeaders(memberToken) : {},
    );
  }

  history(id: string): Observable<BlockpartyHistoryRow[]> {
    return this.get(`/api/blockparty/${id}/history`);
  }

  // ── Admin lifecycle ───────────────────────────────────────────────

  create(name: string, adminAddress: string, adminPercentBp: number): Observable<BlockpartyCreateResponse> {
    return this.http.post<BlockpartyCreateResponse>(this.url('/api/blockparty'), {
      name,
      adminAddress,
      adminPercentBp,
    });
  }

  updateSplits(
    id: string,
    splits: { address: string; percentBp: number }[],
    token: string,
  ): Observable<BlockpartyDetail> {
    return this.http.patch<BlockpartyDetail>(
      this.url(`/api/blockparty/${id}/splits`),
      { splits },
      this.adminHeaders(token),
    );
  }

  requestConfirmation(id: string, token: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      this.url(`/api/blockparty/${id}/request-confirmation`),
      {},
      this.adminHeaders(token),
    );
  }

  updateRentalHint(
    id: string,
    hint: string | null,
    token: string,
  ): Observable<{ rentalProviderHint: string | null }> {
    return this.http.patch<{ rentalProviderHint: string | null }>(
      this.url(`/api/blockparty/${id}/rental-hint`),
      { hint },
      this.adminHeaders(token),
    );
  }

  transitionConfirming(id: string, token: string): Observable<{ status?: string }> {
    return this.http.post<{ status?: string }>(
      this.url(`/api/blockparty/${id}/transition-confirming`),
      {},
      this.adminHeaders(token),
    );
  }

  dissolve(id: string, token: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      this.url(`/api/blockparty/${id}/dissolve`),
      {},
      this.adminHeaders(token),
    );
  }

  removeMember(id: string, address: string, token: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(
      this.url(`/api/blockparty/${id}/members/${encodeURIComponent(address)}`),
      this.adminHeaders(token),
    );
  }

  // ── Join links ────────────────────────────────────────────────────

  joinLinkStatus(id: string, token: string): Observable<BlockpartyJoinLinkStatus> {
    return this.http.get<BlockpartyJoinLinkStatus>(
      this.url(`/api/blockparty/${id}/join-link`),
      this.adminHeaders(token),
    );
  }

  createJoinLink(id: string, ttl: string, token: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(
      this.url(`/api/blockparty/${id}/join-link`),
      { ttl },
      this.adminHeaders(token),
    );
  }

  revokeJoinLink(id: string, token: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(
      this.url(`/api/blockparty/${id}/join-link`),
      this.adminHeaders(token),
    );
  }

  joinContext(token: string): Observable<BlockpartyJoinContext> {
    return this.get(`/api/blockparty/join/${encodeURIComponent(token)}`);
  }

  join(token: string, address: string): Observable<BlockpartyJoinResponse> {
    return this.http.post<BlockpartyJoinResponse>(
      this.url(`/api/blockparty/join/${encodeURIComponent(token)}`),
      { address },
    );
  }

  // ── Member-token gated ────────────────────────────────────────────

  reconfirmMember(
    id: string,
    address: string,
    memberToken: string,
  ): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(
      this.url(`/api/blockparty/${id}/members/${encodeURIComponent(address)}/reconfirm`),
      {},
      this.memberHeaders(memberToken),
    );
  }
}
