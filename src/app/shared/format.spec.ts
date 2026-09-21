import { describe, expect, it } from 'vitest';

import {
  averageTimeToBlock,
  formatBtc,
  formatBytes,
  formatCount,
  formatDifficulty,
  formatHashrate,
  formatSats,
  maskAddress,
  timeAgo,
} from './format';

describe('formatHashrate', () => {
  it('scales to the right unit', () => {
    expect(formatHashrate(0)).toBe('0.00 H/s');
    expect(formatHashrate(500)).toBe('500 H/s');
    expect(formatHashrate(4_500)).toBe('4.50 kH/s');
    expect(formatHashrate(1.2e9)).toBe('1.20 GH/s');
    expect(formatHashrate(65e15)).toBe('65.0 PH/s');
  });

  it('handles nullish input', () => {
    expect(formatHashrate(null)).toBe('0.00 H/s');
    expect(formatHashrate(undefined)).toBe('0.00 H/s');
  });
});

describe('formatCount / formatDifficulty', () => {
  it('formats counts with suffixes', () => {
    expect(formatCount(999)).toBe('999');
    expect(formatCount(12_345)).toBe('12.3 k');
  });

  it('formats difficulty', () => {
    expect(formatDifficulty(1_500_000)).toBe('1.50 M');
    expect(formatDifficulty(null)).toBe('0.00');
  });
});

describe('formatSats / formatBtc', () => {
  it('formats satoshis', () => {
    expect(formatSats(1_234_567)).toBe('1,234,567 sats');
    expect(formatSats(null)).toBe('0 sats');
  });

  it('converts sats to BTC', () => {
    expect(formatBtc(100_000_000)).toBe('1.00000000 BTC');
    expect(formatBtc(50_000)).toBe('0.00050000 BTC');
  });
});

describe('formatBytes', () => {
  it('formats binary units', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KiB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MiB');
  });
});

describe('timeAgo', () => {
  it('handles nullish and invalid input', () => {
    expect(timeAgo(null)).toBe('—');
    expect(timeAgo('not a date')).toBe('—');
  });

  it('formats recent times', () => {
    expect(timeAgo(Date.now() - 2_000)).toBe('just now');
    expect(timeAgo(Date.now() - 30_000)).toBe('30s ago');
    expect(timeAgo(Date.now() - 10 * 60_000)).toBe('10m ago');
    expect(timeAgo(Date.now() - 3 * 3_600_000)).toBe('3h 0m ago');
    expect(timeAgo(Date.now() - 2 * 86_400_000)).toBe('2d 0h ago');
  });
});

describe('averageTimeToBlock', () => {
  it('returns a dash for zero input', () => {
    expect(averageTimeToBlock(0, 1e12)).toBe('—');
    expect(averageTimeToBlock(1e12, 0)).toBe('—');
  });

  it('estimates realistic durations', () => {
    // 1 PH/s vs difficulty 1: 2^32 / 1e15 s ≈ 4.3 ms
    expect(averageTimeToBlock(1e15, 1)).toMatch(/second/);
  });
});

describe('maskAddress', () => {
  it('masks long addresses', () => {
    const addr = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
    expect(maskAddress(addr)).toBe('bc1qw5…v8f3t4');
  });

  it('passes through short values', () => {
    expect(maskAddress('bc1abc')).toBe('bc1abc');
    expect(maskAddress(null)).toBe('—');
  });
});
