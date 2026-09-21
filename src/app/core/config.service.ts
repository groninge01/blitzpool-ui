import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

interface RuntimeConfig {
  API_URL?: string;
  STRATUM_URL?: string;
  SECURE_STRATUM_URL?: string;
  STRATUM_V2_URL?: string;
  PPLNS_STRATUM_URL?: string;
  PPLNS_SECURE_STRATUM_URL?: string;
  PPLNS_STRATUM_V2_URL?: string;
  PPLNS_DATUM_URL?: string;
}

declare global {
  interface Window {
    __BLITZPOOL_CONFIG__?: RuntimeConfig;
  }
}

/**
 * Resolves pool endpoints. Build-time `environment` values are the
 * default; `assets/runtime-config.js` (generated at container start or
 * by the Cloudflare Pages function) may override any of them without a
 * rebuild.
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  get apiUrl(): string {
    return this.normalizeBaseUrl(this.runtime('API_URL') ?? environment.API_URL);
  }

  get stratumUrl(): string {
    return this.resolveHostPort(this.runtime('STRATUM_URL') ?? environment.STRATUM_URL, 3333);
  }

  get secureStratumUrl(): string {
    return this.resolveHostPort(
      this.runtime('SECURE_STRATUM_URL') ?? environment.SECURE_STRATUM_URL,
      4333,
    );
  }

  get stratumV2Url(): string {
    return this.runtime('STRATUM_V2_URL') ?? environment.STRATUM_V2_URL;
  }

  get pplnsStratumUrl(): string {
    return this.runtime('PPLNS_STRATUM_URL') ?? environment.PPLNS_STRATUM_URL;
  }

  get pplnsSecureStratumUrl(): string {
    return this.runtime('PPLNS_SECURE_STRATUM_URL') ?? environment.PPLNS_SECURE_STRATUM_URL;
  }

  get pplnsStratumV2Url(): string {
    return this.runtime('PPLNS_STRATUM_V2_URL') ?? environment.PPLNS_STRATUM_V2_URL;
  }

  get pplnsDatumUrl(): string {
    return this.runtime('PPLNS_DATUM_URL') ?? environment.PPLNS_DATUM_URL;
  }

  private runtime(key: keyof RuntimeConfig): string | undefined {
    if (
      typeof window === 'undefined' ||
      !window.__BLITZPOOL_CONFIG__ ||
      !Object.prototype.hasOwnProperty.call(window.__BLITZPOOL_CONFIG__, key)
    ) {
      return undefined;
    }
    const value = window.__BLITZPOOL_CONFIG__[key];
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
  }

  private normalizeBaseUrl(value: string): string {
    return value.trim().replace(/\/+$/, '');
  }

  private resolveHostPort(value: string, fallbackPort: number): string {
    const configured = value.trim();
    if (configured) return configured;
    const host = typeof window === 'undefined' ? 'localhost' : window.location.hostname;
    return `${host}:${fallbackPort}`;
  }
}
