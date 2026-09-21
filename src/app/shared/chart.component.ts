import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  input,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

/**
 * Shared 24h time-axis formats (date-fns patterns via
 * chartjs-adapter-date-fns — its defaults are 12h `h:mm a`/`ha`).
 * Spread into a chart's x scale: `x: { type: 'time', time: TIME_SCALE_24H, ... }`.
 */
export const TIME_SCALE_24H = {
  tooltipFormat: 'PP HH:mm:ss',
  displayFormats: {
    datetime: 'MMM d, yyyy HH:mm:ss',
    millisecond: 'HH:mm:ss.SSS',
    second: 'HH:mm:ss',
    minute: 'HH:mm',
    hour: 'HH:mm',
  },
};

/** Thin Chart.js wrapper — feeds a full configuration via input signal. */
@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<div class="chart-box"><canvas #canvas></canvas></div>`,
})
export class ChartComponent implements AfterViewInit {
  readonly config = input.required<ChartConfiguration | null>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor(destroyRef: DestroyRef) {
    // Config changes after the chart exists → update in place.
    effect(() => {
      const cfg = this.config();
      if (!this.chart) return;
      if (cfg) {
        this.chart.data = cfg.data;
        if (cfg.options) this.chart.options = cfg.options;
        this.chart.update();
      } else {
        this.chart.destroy();
        this.chart = null;
      }
    });
    destroyRef.onDestroy(() => {
      this.chart?.destroy();
      this.chart = null;
    });
  }

  ngAfterViewInit(): void {
    const cfg = this.config();
    if (cfg) {
      this.chart = new Chart(this.canvas().nativeElement, cfg);
    }
  }
}
