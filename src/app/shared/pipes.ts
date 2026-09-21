import { Pipe, PipeTransform } from '@angular/core';

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

@Pipe({ name: 'hashrate', standalone: true, pure: true })
export class HashratePipe implements PipeTransform {
  transform = formatHashrate;
}

@Pipe({ name: 'count', standalone: true, pure: true })
export class CountPipe implements PipeTransform {
  transform = formatCount;
}

@Pipe({ name: 'diff', standalone: true, pure: true })
export class DifficultyPipe implements PipeTransform {
  transform = formatDifficulty;
}

@Pipe({ name: 'sats', standalone: true, pure: true })
export class SatsPipe implements PipeTransform {
  transform = formatSats;
}

@Pipe({ name: 'btc', standalone: true, pure: true })
export class BtcPipe implements PipeTransform {
  transform = formatBtc;
}

@Pipe({ name: 'bytes', standalone: true, pure: true })
export class BytesPipe implements PipeTransform {
  transform = formatBytes;
}

@Pipe({ name: 'timeAgo', standalone: true, pure: true })
export class TimeAgoPipe implements PipeTransform {
  transform = timeAgo;
}

@Pipe({ name: 'maskAddress', standalone: true, pure: true })
export class MaskAddressPipe implements PipeTransform {
  transform = maskAddress;
}

@Pipe({ name: 'avgTimeToBlock', standalone: true, pure: true })
export class AvgTimeToBlockPipe implements PipeTransform {
  transform = averageTimeToBlock;
}
