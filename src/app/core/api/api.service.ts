import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ConfigService } from '../config.service';

/**
 * Base for the typed API services. Resolves the server base URL from
 * runtime config and exposes small helpers for the auth headers used
 * by group/blockparty admin routes and the extranonce bearer token.
 */
export abstract class ApiService {
  protected readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  protected url(path: string): string {
    return `${this.config.apiUrl}${path}`;
  }

  protected adminHeaders(token: string): { headers: Record<string, string> } {
    return { headers: { 'x-admin-token': token } };
  }

  protected memberHeaders(token: string): { headers: Record<string, string> } {
    return { headers: { 'x-member-token': token } };
  }

  protected bearerHeaders(token: string): { headers: Record<string, string> } {
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  protected get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.http.get<T>(this.url(path), { params });
  }
}
