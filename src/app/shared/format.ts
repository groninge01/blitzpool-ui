// Pure formatting helpers shared by pipes and components.

const HASH_UNITS = ['H/s', 'kH/s', 'MH/s', 'GH/s', 'TH/s', 'PH/s', 'EH/s', 'ZH/s'];
const COUNT_UNITS = ['', 'k', 'M', 'G', 'T', 'P', 'E'];
const DIFF_UNITS = ['', 'K', 'M', 'G', 'T', 'P', 'E'];

function scaled(value: number, units: string[], base = 1000): string {
  if (!isFinite(value)) return '0 ' + units[0];
  const negative = value < 0;
  let v = Math.abs(value);
  let i = 0;
  while (v >= base && i < units.length - 1) {
    v /= base;
    i++;
  }
  const text = v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  return `${negative ? '-' : ''}${text} ${units[i]}`.trimEnd();
}

export function formatHashrate(hps: number | null | undefined): string {
  return scaled(hps ?? 0, HASH_UNITS);
}

export function formatCount(n: number | null | undefined): string {
  return scaled(n ?? 0, COUNT_UNITS);
}

export function formatDifficulty(d: number | null | undefined): string {
  return scaled(d ?? 0, DIFF_UNITS);
}

export function formatSats(sats: number | null | undefined): string {
  const v = sats ?? 0;
  return `${v.toLocaleString('en-US')} sats`;
}

export function formatBtc(sats: number | null | undefined): string {
  const v = (sats ?? 0) / 1e8;
  return `${v.toFixed(8)} BTC`;
}

export function formatBytes(bytes: number): string {
  if (!isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

export function timeAgo(isoOrMs: string | number | null | undefined): string {
  if (isoOrMs == null) return '—';
  const t = typeof isoOrMs === 'number' ? isoOrMs : Date.parse(isoOrMs);
  if (!isFinite(t)) return '—';
  const secs = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ${hours % 24}h ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Expected time for `hashrate` H/s to find a block at `difficulty`. */
export function averageTimeToBlock(hashrate: number, networkDifficulty: number): string {
  if (!hashrate || !networkDifficulty || hashrate <= 0) return '—';
  const seconds = (networkDifficulty * 2 ** 32) / hashrate;
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.345, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  let v = seconds;
  let unit = 'second';
  for (const [div, name] of units) {
    if (v < div || div === Number.POSITIVE_INFINITY) {
      unit = name;
      break;
    }
    v /= div;
  }
  const rounded = v >= 100 ? Math.round(v) : v >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
  return `${rounded} ${unit}${rounded === 1 ? '' : 's'}`;
}

export function maskAddress(address: string | null | undefined): string {
  if (!address) return '—';
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}
