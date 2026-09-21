import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';
import {
  ChallengeResponse,
  DownstreamReport,
  EmailByAddress,
  EmailRegisterResponse,
  EmailVerifyResponse,
  ExternalShareBody,
  ExternalShareResponse,
  ExtranonceSetResponse,
  ExtranonceTokenResponse,
  FcmRegisterResponse,
  OwnershipByAddress,
  OwnershipVerifyResponse,
  PushStatus,
  TopDifficultyEntry,
  VerifiedStatus,
} from './models';

/**
 * Account-ish surfaces: address ownership proof, custom extranonce,
 * email + push notifications, external shares, downstream reports.
 */
@Injectable({ providedIn: 'root' })
export class AccountApi extends ApiService {
  // ── Address ownership (signature challenge) ───────────────────────

  ownershipChallenge(address: string): Observable<ChallengeResponse> {
    return this.http.post<ChallengeResponse>(this.url('/api/address/ownership/challenge'), {
      address,
    });
  }

  ownershipVerify(address: string, signature: string): Observable<OwnershipVerifyResponse> {
    return this.http.post<OwnershipVerifyResponse>(this.url('/api/address/ownership/verify'), {
      address,
      signature,
    });
  }

  ownership(address: string): Observable<OwnershipByAddress> {
    return this.get(`/api/address/ownership/${encodeURIComponent(address)}`);
  }

  verifiedStatus(address: string): Observable<VerifiedStatus> {
    return this.get(`/api/address/verified/${encodeURIComponent(address)}`);
  }

  // ── Custom extranonce ─────────────────────────────────────────────

  extranonceChallenge(address: string): Observable<ChallengeResponse> {
    return this.http.post<ChallengeResponse>(this.url('/api/address/extranonce/challenge'), {
      address,
    });
  }

  extranonceToken(address: string, signature: string): Observable<ExtranonceTokenResponse> {
    return this.http.post<ExtranonceTokenResponse>(this.url('/api/address/extranonce/token'), {
      address,
      signature,
    });
  }

  extranonceSet(
    address: string,
    workers: { worker: string; extranonce: string }[],
    token: string,
  ): Observable<ExtranonceSetResponse> {
    return this.http.post<ExtranonceSetResponse>(
      this.url('/api/address/extranonce/set'),
      { address, workers },
      this.bearerHeaders(token),
    );
  }

  // ── Email ─────────────────────────────────────────────────────────

  registerEmail(address: string, email: string): Observable<EmailRegisterResponse> {
    return this.http.post<EmailRegisterResponse>(this.url('/api/email/register'), {
      address,
      email,
    });
  }

  verifyEmail(token: string): Observable<EmailVerifyResponse> {
    return this.get(`/api/email/verify/${encodeURIComponent(token)}`);
  }

  emailByAddress(address: string): Observable<EmailByAddress> {
    return this.get(`/api/email/by-address/${encodeURIComponent(address)}`);
  }

  // ── Push notifications ────────────────────────────────────────────

  pushInfo(): Observable<Record<string, unknown>> {
    return this.get('/api/push/info');
  }

  pushRegister(
    address: string,
    endpoint: string,
    platform: string,
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(this.url('/api/push/register'), {
      address,
      endpoint,
      platform,
    });
  }

  pushUnregister(address: string, endpoint: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(this.url('/api/push/unregister'), {
      address,
      endpoint,
    });
  }

  pushStatus(address: string): Observable<PushStatus> {
    return this.get(`/api/push/status/${encodeURIComponent(address)}`);
  }

  pushConfigure(
    address: string,
    endpoint: string,
    flags: {
      bestDiffNotifications?: boolean;
      deviceNotifications?: boolean;
      blockNotifications?: boolean;
      networkDiffNotifications?: boolean;
    },
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(this.url('/api/push/configure'), {
      address,
      endpoint,
      ...flags,
    });
  }

  pushRegisterFcm(
    address: string,
    token: string,
    platform?: string,
  ): Observable<FcmRegisterResponse> {
    return this.http.post<FcmRegisterResponse>(this.url('/api/push/fcm/register'), {
      address,
      token,
      ...(platform ? { platform } : {}),
    });
  }

  pushUnregisterFcm(address: string, token?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(this.url('/api/push/fcm/unregister'), {
      address,
      ...(token ? { token } : {}),
    });
  }

  // ── External shares / downstream reports ──────────────────────────

  topDifficulties(): Observable<TopDifficultyEntry[]> {
    return this.get('/api/share/top-difficulties');
  }

  submitShare(body: ExternalShareBody, apiKey?: string): Observable<ExternalShareResponse> {
    return this.http.post<ExternalShareResponse>(this.url('/api/share'), body, {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    });
  }

  downstreamReports(): Observable<DownstreamReport[]> {
    return this.get('/api/downstream-report');
  }
}
