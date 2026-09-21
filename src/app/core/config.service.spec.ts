import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { ConfigService } from './config.service';

describe('ConfigService', () => {
  afterEach(() => {
    window.__BLITZPOOL_CONFIG__ = undefined;
  });

  function create(): ConfigService {
    TestBed.resetTestingModule();
    return TestBed.inject(ConfigService);
  }

  it('falls back to environment values', () => {
    const config = create();
    expect(config.stratumUrl).toBe('localhost:3333');
    expect(config.secureStratumUrl).toBe('localhost:4333');
  });

  it('prefers runtime config over environment', () => {
    window.__BLITZPOOL_CONFIG__ = {
      API_URL: 'https://pool.example.com/',
      STRATUM_URL: 'stratum.example.com:3333',
    };
    const config = create();
    expect(config.apiUrl).toBe('https://pool.example.com');
    expect(config.stratumUrl).toBe('stratum.example.com:3333');
  });

  it('ignores blank runtime values', () => {
    window.__BLITZPOOL_CONFIG__ = { STRATUM_URL: '   ' };
    const config = create();
    expect(config.stratumUrl).toBe('localhost:3333');
  });

  it('derives stratum host from the page when unset', () => {
    const config = create();
    expect(config.stratumUrl).toContain(':3333');
  });
});
