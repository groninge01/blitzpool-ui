import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { of, throwError } from 'rxjs';
import { ChartConfiguration } from 'chart.js';

import { HomeComponent } from './home';
import { ChartComponent } from '../../shared/chart.component';
import { PoolApi } from '../../core/api/pool.service';
import { PplnsApi } from '../../core/api/pplns.service';
import { AccountApi } from '../../core/api/account.service';

@Component({ selector: 'app-chart', standalone: true, template: '' })
class StubChart {
  readonly config = input<ChartConfiguration | null>(null);
}

const chartCalls: string[] = [];
const point = (n: number) => ({ label: '2026-09-23T00:00:00.000Z', data: n });

const poolApiStub = {
  pool: () => of({ totalHashRate: 1, blockHeight: 1, blocksFound: [] }),
  info: () => of({ userAgents: [], blockData: [], highScores: [] }),
  network: () => of({ difficulty: 1 }),
  difficulty: () => of({ current: 1, previous: 1 }),
  nextBlockReward: () => of({ rewardSats: 1, feeSats: 0, height: 1 }),
  health: () => of({ status: 'healthy', checks: { database: 'ok' } }),
  shares: () => of({}),
  chart: (range: string) => {
    chartCalls.push(range);
    // encode range in the payload length so tests can see which data won
    return of(range === '1d' ? [point(1)] : [point(1), point(2)]);
  },
  chartByMode: () => of([]),
};

// Reproduces the reported failure: an errored poll resource made
// `pplns.value()` throw mid-template, freezing every later binding —
// including the range selector and the chart's `config` input.
const pplnsStub = { status: () => throwError(() => new Error('503')) };
const accountStub = {};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('HomeComponent range selector', () => {
  it('updates the pool chart when a range toggle is clicked', async () => {
    TestBed.overrideComponent(HomeComponent, {
      remove: { imports: [ChartComponent] },
      add: { imports: [StubChart] },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: PoolApi, useValue: poolApiStub },
        { provide: PplnsApi, useValue: pplnsStub },
        { provide: AccountApi, useValue: accountStub },
      ],
    });

    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await sleep(3000); // first polls + pplns error settle
    TestBed.tick();
    fixture.detectChanges();

    expect(chartCalls).toContain('1d');
    chartCalls.length = 0;

    const toggles: HTMLElement[] = [
      ...fixture.nativeElement.querySelectorAll('mat-button-toggle'),
    ];
    const target = toggles.find((t) => t.textContent?.trim() === '7d');
    expect(target).toBeTruthy();
    (target!.querySelector('button') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    fixture.detectChanges();
    await sleep(2500);
    TestBed.tick();
    fixture.detectChanges();

    expect(chartCalls).toContain('7d');

    // The regression: chart's config input must actually receive the new data.
    const stub = fixture.debugElement.query(By.directive(StubChart));
    const cfg = (stub.componentInstance as StubChart).config();
    expect(cfg?.data.datasets[0].data.length).toBe(2);
  }, 20000);
});
