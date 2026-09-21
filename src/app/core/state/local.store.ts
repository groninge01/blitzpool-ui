import { Injectable, signal } from '@angular/core';

const PREFIX = 'blitzpool:';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — private mode etc. */
  }
}

/**
 * Client-side persisted state: admin/member/extranonce tokens, recent
 * address searches, theme preference. Tokens are keyed by the entity
 * they authorize (group id, party id, address).
 */
@Injectable({ providedIn: 'root' })
export class LocalStore {
  readonly theme = signal<'dark' | 'light'>(readJson('theme', 'dark'));
  readonly recentAddresses = signal<string[]>(readJson('recentAddresses', []));

  private readonly adminTokens = signal<Record<string, string>>(readJson('adminTokens', {}));
  private readonly memberTokens = signal<Record<string, string>>(readJson('memberTokens', {}));
  private readonly extranonceTokens = signal<Record<string, string>>(
    readJson('extranonceTokens', {}),
  );

  setTheme(theme: 'dark' | 'light'): void {
    this.theme.set(theme);
    writeJson('theme', theme);
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }

  applyTheme(): void {
    document.documentElement.classList.toggle('light-theme', this.theme() === 'light');
  }

  rememberAddress(address: string): void {
    const list = [address, ...this.recentAddresses().filter((a) => a !== address)].slice(0, 8);
    this.recentAddresses.set(list);
    writeJson('recentAddresses', list);
  }

  forgetAddress(address: string): void {
    const list = this.recentAddresses().filter((a) => a !== address);
    this.recentAddresses.set(list);
    writeJson('recentAddresses', list);
  }

  adminToken(groupId: string): string | undefined {
    return this.adminTokens()[groupId];
  }

  setAdminToken(groupId: string, token: string): void {
    const next = { ...this.adminTokens(), [groupId]: token };
    this.adminTokens.set(next);
    writeJson('adminTokens', next);
  }

  clearAdminToken(groupId: string): void {
    const next = { ...this.adminTokens() };
    delete next[groupId];
    this.adminTokens.set(next);
    writeJson('adminTokens', next);
  }

  memberToken(key: string): string | undefined {
    return this.memberTokens()[key];
  }

  setMemberToken(key: string, token: string): void {
    const next = { ...this.memberTokens(), [key]: token };
    this.memberTokens.set(next);
    writeJson('memberTokens', next);
  }

  extranonceToken(address: string): string | undefined {
    return this.extranonceTokens()[address];
  }

  setExtranonceToken(address: string, token: string): void {
    const next = { ...this.extranonceTokens(), [address]: token };
    this.extranonceTokens.set(next);
    writeJson('extranonceTokens', next);
  }
}
